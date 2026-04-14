/**
 * Ingest OFAC SDN List — extracts BTC/ETH/USDT/USDC/TRX/SOL addresses and
 * upserts them into scam_addresses with category='sanctioned', verified=true.
 *
 * Run: npm run ingest:ofac
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { parseStringPromise } from "xml2js";
import { createClient } from "@supabase/supabase-js";

const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const BATCH_SIZE = 500;

interface ScamRow {
  address: string;
  chain: string;
  category: string;
  source: string;
  source_url: string;
  verified: boolean;
  confidence_score: number;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Map OFAC idType string to our chain identifier.
 * EVM-compatible tokens (USDT ERC-20, USDC) are stored under 'eth' since
 * their addresses are shared across all EVM networks.
 */
function parseChain(idType: string): string | null {
  const t = idType.toLowerCase();
  if (!t.includes("digital currency address")) return null;
  if (t.includes("- eth") || t.includes("- usdt") || t.includes("- usdc") || t.includes("- bnb")) {
    return "eth";
  }
  if (t.includes("- btc") || t.includes("- xbt")) return "btc";
  if (t.includes("- trx") || t.includes("- tron")) return "tron";
  if (t.includes("- sol")) return "solana";
  if (t.includes("- ltc")) return "ltc";
  if (t.includes("- xmr")) return "xmr";
  if (t.includes("- xrp")) return "xrp";
  // Catch remaining "Digital Currency Address - XYZ" formats
  const match = t.match(/digital currency address - ([a-z0-9]+)/);
  if (match) return match[1];
  return null;
}

async function fetchAndParseXml(): Promise<ScamRow[]> {
  console.log(`Fetching OFAC SDN from ${OFAC_SDN_URL} …`);
  const res = await fetch(OFAC_SDN_URL);
  if (!res.ok) {
    throw new Error(`OFAC fetch failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  console.log(`Downloaded ${(xml.length / 1024).toFixed(0)} KB, parsing XML…`);

  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const sdnList = parsed.sdnList ?? parsed["sdnList"];
  if (!sdnList) throw new Error("Unexpected XML structure: no sdnList root");

  const rawEntries = sdnList.sdnEntry;
  if (!rawEntries) return [];
  const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  const rows: ScamRow[] = [];

  for (const entry of entries) {
    const idListContainer = entry.idList;
    if (!idListContainer) continue;
    const rawIds = idListContainer.id;
    if (!rawIds) continue;
    const ids = Array.isArray(rawIds) ? rawIds : [rawIds];

    for (const id of ids) {
      const idType = id.idType ?? id.idtype ?? "";
      const idNumber = id.idNumber ?? id.idnumber ?? "";
      if (!idType || !idNumber) continue;

      const chain = parseChain(String(idType));
      if (!chain) continue;

      const address = String(idNumber).toLowerCase().trim();
      if (!address) continue;

      rows.push({
        address,
        chain,
        category: "sanctioned",
        source: "ofac",
        source_url: "https://www.treasury.gov/ofac/downloads/sdn.xml",
        verified: true,
        confidence_score: 100,
      });
    }
  }

  return rows;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertBatch(db: any, rows: ScamRow[]): Promise<number> {
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await db
      .from("scam_addresses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(batch as any, { ignoreDuplicates: true, count: "exact" });
    if (error) {
      if (error.code === "23505") {
        console.log(`Batch ${i / BATCH_SIZE + 1}: records already exist — skipped (re-run)`);
      } else {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      }
    } else {
      upserted += count ?? batch.length;
    }
  }
  return upserted;
}

export async function main() {
  const db = getSupabaseClient();
  const rows = await fetchAndParseXml();
  console.log(`Parsed ${rows.length} crypto addresses from OFAC SDN list`);

  if (rows.length === 0) {
    console.log("Nothing to ingest.");
    return;
  }

  // Deduplicate within this batch (OFAC can have duplicate entries)
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.address}:${r.chain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`Unique addresses after dedup: ${unique.length}`);

  const inserted = await upsertBatch(db, unique);
  console.log(`OFAC ingest complete — ${inserted} rows upserted`);
}

main().catch((err) => {
  console.error("OFAC ingest failed:", err);
  process.exit(1);
});

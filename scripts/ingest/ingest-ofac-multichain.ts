/**
 * OFAC SDN multichain ingester — duplicates EVM addresses across all EVM chains
 * and marks native BTC/TRX/SOL addresses on their correct chain.
 * Also emits evm-multi rows so lookups work for any EVM chain from a single row.
 *
 * Run: npm run ingest:ofac-multichain
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { parseStringPromise } from "xml2js";
import { getSupabaseClient, upsertBatch, type ScamRow } from "./upsert-helper.js";

const OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const SOURCE_URL = OFAC_SDN_URL;

const BTC_RE = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;
const TRX_RE = /^t[a-zA-Z0-9]{33}$/i;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ETH_RE = /^0x[a-f0-9]{40}$/;

function detectChain(address: string): string | string[] {
  const addr = address.trim().toLowerCase();
  if (ETH_RE.test(addr)) return "evm-multi"; // single row covers all EVM chains
  if (TRX_RE.test(addr)) return "tron";
  if (BTC_RE.test(address.trim())) return "btc";
  if (SOL_RE.test(address.trim())) return "solana";
  return "unknown";
}

function parseChainFromIdType(idType: string): boolean {
  return idType.toLowerCase().includes("digital currency address");
}

export async function main(): Promise<number> {
  console.log("Fetching OFAC SDN (multichain)…");
  const res = await fetch(OFAC_SDN_URL, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`OFAC fetch failed: ${res.status}`);

  const xml = await res.text();
  console.log(`Downloaded ${(xml.length / 1024).toFixed(0)} KB, parsing…`);

  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const sdnList = parsed.sdnList ?? parsed["sdnList"];
  if (!sdnList) throw new Error("No sdnList root");

  const rawEntries = sdnList.sdnEntry;
  if (!rawEntries) return 0;
  const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  const rows: ScamRow[] = [];
  for (const entry of entries) {
    const rawIds = entry.idList?.id;
    if (!rawIds) continue;
    const ids = Array.isArray(rawIds) ? rawIds : [rawIds];
    for (const id of ids) {
      const idType = String(id.idType ?? id.idtype ?? "");
      const idNumber = String(id.idNumber ?? id.idnumber ?? "").trim();
      if (!idNumber || !parseChainFromIdType(idType)) continue;

      const chain = detectChain(idNumber);
      if (chain === "unknown") continue;

      const chains = Array.isArray(chain) ? chain : [chain];
      for (const c of chains) {
        rows.push({
          address: idNumber.toLowerCase(),
          chain: c,
          category: "sanctioned",
          source: "ofac_multichain",
          source_url: SOURCE_URL,
          verified: true,
          confidence_score: 100,
        });
      }
    }
  }

  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.address}:${r.chain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`OFAC multichain: ${unique.length} unique rows (including evm-multi)`);
  if (unique.length === 0) return 0;

  const db = getSupabaseClient();
  const count = await upsertBatch(db, unique);
  console.log(`OFAC multichain ingest complete — ${count} rows upserted`);
  return count;
}

main().catch((err) => { console.error("OFAC multichain ingest failed:", err); process.exit(1); });

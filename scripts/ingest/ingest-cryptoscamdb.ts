/**
 * Ingest MyEtherWallet ethereum-lists darklist — fetches the community-maintained
 * Ethereum scam/phishing address list and upserts into scam_addresses with
 * category='scam', source='mew-darklist', verified=true, confidence=80.
 *
 * Source: https://github.com/MyEtherWallet/ethereum-lists
 *
 * Run: npm run ingest:scamdb
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { createClient } from "@supabase/supabase-js";

const SCAMDB_URL =
  "https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/src/addresses/addresses-darklist.json";
const BATCH_SIZE = 500;

interface ScamRow {
  address: string;
  chain: string;
  category: string;
  source: string;
  source_url: string;
  verified: boolean;
  confidence_score: number;
  notes?: string;
  reported_at?: string;
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

interface DarklistEntry {
  address: string;
  comment?: string;
  date?: string;
}

async function fetchAddresses(): Promise<ScamRow[]> {
  console.log(`Fetching MEW darklist from ${SCAMDB_URL} …`);
  const res = await fetch(SCAMDB_URL);
  if (!res.ok) {
    throw new Error(`MEW darklist fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as DarklistEntry[];
  console.log(`Fetched ${data.length} entries`);

  const rows: ScamRow[] = [];
  for (const entry of data) {
    const address = entry.address?.trim();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) continue;
    rows.push({
      address: address.toLowerCase(),
      chain: "eth",
      category: "scam",
      source: "mew-darklist",
      source_url: SCAMDB_URL,
      verified: true,
      confidence_score: 80,
      notes: entry.comment ?? undefined,
      reported_at: entry.date ? new Date(entry.date).toISOString() : undefined,
    });
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
  const rows = await fetchAddresses();
  console.log(
    `Mapped to ${rows.length} rows with recognised chain identifiers`
  );

  if (rows.length === 0) {
    console.log("Nothing to ingest.");
    return;
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.address}:${r.chain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`Unique addresses after dedup: ${unique.length}`);

  const inserted = await upsertBatch(db, unique);
  console.log(`MEW darklist ingest complete — ${inserted} rows upserted`);
}

main().catch((err) => {
  console.error("MEW darklist ingest failed:", err);
  process.exit(1);
});

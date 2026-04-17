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

import { getSupabaseClient, dedup, upsertBatch, type ScamRow } from "./upsert-helper.js";

const SCAMDB_URL =
  "https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/src/addresses/addresses-darklist.json";

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

export async function main(): Promise<number> {
  const db = getSupabaseClient();
  const rows = await fetchAddresses();
  console.log(`Mapped to ${rows.length} rows`);
  if (rows.length === 0) { console.log("Nothing to ingest."); return 0; }

  const unique = dedup(rows);
  console.log(`Unique addresses after dedup: ${unique.length}`);

  const inserted = await upsertBatch(db, unique);
  console.log(`MEW darklist ingest complete — ${inserted} rows upserted`);
  return inserted;
}

main().catch((err) => {
  console.error("MEW darklist ingest failed:", err);
  process.exit(1);
});

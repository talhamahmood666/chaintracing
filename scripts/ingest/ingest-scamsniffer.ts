/**
 * Ingest ScamSniffer blacklist (plain array of ETH addresses).
 * Source: https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/address.json
 * Format: ["0xabc...", "0xdef...", ...]
 *
 * Run: npm run ingest:scamsniffer
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { getSupabaseClient, dedup, upsertBatch, type ScamRow } from "./upsert-helper.js";

const SOURCE_URL =
  "https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/address.json";

export async function main(): Promise<number> {
  console.log("Fetching ScamSniffer address blacklist…");
  let res: Response;
  try {
    res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    console.warn("ScamSniffer fetch error:", (e as Error).message);
    return 0;
  }
  if (!res.ok) {
    console.warn(`ScamSniffer returned ${res.status} — skipping`);
    return 0;
  }

  const addresses: string[] = await res.json();
  const rows: ScamRow[] = [];

  for (const addr of addresses) {
    if (typeof addr !== "string") continue;
    const trimmed = addr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) continue;
    rows.push({
      address: trimmed.toLowerCase(),
      chain: "eth",
      category: "phishing",
      source: "scamsniffer",
      source_url: SOURCE_URL,
      verified: true,
      confidence_score: 85,
    });
  }

  const unique = dedup(rows);
  console.log(`ScamSniffer: ${unique.length} unique ETH addresses`);
  if (unique.length === 0) { console.log("Nothing to ingest."); return 0; }

  const db = getSupabaseClient();
  const count = await upsertBatch(db, unique);
  console.log(`ScamSniffer ingest complete — ${count} rows upserted`);
  return count;
}

main().catch((err) => { console.error("ScamSniffer ingest failed:", err); process.exit(1); });

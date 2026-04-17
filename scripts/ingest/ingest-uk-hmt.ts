/**
 * Ingest UK HMT Consolidated Sanctions List.
 * Source: https://assets.publishing.service.gov.uk/media/sanctionsconsolidatedlist.json
 * Extracts crypto wallet addresses from any field whose key contains "wallet" or "address".
 *
 * Run: npm run ingest:uk-hmt
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { getSupabaseClient, dedup, upsertBatch, type ScamRow } from "./upsert-helper.js";

const SOURCE_URL = "https://assets.publishing.service.gov.uk/media/sanctionsconsolidatedlist.json";

const ETH_RE = /0x[a-fA-F0-9]{40}/g;
const BTC_RE = /\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/g;
const SOL_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
const TRX_RE = /\bT[a-zA-Z0-9]{33}\b/g;

function extractAddresses(value: string): { address: string; chain: string }[] {
  const results: { address: string; chain: string }[] = [];
  for (const m of value.matchAll(ETH_RE)) results.push({ address: m[0].toLowerCase(), chain: "eth" });
  for (const m of value.matchAll(TRX_RE)) results.push({ address: m[0], chain: "tron" });
  for (const m of value.matchAll(BTC_RE)) results.push({ address: m[0], chain: "btc" });
  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanObject(obj: any, depth = 0): { address: string; chain: string }[] {
  if (depth > 8 || !obj) return [];
  const results: { address: string; chain: string }[] = [];
  if (typeof obj === "string") {
    results.push(...extractAddresses(obj));
  } else if (Array.isArray(obj)) {
    for (const item of obj) results.push(...scanObject(item, depth + 1));
  } else if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const keyLower = k.toLowerCase();
      // Prioritise wallet/crypto/address keyed fields but also scan all string values
      if (
        keyLower.includes("wallet") ||
        keyLower.includes("crypto") ||
        keyLower.includes("address") ||
        typeof v === "string"
      ) {
        results.push(...scanObject(v, depth + 1));
      } else {
        results.push(...scanObject(v, depth + 1));
      }
    }
  }
  return results;
}

export async function main(): Promise<number> {
  console.log("Fetching UK HMT sanctions list…");
  let res: Response;
  try {
    res = await fetch(SOURCE_URL);
  } catch (e) {
    console.error("UK HMT fetch error:", e);
    return 0;
  }
  if (!res.ok) {
    console.warn(`UK HMT returned ${res.status} — skipping`);
    return 0;
  }

  const json = await res.json();
  console.log("Scanning for crypto addresses…");
  const found = scanObject(json);

  const rows: ScamRow[] = found.map(({ address, chain }) => ({
    address,
    chain,
    category: "sanctioned",
    source: "uk_hmt",
    source_url: SOURCE_URL,
    verified: true,
    confidence_score: 100,
  }));

  const unique = dedup(rows);
  console.log(`UK HMT: found ${unique.length} unique crypto addresses`);
  if (unique.length === 0) { console.log("Nothing to ingest."); return 0; }

  const db = getSupabaseClient();
  const count = await upsertBatch(db, unique);
  console.log(`UK HMT ingest complete — ${count} rows upserted`);
  return count;
}

main().catch((err) => { console.error("UK HMT ingest failed:", err); process.exit(1); });

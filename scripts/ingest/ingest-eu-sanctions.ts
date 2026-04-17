/**
 * Ingest EU Consolidated Sanctions List (XML).
 * Source: EU FSF full sanctions XML (public endpoint).
 * Gracefully skips on 403/network error — does not fail run-all.
 *
 * Run: npm run ingest:eu
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { parseStringPromise } from "xml2js";
import { getSupabaseClient, dedup, upsertBatch, type ScamRow } from "./upsert-helper.js";

const SOURCE_URL =
  "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw";

const ETH_RE = /0x[a-fA-F0-9]{40}/g;
const TRX_RE = /\bT[a-zA-Z0-9]{33}\b/g;
const BTC_RE = /\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})\b/g;

function extractAddresses(text: string): { address: string; chain: string }[] {
  const r: { address: string; chain: string }[] = [];
  for (const m of text.matchAll(ETH_RE)) r.push({ address: m[0].toLowerCase(), chain: "eth" });
  for (const m of text.matchAll(TRX_RE)) r.push({ address: m[0], chain: "tron" });
  for (const m of text.matchAll(BTC_RE)) r.push({ address: m[0], chain: "btc" });
  return r;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanXmlNode(node: any): { address: string; chain: string }[] {
  if (!node) return [];
  const results: { address: string; chain: string }[] = [];
  if (typeof node === "string") {
    results.push(...extractAddresses(node));
  } else if (Array.isArray(node)) {
    for (const item of node) results.push(...scanXmlNode(item));
  } else if (typeof node === "object") {
    for (const v of Object.values(node)) results.push(...scanXmlNode(v));
  }
  return results;
}

export async function main(): Promise<number> {
  console.log("Fetching EU consolidated sanctions XML…");
  let res: Response;
  try {
    res = await fetch(SOURCE_URL, {
      headers: { "Accept": "application/xml, text/xml, */*" },
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    console.warn("EU sanctions fetch network error — skipping:", (e as Error).message);
    return 0;
  }

  if (res.status === 403 || res.status === 401) {
    console.warn(`EU sanctions returned ${res.status} (region-blocked or token expired) — skipping`);
    return 0;
  }
  if (!res.ok) {
    console.warn(`EU sanctions returned ${res.status} — skipping`);
    return 0;
  }

  let xml: string;
  try {
    xml = await res.text();
  } catch (e) {
    console.warn("EU sanctions body read error — skipping:", (e as Error).message);
    return 0;
  }

  console.log(`Downloaded ${(xml.length / 1024).toFixed(0)} KB, parsing XML…`);
  let parsed: unknown;
  try {
    parsed = await parseStringPromise(xml, { explicitArray: true });
  } catch (e) {
    console.warn("EU sanctions XML parse error — skipping:", (e as Error).message);
    return 0;
  }

  const found = scanXmlNode(parsed);
  const rows: ScamRow[] = found.map(({ address, chain }) => ({
    address,
    chain,
    category: "sanctioned",
    source: "eu",
    source_url: SOURCE_URL,
    verified: true,
    confidence_score: 100,
  }));

  const unique = dedup(rows);
  console.log(`EU sanctions: found ${unique.length} unique crypto addresses`);
  if (unique.length === 0) { console.log("Nothing to ingest."); return 0; }

  const db = getSupabaseClient();
  const count = await upsertBatch(db, unique);
  console.log(`EU sanctions ingest complete — ${count} rows upserted`);
  return count;
}

main().catch((err) => { console.error("EU sanctions ingest failed:", err); process.exit(1); });

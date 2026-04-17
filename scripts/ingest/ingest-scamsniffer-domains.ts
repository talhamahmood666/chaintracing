/**
 * Ingest ScamSniffer phishing domain blacklist.
 * Source: https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/domains.json
 * Format: ["evilsite.com", "phishing.xyz", ...]
 *
 * Run: npm run ingest:scamsniffer-domains
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { getSupabaseClient } from "./upsert-helper.js";

const SOURCE_URL =
  "https://raw.githubusercontent.com/scamsniffer/scam-database/main/blacklist/domains.json";

const BATCH_SIZE = 500;

export async function main(): Promise<number> {
  console.log("Fetching ScamSniffer domain blacklist…");
  let res: Response;
  try {
    res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    console.warn("ScamSniffer domains fetch error:", (e as Error).message);
    return 0;
  }
  if (!res.ok) {
    console.warn(`ScamSniffer domains returned ${res.status} — skipping`);
    return 0;
  }

  const domains: string[] = await res.json();
  const valid = [...new Set(
    domains
      .filter((d) => typeof d === "string" && d.trim().length > 0)
      .map((d) => d.trim().toLowerCase())
  )];

  console.log(`ScamSniffer domains: ${valid.length} unique domains`);
  if (valid.length === 0) { console.log("Nothing to ingest."); return 0; }

  const db = getSupabaseClient();
  let total = 0;

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE).map((domain) => ({
      domain,
      source: "scamsniffer",
    }));
    const { error } = await db
      .from("scam_domains")
      .upsert(batch, { onConflict: "domain", ignoreDuplicates: true });
    if (error) {
      console.error(`Domains batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    } else {
      total += batch.length;
    }
  }

  console.log(`ScamSniffer domains ingest complete — ${total} rows upserted`);
  return total;
}

main().catch((err) => { console.error("ScamSniffer domains ingest failed:", err); process.exit(1); });

/**
 * Ingest etherscan-labels dataset — filters to phishing/hack/scam/exploit entries.
 * Source: https://github.com/brianleect/etherscan-labels
 *
 * Run: npm run ingest:etherscan-labels
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { getSupabaseClient, dedup, upsertBatch, type ScamRow } from "./upsert-helper.js";

const SOURCE_URL =
  "https://raw.githubusercontent.com/brianleect/etherscan-labels/main/data/combined/combinedAllLabels.json";

const RISK_KEYWORDS = ["phish", "hack", "fake", "scam", "exploit", "drainer", "rugpull", "ponzi", "fraud"];

function mapCategory(labels: string[]): string | null {
  const joined = labels.join(" ").toLowerCase();
  if (joined.includes("phish") || joined.includes("fake") || joined.includes("drainer")) return "phishing";
  if (joined.includes("hack") || joined.includes("exploit")) return "exploit";
  if (joined.includes("scam") || joined.includes("rugpull") || joined.includes("ponzi") || joined.includes("fraud")) return "scam";
  return null;
}

function isRisky(labels: string[]): boolean {
  const joined = labels.join(" ").toLowerCase();
  return RISK_KEYWORDS.some((kw) => joined.includes(kw));
}

// The JSON structure is: { "0xADDR": ["Label1", "Label2"], ... }
type LabelsMap = Record<string, string[]>;

export async function main(): Promise<number> {
  console.log("Fetching etherscan-labels dataset…");
  let res: Response;
  try {
    res = await fetch(SOURCE_URL, { signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    console.warn("Etherscan labels fetch error:", (e as Error).message);
    return 0;
  }
  if (!res.ok) {
    console.warn(`Etherscan labels returned ${res.status} — skipping`);
    return 0;
  }

  const data = (await res.json()) as LabelsMap;
  const entries = Object.entries(data);
  console.log(`Loaded ${entries.length} labelled addresses, filtering for risk…`);

  const rows: ScamRow[] = [];
  for (const [addr, labels] of entries) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) continue;
    if (!isRisky(labels)) continue;
    const category = mapCategory(labels) ?? "scam";
    rows.push({
      address: addr.toLowerCase(),
      chain: "eth",
      category,
      source: "etherscan_labels",
      source_url: SOURCE_URL,
      verified: true,
      confidence_score: 75,
      notes: labels.join(", "),
    });
  }

  const unique = dedup(rows);
  console.log(`Etherscan labels: ${unique.length} risky addresses after dedup`);
  if (unique.length === 0) { console.log("Nothing to ingest."); return 0; }

  const db = getSupabaseClient();
  const count = await upsertBatch(db, unique);
  console.log(`Etherscan labels ingest complete — ${count} rows upserted`);
  return count;
}

main().catch((err) => { console.error("Etherscan labels ingest failed:", err); process.exit(1); });

/**
 * Ingest MEW ethereum-lists phishing URL darklist.
 * Extracts 0x addresses mentioned in descriptions.
 * Source: https://github.com/MyEtherWallet/ethereum-lists
 *
 * Run: npm run ingest:eth-lists
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { getSupabaseClient, dedup, upsertBatch, type ScamRow } from "./upsert-helper.js";

const URLS_DARKLIST = "https://raw.githubusercontent.com/MyEtherWallet/ethereum-lists/master/src/urls/urls-darklist.json";

const ETH_RE = /0x[a-fA-F0-9]{40}/g;

interface UrlEntry {
  id?: string;
  name?: string;
  url?: string;
  description?: string;
  category?: string;
  reporter?: string;
  ip?: string;
}

export async function main(): Promise<number> {
  const db = getSupabaseClient();
  const rows: ScamRow[] = [];

  // --- URL darklist ---
  console.log("Fetching ethereum-lists URL darklist…");
  try {
    const res = await fetch(URLS_DARKLIST);
    if (res.ok) {
      const entries = (await res.json()) as UrlEntry[];
      for (const entry of entries) {
        const text = [entry.description, entry.name, entry.url].filter(Boolean).join(" ");
        for (const m of text.matchAll(ETH_RE)) {
          rows.push({
            address: m[0].toLowerCase(),
            chain: "eth",
            category: "phishing",
            source: "ethereum_lists",
            source_url: URLS_DARKLIST,
            verified: true,
            confidence_score: 70,
            notes: entry.description ?? entry.name ?? undefined,
          });
        }
      }
      console.log(`URL darklist: extracted ${rows.length} ETH addresses so far`);
    } else {
      console.warn(`URL darklist fetch returned ${res.status}`);
    }
  } catch (e) {
    console.warn("URL darklist fetch error:", (e as Error).message);
  }

  const unique = dedup(rows);
  console.log(`Ethereum lists: ${unique.length} unique addresses after dedup`);
  if (unique.length === 0) { console.log("Nothing to ingest."); return 0; }

  const count = await upsertBatch(db, unique);
  console.log(`Ethereum lists ingest complete — ${count} rows upserted`);
  return count;
}

main().catch((err) => { console.error("Ethereum lists ingest failed:", err); process.exit(1); });

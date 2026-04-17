/**
 * Library-only export of runAll — no top-level side-effects.
 * Imported by the Vercel cron route at runtime.
 */

import { main as runOfac } from "./ingest-ofac.js";
import { main as runCryptoScamDb } from "./ingest-cryptoscamdb.js";
import { main as runUkHmt } from "./ingest-uk-hmt.js";
import { main as runEu } from "./ingest-eu-sanctions.js";
import { main as runEthLists } from "./ingest-ethereum-lists-urls.js";
import { main as runEtherscanLabels } from "./ingest-etherscan-labels.js";

const JOBS: { label: string; fn: () => Promise<number> }[] = [
  { label: "ofac",             fn: runOfac },
  { label: "mew_darklist",     fn: runCryptoScamDb },
  { label: "uk_hmt",           fn: runUkHmt },
  { label: "eu",               fn: runEu },
  { label: "ethereum_lists",   fn: runEthLists },
  { label: "etherscan_labels", fn: runEtherscanLabels },
];

export async function runAll(): Promise<Record<string, number | string>> {
  const summary: Record<string, number | string> = {};
  for (const { label, fn } of JOBS) {
    try {
      summary[label] = await fn();
    } catch (err) {
      console.error(`[runAll] ${label} failed:`, (err as Error).message);
      summary[label] = "ERROR";
    }
  }
  return summary;
}

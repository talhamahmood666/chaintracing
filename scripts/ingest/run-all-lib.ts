/**
 * Library-only export of runAll — no top-level side-effects.
 * Imported by the Vercel cron route at runtime.
 */

import { main as runOfac } from "./ingest-ofac.js";
import { main as runOfacMultichain } from "./ingest-ofac-multichain.js";
import { main as runCryptoScamDb } from "./ingest-cryptoscamdb.js";
import { main as runEu } from "./ingest-eu-sanctions.js";
import { main as runScamSniffer } from "./ingest-scamsniffer.js";
import { main as runScamSnifferDomains } from "./ingest-scamsniffer-domains.js";

const JOBS: { label: string; fn: () => Promise<number> }[] = [
  { label: "ofac",                fn: runOfac },
  { label: "ofac_multichain",     fn: runOfacMultichain },
  { label: "mew_darklist",        fn: runCryptoScamDb },
  { label: "eu_sanctions",        fn: runEu },
  { label: "scamsniffer",         fn: runScamSniffer },
  { label: "scamsniffer_domains", fn: runScamSnifferDomains },
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

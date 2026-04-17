/**
 * Run all scam database ingest scripts sequentially.
 *
 * Run: npm run ingest:all
 */

import { Agent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

import { main as runOfac } from "./ingest-ofac.js";
import { main as runOfacMultichain } from "./ingest-ofac-multichain.js";
import { main as runCryptoScamDb } from "./ingest-cryptoscamdb.js";
import { main as runEu } from "./ingest-eu-sanctions.js";
import { main as runScamSniffer } from "./ingest-scamsniffer.js";
import { main as runScamSnifferDomains } from "./ingest-scamsniffer-domains.js";

interface IngestJob {
  label: string;
  fn: () => Promise<number>;
}

const jobs: IngestJob[] = [
  { label: "ofac",                fn: runOfac },
  { label: "ofac_multichain",     fn: runOfacMultichain },
  { label: "mew_darklist",        fn: runCryptoScamDb },
  { label: "eu_sanctions",        fn: runEu },
  { label: "scamsniffer",         fn: runScamSniffer },
  { label: "scamsniffer_domains", fn: runScamSnifferDomains },
];

export async function runAll(): Promise<Record<string, number | string>> {
  const summary: Record<string, number | string> = {};
  for (const { label, fn } of jobs) {
    console.log(`\n=== ${label.toUpperCase()} ===`);
    try {
      summary[label] = await fn();
    } catch (err) {
      console.error(`${label} failed:`, (err as Error).message);
      summary[label] = "ERROR";
    }
  }
  return summary;
}

runAll().then((summary) => {
  console.log("\n=== INGEST SUMMARY ===");
  for (const [source, count] of Object.entries(summary)) {
    console.log(`  ${source}: ${count}`);
  }
  console.log("=== DONE ===");
}).catch((err) => {
  console.error("run-all failed:", err);
  process.exit(1);
});

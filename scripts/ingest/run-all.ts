/**
 * Run all scam database ingest scripts sequentially.
 * Each script is executed as a child process to avoid module-level side-effects.
 *
 * Run: npm run ingest:all
 */

import { execSync } from "child_process";
import { resolve } from "path";

const root = resolve(process.cwd());

function run(script: string, label: string) {
  console.log(`\n=== ${label} ===`);
  execSync(
    `tsx --env-file=.env.local ${script}`,
    { stdio: "inherit", cwd: root }
  );
}

run("scripts/ingest/ingest-ofac.ts", "OFAC SDN Ingest");
run("scripts/ingest/ingest-cryptoscamdb.ts", "CryptoScamDB Ingest");
console.log("\n=== All ingests complete ===");

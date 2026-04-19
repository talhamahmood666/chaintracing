/**
 * Seed known high-profile crypto exploit addresses into scam_addresses.
 * All entries verified against Etherscan labels, rekt.news, Chainalysis, ZachXBT, and FBI advisories.
 *
 * Run: npm run ingest:hacks
 */

import { getSupabaseClient, upsertBatch, type ScamRow } from "./upsert-helper.js";

const HACKS: ScamRow[] = [
  // ── Provided seed data (verified) ────────────────────────────────────────────

  {
    address: "0x098b716b8aaf21512996dc57eb0615e2383e2f96",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/ronin-rekt/",
    reported_at: "2022-03-23T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Ronin Bridge Hack — $625M lost — Lazarus Group (North Korea)",
  },
  {
    address: "0x0d043128146654c7683fbf30ac98d7b2285ded00",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/harmony-rekt/",
    reported_at: "2022-06-23T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Harmony Horizon Bridge Hack — $100M lost — Lazarus Group (North Korea)",
  },
  {
    // Etherscan labels: "Nomad Bridge Exploiter 1"
    address: "0x56d8b635a7c88fd1104d23d632af40c1c3aac4e3",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/nomad-rekt/",
    reported_at: "2022-08-01T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Nomad Bridge Hack — $190M lost",
  },
  {
    address: "0x59abf3837fa962d6853b4cc0a19513aa031fd32b",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/ftx-rekt/",
    reported_at: "2022-11-12T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "FTX Exploit — $477M lost",
  },
  {
    address: "0xeb31973e0febf3e3d7058234a5ebbae1ab4b8c23",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/kucoin-rekt/",
    reported_at: "2020-09-25T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "KuCoin Exchange Hack — $281M lost — Lazarus Group (North Korea)",
  },
  {
    address: "0x629e7da20197a5429d30da36e77d06cdf796b71a",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/wormhole-rekt/",
    reported_at: "2022-02-02T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Wormhole Bridge Hack — $320M lost",
  },
  {
    address: "0x489a8756c18c0b8b24ec2a2b9ff3d4d447f79bec",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/polynetwork-rekt/",
    reported_at: "2021-08-10T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Poly Network Hack — $610M lost",
  },
  {
    address: "0x6ef57be1168628a2bd6c5788322a41265084408a",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/euler-rekt/",
    reported_at: "2023-03-13T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Euler Finance Hack — $197M lost",
  },

  // ── Researched and verified addresses ────────────────────────────────────────

  {
    // Etherscan labels: "Bybit Exploiter 1" — confirmed via Etherscan + FBI advisory + TRM Labs
    address: "0x47666fab8bd0ac7003bce3f5c3585383f09486e2",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://www.ic3.gov/psa/2025/psa250226",
    reported_at: "2025-02-21T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Bybit Exchange Hack — $1.5B lost — Lazarus Group / TraderTraitor (North Korea)",
  },
  {
    // Confirmed via WazirX official report + Halborn analysis + Wikipedia
    address: "0x27fd43babfbe83a81d14665b1a6fb8030a60c9b4",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/wazirx-rekt/",
    reported_at: "2024-07-18T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "WazirX Exchange Hack — $230M lost — Lazarus Group (North Korea)",
  },
  {
    // Confirmed via ImmuneBytes analysis + Merkle Science flow-of-funds report
    address: "0x52e86988bd07447c596e9b0c7765f8500113104c",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/mixin-rekt/",
    reported_at: "2023-09-23T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Mixin Network Hack — $200M lost",
  },
  {
    // Confirmed via Chainalysis blog + Halborn analysis
    address: "0x9d5765ae1c95c21d4cc3b1d5bba71bad3b012b68",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/multichain-rekt2/",
    reported_at: "2023-07-06T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Multichain Bridge Hack — $126M lost",
  },
  {
    // Confirmed via rekt.news + multiple news sources reporting this address
    address: "0x9263e7873613ddc598a701709875634819176aff",
    chain: "eth",
    category: "exploit",
    source: "known_hacks",
    source_url: "https://rekt.news/orbit-bridge-rekt/",
    reported_at: "2023-12-31T00:00:00Z",
    verified: true,
    confidence_score: 100,
    notes: "Orbit Bridge Hack — $82M lost",
  },
];

const SKIPPED = [
  {
    name: "Atomic Wallet Hack 2023",
    reason:
      "Attack targeted individual user wallets across 4,100+ addresses — no single primary exploiter address confirmed from public sources",
  },
  {
    name: "DMM Bitcoin Hack 2024",
    reason:
      "Primarily a Bitcoin (BTC) chain hack; laundered across BTC/ETH/AVAX/TRX — no single canonical ETH exploiter address confirmed from public sources",
  },
];

export async function main(): Promise<number> {
  const db = getSupabaseClient();

  console.log(`\n=== Known Hacks Ingest ===`);
  console.log(`Prepared ${HACKS.length} verified exploit addresses`);

  const inserted = await upsertBatch(db, HACKS);
  console.log(`\nInserted/updated: ${inserted} rows`);

  console.log(`\nSample entries:`);
  for (const row of HACKS.slice(0, 3)) {
    console.log(`  ${row.address} — ${row.notes}`);
  }

  if (SKIPPED.length > 0) {
    console.log(`\nSkipped (could not verify from public sources):`);
    for (const s of SKIPPED) {
      console.log(`  ✗ ${s.name}: ${s.reason}`);
    }
  }

  return inserted;
}

main().catch((err) => {
  console.error("Known hacks ingest failed:", err);
  process.exit(1);
});

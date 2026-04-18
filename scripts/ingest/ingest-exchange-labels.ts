/**
 * Ingest exchange wallet labels from brianleect/etherscan-labels (MIT licensed).
 * Merges into data/exchange-wallets.json and optionally upserts to Supabase.
 *
 * Source: https://github.com/brianleect/etherscan-labels
 * Run: npx tsx scripts/ingest/ingest-exchange-labels.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const BASE_URL =
  "https://raw.githubusercontent.com/brianleect/etherscan-labels/main/data";

const CHAIN_MAP: Record<string, string> = {
  bscscan: "bsc",
  polygonscan: "polygon",
  arbiscan: "arbitrum",
  optimism: "optimism",
};

const KNOWN_EXCHANGES: Record<string, string> = {
  binance: "Binance",
  coinbase: "Coinbase",
  okx: "OKX",
  kraken: "Kraken",
  bybit: "Bybit",
  kucoin: "KuCoin",
  huobi: "Huobi",
  "gate.io": "Gate.io",
  gate: "Gate.io",
  bitfinex: "Bitfinex",
  bitstamp: "Bitstamp",
  gemini: "Gemini",
  "crypto.com": "Crypto.com",
  ftx: "FTX",
  mexc: "MEXC",
  poloniex: "Poloniex",
};

function detectExchange(label: string): string | null {
  const lower = label.toLowerCase();
  for (const [key, name] of Object.entries(KNOWN_EXCHANGES)) {
    if (lower.includes(key)) return name;
  }
  return null;
}

async function fetchChain(
  chainKey: string
): Promise<Record<string, { exchange: string; label: string }>> {
  const url = `${BASE_URL}/${chainKey}/accounts/exchange.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.warn(`  ${chainKey}: HTTP ${res.status} — skipping`);
      return {};
    }
    const data: Record<string, string> = await res.json();
    const result: Record<string, { exchange: string; label: string }> = {};
    let count = 0;
    for (const [addr, label] of Object.entries(data)) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) continue;
      const exchange = detectExchange(label);
      if (!exchange) continue;
      result[addr.toLowerCase()] = { exchange, label };
      count++;
    }
    console.log(`  ${chainKey}: ${count} exchange addresses`);
    return result;
  } catch (e) {
    console.warn(`  ${chainKey}: fetch error — ${(e as Error).message}`);
    return {};
  }
}

async function main() {
  const dataPath = join(process.cwd(), "data", "exchange-wallets.json");
  const existing = JSON.parse(readFileSync(dataPath, "utf-8"));

  console.log("Fetching exchange labels from brianleect/etherscan-labels…");

  let totalNew = 0;

  for (const [chainKey, chainId] of Object.entries(CHAIN_MAP)) {
    console.log(`Fetching ${chainKey} (→ ${chainId})…`);
    const fetched = await fetchChain(chainKey);

    if (!existing[chainId]) existing[chainId] = {};
    for (const [addr, entry] of Object.entries(fetched)) {
      if (!existing[chainId][addr]) {
        existing[chainId][addr] = entry;
        totalNew++;
      }
    }
  }

  writeFileSync(dataPath, JSON.stringify(existing, null, 2));

  const evmCount = Object.keys(existing.evm ?? {}).length;
  const bscCount = Object.keys(existing.bsc ?? {}).length;
  const polyCount = Object.keys(existing.polygon ?? {}).length;
  const arbCount = Object.keys(existing.arbitrum ?? {}).length;

  console.log(`\nDone. Added ${totalNew} new addresses.`);
  console.log(`Totals — evm: ${evmCount}, bsc: ${bscCount}, polygon: ${polyCount}, arbitrum: ${arbCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

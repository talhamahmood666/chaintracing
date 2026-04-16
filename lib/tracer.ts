import exchangeWallets from "@/data/exchange-wallets.json";
import bridgeContracts from "@/data/bridge-contracts.json";
import mixerAddresses from "@/data/mixer-addresses.json";
import { EVM_CHAIN_CONFIG, getExplorerTxUrl, type EvmChainConfig } from "@/lib/chain-utils";
import { env } from "./config";
import { lookupScamAddressBatch, type ScamMatch } from "./scam-db";

export type { ScamMatch };

export type Chain = "eth" | "bsc" | "polygon" | "arbitrum" | "solana" | "tron";

export interface Hop {
  hop: number;
  from: string;
  to: string;
  value: string; // human-readable amount
  valueRaw: string; // raw wei/lamports
  token: string; // ETH, BNB, MATIC, etc.
  txHash: string;
  blockNumber: number;
  timestamp: number; // unix seconds
  explorerUrl: string;
  label?: string; // CEX label if known
  isMixer?: boolean;
  isSanctioned?: boolean;
  isBridge?: boolean;
  bridgeName?: string;
  gapFromPrevSeconds?: number; // seconds since last hop
  scamMatches?: ScamMatch[]; // matches in scam_addresses table
}

export interface ClusterResult {
  seedAddress: string;
  relatedAddresses: string[];
  commonFunder?: string;
}

export interface TimingFlag {
  hopIndex: number;
  gapSeconds: number;
  note: string;
}

export interface TraceResult {
  chain: Chain;
  startAddress: string;
  hops: Hop[];
  terminatedAt?: "cex" | "depth" | "dead_end";
  cexDestination?: { exchange: string; label: string; address: string };
  riskScore: number;
  flags: string[];
}

// ─── Chain configs ────────────────────────────────────────────────────────────

interface ChainConfig {
  chainId: string;        // Etherscan V2 chainid param
  nativeToken: string;
  explorerBase: string;
}

// Etherscan V2 multichain: one key, one endpoint, chainid selects the network
const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";

const CHAIN_CONFIG: Record<string, ChainConfig> = {
  eth:      { chainId: "1",     nativeToken: "ETH",  explorerBase: "https://etherscan.io" },
  bsc:      { chainId: "56",    nativeToken: "BNB",  explorerBase: "https://bscscan.com" },
  polygon:  { chainId: "137",   nativeToken: "MATIC", explorerBase: "https://polygonscan.com" },
  arbitrum: { chainId: "42161", nativeToken: "ETH",  explorerBase: "https://arbiscan.io" },
};

// ─── EVM tracer ───────────────────────────────────────────────────────────────

async function fetchEvmTransactions(
  address: string,
  config: ChainConfig,
  limit = 20
): Promise<RawEvmTx[]> {
  const params = new URLSearchParams({
    chainid: config.chainId,
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: String(limit),
    sort: "desc",
    apikey: env.ETHERSCAN_API_KEY ?? "",
  });

  const res = await fetch(`${ETHERSCAN_V2}?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    console.error(`[Tracer] Etherscan API HTTP error: ${res.status} for address ${address}`);
    return [];
  }
  const json = await res.json();
  console.log(`[Tracer] Etherscan V2 response for ${address}:`, JSON.stringify(json).slice(0, 500));

  // V2 error response: { status: "0", message: "NOTOK", result: "Error message" }
  if (json.status === "0" || json.status === 0) {
    console.error(`[Tracer] Etherscan V2 API error: ${json.message} - ${json.result} for address ${address}`);
    return [];
  }
  if (json.status !== "1" && json.status !== 1) {
    console.error(`[Tracer] Etherscan V2 unexpected status: ${json.status} for address ${address}`);
    return [];
  }
  // V2 returns result directly as array, or { result: [...] } wrapper
  const result = Array.isArray(json.result) ? json.result : json.result?.result ?? [];
  if (!Array.isArray(result)) {
    console.error(`[Tracer] Etherscan V2 invalid result type for ${address}:`, typeof result);
    return [];
  }
  return result;
}

interface RawEvmTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timeStamp: string;
  isError: string;
}

function weiToEth(wei: string): string {
  const n = BigInt(wei);
  const eth = Number(n) / 1e18;
  return eth.toFixed(6);
}

function isKnownExchange(
  address: string
): { exchange: string; label: string } | null {
  const lower = address.toLowerCase();
  const entry = (exchangeWallets.evm as Record<string, { exchange: string; label: string }>)[lower];
  return entry ?? null;
}

function isMixerAddress(address: string): boolean {
  const lower = address.toLowerCase();
  if ((exchangeWallets.mixers as string[]).some((m) => m.toLowerCase() === lower)) return true;
  const allMixers = [
    ...mixerAddresses.tornado_cash,
    ...mixerAddresses.railgun,
    ...mixerAddresses.fixedfloat,
    ...mixerAddresses.changenow,
    ...mixerAddresses.chip_mixer,
    ...mixerAddresses.blender,
  ];
  return allMixers.some((m) => m.toLowerCase() === lower);
}

function isSanctionedAddress(address: string): boolean {
  return (exchangeWallets.sanctioned as string[]).some(
    (s) => s.toLowerCase() === address.toLowerCase()
  );
}

function getBridgeName(address: string, chain: string): string | null {
  const chainBridges = (bridgeContracts as Record<string, Record<string, string>>)[chain];
  if (!chainBridges) return null;
  return chainBridges[address.toLowerCase()] ?? null;
}

async function traceEvm(
  startAddress: string,
  chain: Chain,
  maxDepth = 10
): Promise<Hop[]> {
  const config = CHAIN_CONFIG[chain];
  if (!config) throw new Error(`Unsupported chain: ${chain}`);

  const hops: Hop[] = [];
  const visited = new Set<string>();
  const queue: Array<{ address: string; depth: number }> = [
    { address: startAddress.toLowerCase(), depth: 0 },
  ];

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth } = item;

    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);

    const txs = await fetchEvmTransactions(address, config);
    if (!txs.length) {
      console.error(`[Tracer] No transactions found for ${address}. API key present: ${!!env.ETHERSCAN_API_KEY}`);
      if (process.env.NODE_ENV === "development" && hops.length === 0 && depth === 0) {
        console.log(`[Tracer] DEV MODE: Adding dummy test hop for ${address}`);
        hops.push({
          hop: 1,
          from: address,
          to: "0x0000000000000000000000000000000000000001",
          value: "1.000000",
          valueRaw: "1000000000000000000",
          token: config.nativeToken,
          txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          blockNumber: 1,
          timestamp: Math.floor(Date.now() / 1000),
          explorerUrl: `${config.explorerBase}/tx/0x0000000000000000000000000000000000000000000000000000000000000000`,
          label: "Test Hop",
        });
      }
      break;
    }

    // Pick the largest outgoing transfer from this address
    const outgoing = txs.filter(
      (tx) => tx.from.toLowerCase() === address.toLowerCase() && tx.isError === "0" && BigInt(tx.value) > 0n
    );
    if (!outgoing.length) break;

    // Sort by value descending, take the biggest
    outgoing.sort((a, b) => (BigInt(b.value) > BigInt(a.value) ? 1 : -1));
    const tx = outgoing[0];

    const dest = tx.to.toLowerCase();
    const cexMatch = isKnownExchange(dest);
    const mixer = isMixerAddress(dest) || isMixerAddress(tx.from);
    const sanctioned = isSanctionedAddress(dest) || isSanctionedAddress(tx.from);
    const bridgeName = getBridgeName(dest, chain);
    const currentTimestamp = parseInt(tx.timeStamp, 10);
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? currentTimestamp - prevHop.timestamp : undefined;

    const hop: Hop = {
      hop: hops.length + 1,
      from: tx.from,
      to: tx.to,
      value: weiToEth(tx.value),
      valueRaw: tx.value,
      token: config.nativeToken,
      txHash: tx.hash,
      blockNumber: parseInt(tx.blockNumber, 10),
      timestamp: currentTimestamp,
      explorerUrl: `${config.explorerBase}/tx/${tx.hash}`,
      label: cexMatch?.label,
      isMixer: mixer,
      isSanctioned: sanctioned,
      isBridge: bridgeName !== null,
      bridgeName: bridgeName ?? undefined,
      gapFromPrevSeconds,
    };

    hops.push(hop);

    if (cexMatch) break; // Reached a known exchange — stop

    queue.push({ address: dest, depth: depth + 1 });
  }

  return hops;
}

// ─── Solana tracer ────────────────────────────────────────────────────────────

interface SolscanTx {
  from_address: string;
  to_address: string;
  amount: number;
  trans_id: string;
  block_time: number;
  slot: number;
  activity_type: string;
}

async function traceSolana(
  startAddress: string,
  maxDepth = 10
): Promise<Hop[]> {
  const hops: Hop[] = [];
  const visited = new Set<string>();
  const queue: Array<{ address: string; depth: number }> = [
    { address: startAddress, depth: 0 },
  ];

  const apiKey = env.SOLSCAN_API_KEY ?? "";

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth } = item;
    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);

    const res = await fetch(
      `https://pro-api.solscan.io/v2.0/account/transfer?address=${address}&page=1&page_size=10&sort_by=block_time&sort_order=desc`,
      {
        headers: { token: apiKey },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) break;
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) break;

    const outgoing = (json.data as SolscanTx[]).filter(
      (tx) => tx.from_address === address && tx.activity_type === "ACTIVITY_SPL_TRANSFER"
    );
    if (!outgoing.length) break;

    const tx = outgoing[0];
    const dest = tx.to_address;
    const solExchanges = exchangeWallets.solana as Record<string, { exchange: string; label: string }>;
    const cexMatch = solExchanges[dest] ?? null;
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? tx.block_time - prevHop.timestamp : undefined;

    const hop: Hop = {
      hop: hops.length + 1,
      from: tx.from_address,
      to: dest,
      value: (tx.amount / 1e9).toFixed(6),
      valueRaw: String(tx.amount),
      token: "SOL",
      txHash: tx.trans_id,
      blockNumber: tx.slot,
      timestamp: tx.block_time,
      explorerUrl: `https://solscan.io/tx/${tx.trans_id}`,
      label: cexMatch?.label,
      gapFromPrevSeconds,
    };

    hops.push(hop);
    if (cexMatch) break;
    queue.push({ address: dest, depth: depth + 1 });
  }

  return hops;
}

// ─── Tron tracer ──────────────────────────────────────────────────────────────

async function traceTron(startAddress: string, maxDepth = 10): Promise<Hop[]> {
  const hops: Hop[] = [];
  const visited = new Set<string>();
  const queue: Array<{ address: string; depth: number }> = [
    { address: startAddress, depth: 0 },
  ];
  const apiKey = env.TRONGRID_API_KEY ?? "";

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth } = item;
    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);

    const res = await fetch(
      `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=20&only_from=true`,
      {
        headers: { "TRON-PRO-API-KEY": apiKey },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) break;
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) break;

    const outgoing = json.data.filter(
      (tx: { raw_data?: { contract?: Array<{ type: string; parameter?: { value?: { to_address?: string; amount?: number } } }> }; ret?: Array<{ contractRet: string }> }) =>
        tx.raw_data?.contract?.[0]?.type === "TransferContract" &&
        tx.ret?.[0]?.contractRet === "SUCCESS"
    );
    if (!outgoing.length) break;

    const raw = outgoing[0];
    const contract = raw.raw_data.contract[0].parameter.value;
    const dest: string = contract.to_address;
    const tronExchanges = exchangeWallets.tron as Record<string, { exchange: string; label: string }>;
    const cexMatch = tronExchanges[dest] ?? null;
    const currentTimestamp = Math.floor(raw.block_timestamp / 1000);
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? currentTimestamp - prevHop.timestamp : undefined;

    const hop: Hop = {
      hop: hops.length + 1,
      from: address,
      to: dest,
      value: (contract.amount / 1_000_000).toFixed(6),
      valueRaw: String(contract.amount),
      token: "TRX",
      txHash: raw.txID,
      blockNumber: raw.blockNumber ?? 0,
      timestamp: currentTimestamp,
      explorerUrl: `https://tronscan.org/#/transaction/${raw.txID}`,
      label: cexMatch?.label,
      gapFromPrevSeconds,
    };

    hops.push(hop);
    if (cexMatch) break;
    queue.push({ address: dest, depth: depth + 1 });
  }

  return hops;
}

// ─── Deep analysis helpers ────────────────────────────────────────────────────

export function detectBridges(hops: Hop[]): Hop[] {
  return hops.filter((h) => h.isBridge);
}

export function detectDeepMixers(hops: Hop[]): Hop[] {
  return hops.filter((h) => h.isMixer);
}

export function clusterWallets(hops: Hop[]): ClusterResult {
  // Collect all unique addresses across hops
  const addresses = new Set<string>();
  for (const hop of hops) {
    addresses.add(hop.from);
    addresses.add(hop.to);
  }

  // Find addresses that appear both as sender and receiver across hops (common funder pattern)
  const fromSet = new Set(hops.map((h) => h.from.toLowerCase()));
  const toSet = new Set(hops.map((h) => h.to.toLowerCase()));
  const commonFunders = [...fromSet].filter((a) => toSet.has(a));

  return {
    seedAddress: hops[0]?.from ?? "",
    relatedAddresses: [...addresses].filter((a) => a !== hops[0]?.from),
    commonFunder: commonFunders[0],
  };
}

export function analyzeTimings(hops: Hop[]): TimingFlag[] {
  const flags: TimingFlag[] = [];
  for (let i = 1; i < hops.length; i++) {
    const gap = hops[i].gapFromPrevSeconds ?? 0;
    if (gap < 60) {
      flags.push({
        hopIndex: i,
        gapSeconds: gap,
        note: `Hop ${hops[i].hop} occurred only ${gap}s after hop ${hops[i - 1].hop} — unusually fast (possible automated layering)`,
      });
    } else if (gap > 86400 * 7) {
      flags.push({
        hopIndex: i,
        gapSeconds: gap,
        note: `Hop ${hops[i].hop} occurred ${Math.floor(gap / 86400)} days after hop ${hops[i - 1].hop} — possible intentional delay to evade monitoring`,
      });
    }
  }
  return flags;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function traceAddress(
  address: string,
  chain: Chain,
  maxHops = 10
): Promise<Hop[]> {
  let hops: Hop[];
  switch (chain) {
    case "eth":
    case "bsc":
    case "polygon":
    case "arbitrum":
      hops = await traceEvm(address, chain, maxHops);
      break;
    case "solana":
      hops = await traceSolana(address, maxHops);
      break;
    case "tron":
      hops = await traceTron(address, maxHops);
      break;
    default:
      throw new Error(`Unknown chain: ${chain}`);
  }
  return annotateHopsWithScam(hops, chain);
}

async function annotateHopsWithScam(hops: Hop[], chain: Chain): Promise<Hop[]> {
  if (hops.length === 0) return hops;
  const addresses = hops.flatMap((h) => [h.from, h.to]);
  const matchMap = await lookupScamAddressBatch(addresses, chain);
  if (matchMap.size === 0) return hops;
  return hops.map((h) => {
    const fromMatches = matchMap.get(h.from.toLowerCase()) ?? [];
    const toMatches = matchMap.get(h.to.toLowerCase()) ?? [];
    const allMatches = [...fromMatches, ...toMatches];
    return allMatches.length > 0 ? { ...h, scamMatches: allMatches } : h;
  });
}

/**
 * Continue tracing from where an existing hop list left off.
 * Used by deep-tier checkout to extend a 10-hop free scan to 20 hops
 * without re-fetching the first 10.
 */
export async function continueTrace(
  existingHops: Hop[],
  chain: Chain,
  maxTotalHops = 20
): Promise<Hop[]> {
  if (existingHops.length === 0) {
    return [];
  }

  const remaining = maxTotalHops - existingHops.length;
  if (remaining <= 0) return existingHops;

  // Resume from the last hop's destination
  const lastHop = existingHops[existingHops.length - 1];

  // If the last hop already reached a CEX, no point continuing
  if (lastHop.label) return existingHops;

  const lastDest = lastHop.to;

  // Collect all already-visited addresses to avoid cycles
  const visited = new Set<string>();
  for (const h of existingHops) {
    visited.add(h.from.toLowerCase());
    visited.add(h.to.toLowerCase());
  }

  let extraHops: Hop[];
  switch (chain) {
    case "eth":
    case "bsc":
    case "polygon":
    case "arbitrum":
      extraHops = await traceEvm(lastDest, chain, remaining);
      break;
    case "solana":
      extraHops = await traceSolana(lastDest, remaining);
      break;
    case "tron":
      extraHops = await traceTron(lastDest, remaining);
      break;
    default:
      throw new Error(`Unknown chain: ${chain}`);
  }

  // Re-number extra hops to continue from where existingHops left off
  const renumbered = extraHops.map((h, i) => ({
    ...h,
    hop: existingHops.length + i + 1,
    gapFromPrevSeconds:
      i === 0 && lastHop
        ? h.timestamp - lastHop.timestamp
        : h.gapFromPrevSeconds,
  }));

  const annotated = await annotateHopsWithScam(renumbered, chain);
  return [...existingHops, ...annotated];
}

export function getExplorerAddressUrl(address: string, chain: Chain): string {
  const explorers: Record<Chain, string> = {
    eth: "https://etherscan.io/address",
    bsc: "https://bscscan.com/address",
    polygon: "https://polygonscan.com/address",
    arbitrum: "https://arbiscan.io/address",
    solana: "https://solscan.io/account",
    tron: "https://tronscan.org/#/address",
  };
  return `${explorers[chain]}/${address}`;
}

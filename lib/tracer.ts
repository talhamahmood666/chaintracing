import exchangeWallets from "@/data/exchange-wallets.json";
import bridgeContracts from "@/data/bridge-contracts.json";
import mixerAddresses from "@/data/mixer-addresses.json";
import { EVM_CHAIN_CONFIG, getExplorerTxUrl, type EvmChainConfig } from "@/lib/chain-utils";
import { env } from "./config";
import { lookupScamAddressBatch, type ScamMatch } from "./scam-db";
import { getTraceCache, setTraceCache } from "./trace-cache";

export type { ScamMatch };

export type Chain = "eth" | "bsc" | "polygon" | "arbitrum" | "solana" | "tron" | "btc" | "base";
export const SUPPORTED_CHAINS: Chain[] = ["eth", "bsc", "polygon", "arbitrum", "solana", "tron", "btc", "base"];

export interface Hop {
  hop: number;
  from: string;
  to: string;
  value: string;
  valueRaw: string;
  token: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  explorerUrl: string;
  label?: string;
  isMixer?: boolean;
  isSanctioned?: boolean;
  isBridge?: boolean;
  bridgeName?: string;
  gapFromPrevSeconds?: number;
  scamMatches?: ScamMatch[];
  partial_trace?: boolean;    // M4: stopped due to API rate limit
  beyondCex?: boolean;
  likely_truncated?: boolean; // M7: fetch window maxed out — more hops may exist
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

export interface BfsLogEntry {
  address: string;
  depth: number;
  nativeTxCount: number;
  tokenTxCount: number;
  outgoingCount: number;
  chosenHash?: string;
  chosenTo?: string;
  chosenToken?: string;
  chosenValue?: string;
  skipReason?: string;
}

// ─── Chain configs ────────────────────────────────────────────────────────────

interface ChainConfig {
  chainId: string;
  nativeToken: string;
  explorerBase: string;
}

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";

const CHAIN_CONFIG: Record<string, ChainConfig> = {
  eth:      { chainId: "1",     nativeToken: "ETH",   explorerBase: "https://etherscan.io" },
  bsc:      { chainId: "56",    nativeToken: "BNB",   explorerBase: "https://bscscan.com" },
  polygon:  { chainId: "137",   nativeToken: "MATIC", explorerBase: "https://polygonscan.com" },
  arbitrum: { chainId: "42161", nativeToken: "ETH",   explorerBase: "https://arbiscan.io" },
  base:     { chainId: "8453",  nativeToken: "ETH",   explorerBase: "https://basescan.org" },
};

// ─── Unified transfer type used inside BFS ────────────────────────────────────

interface NormalizedTx {
  hash: string;
  from: string;
  to: string;
  valueRaw: string;   // raw smallest unit
  valueHuman: string; // human-readable
  token: string;      // ETH / BNB / USDT / etc.
  blockNumber: number;
  timestamp: number;
}

// ─── Etherscan fetch helpers ──────────────────────────────────────────────────

interface RawEvmTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timeStamp: string;
  isError: string;
}

interface RawErc20Tx {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  timeStamp: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

// Typed error so BFS can distinguish rate-limit from empty-address
export class RateLimitError extends Error {
  constructor(public readonly chain: string) {
    super(`Etherscan rate limit hit on ${chain}`);
    this.name = "RateLimitError";
  }
}

// ─── Ankr fallback ────────────────────────────────────────────────────────────

const ANKR_CHAIN_MAP: Record<string, string> = {
  "1": "eth",
  "56": "bsc",
  "137": "polygon",
  "42161": "arbitrum",
  "8453": "base",
};

interface AnkrTx {
  hash: string;
  from: string;
  to: string | null;
  value: string;      // hex wei
  blockNumber: string; // hex
  timestamp: string;   // hex seconds
  status?: string;     // hex "0x1" success
}

interface AnkrResponse {
  result?: { transactions?: AnkrTx[] };
  error?: { message: string };
}

async function fetchFromAnkr(
  address: string,
  chainId: string,
  nativeToken: string
): Promise<NormalizedTx[]> {
  const key = env.ANKR_API_KEY ?? "";
  if (!key) {
    console.log(`[ANKR] no key configured, skipping fallback`);
    return [];
  }
  const blockchain = ANKR_CHAIN_MAP[chainId];
  if (!blockchain) return [];

  try {
    const res = await fetch(`https://rpc.ankr.com/multichain/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "ankr_getTransactionsByAddress",
        params: {
          blockchain: [blockchain],
          address: [address],
          pageSize: 100,
          descOrder: false,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.log(`[ANKR] HTTP ${res.status} on ${blockchain}`);
      return [];
    }
    const json = (await res.json()) as AnkrResponse;
    const txs = json.result?.transactions ?? [];
    return txs
      .filter(tx => tx.to && (tx.status === undefined || tx.status === "0x1"))
      .map(tx => {
        const valBig = BigInt(tx.value || "0x0");
        return {
          hash: tx.hash,
          from: tx.from.toLowerCase(),
          to: (tx.to ?? "").toLowerCase(),
          valueRaw: valBig.toString(),
          valueHuman: (Number(valBig) / 1e18).toFixed(6),
          token: nativeToken,
          blockNumber: parseInt(tx.blockNumber, 16),
          timestamp: parseInt(tx.timestamp, 16),
        };
      })
      .filter(tx => BigInt(tx.valueRaw) > 0n);
  } catch (err) {
    console.log(`[ANKR] fetch error on ${blockchain}:`, (err as Error)?.message);
    return [];
  }
}

// Per-chain pacing: track last request time so we stay under 5 req/sec.
const _chainLastCall: Map<string, number> = new Map();
const PACE_MS = 220; // ~4.5 req/sec, safely under the 5/sec free-tier limit

async function _pace(chainId: string): Promise<void> {
  const last = _chainLastCall.get(chainId) ?? 0;
  const wait = PACE_MS - (Date.now() - last);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  _chainLastCall.set(chainId, Date.now());
}

// Retry backoff delays in ms: attempt 0→250ms, attempt 1→1000ms, attempt 2→4000ms, attempt 3→throw
const RATE_BACKOFFS = [250, 1000, 4000];
const MAX_NETWORK_RETRIES = 3;
const NETWORK_BACKOFFS = [500, 2000, 8000];

async function etherscanFetch(
  params: Record<string, string>,
  attempt = 0,
  networkRetry = 0
): Promise<unknown[]> {
  await _pace(params.chainid ?? "default");
  const p = new URLSearchParams({
    ...params,
    apikey: env.ETHERSCAN_API_KEY ?? "",
  });
  try {
    const res = await fetch(`${ETHERSCAN_V2}?${p}`, { 
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15000)
    });
    if (res.status === 429) {
      console.log(`[ETHERSCAN] Rate limit (429) on chain ${params.chainid ?? "unknown"}, attempt ${attempt}`);
      if (attempt < RATE_BACKOFFS.length) {
        await new Promise(r => setTimeout(r, RATE_BACKOFFS[attempt]));
        return etherscanFetch(params, attempt + 1, networkRetry);
      }
      throw new RateLimitError(params.chainid ?? "unknown");
    }
    if (!res.ok) {
      console.log(`[ETHERSCAN] HTTP ${res.status} on chain ${params.chainid ?? "unknown"}`);
      return [];
    }
    const json = await res.json();
    if (
      (json.status === "0" || json.status === 0) &&
      typeof json.result === "string" &&
      json.result.toLowerCase().includes("rate limit")
    ) {
      console.log(`[ETHERSCAN] Status 0 rate limit on chain ${params.chainid ?? "unknown"}, attempt ${attempt}`);
      if (attempt < RATE_BACKOFFS.length) {
        await new Promise(r => setTimeout(r, RATE_BACKOFFS[attempt]));
        return etherscanFetch(params, attempt + 1, networkRetry);
      }
      throw new RateLimitError(params.chainid ?? "unknown");
    }
    if (json.status === "0" || json.status === 0) return [];
    const result = Array.isArray(json.result) ? json.result : json.result?.result ?? [];
    return Array.isArray(result) ? result : [];
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    
    // Retry network errors (ETIMEDOUT, ECONNRESET, etc.)
    if (networkRetry < MAX_NETWORK_RETRIES) {
      const delay = NETWORK_BACKOFFS[networkRetry];
      console.log(`[ETHERSCAN] Network error (${(err as Error)?.name || 'unknown'}), retry ${networkRetry + 1}/${MAX_NETWORK_RETRIES} after ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      return etherscanFetch(params, attempt, networkRetry + 1);
    }
    
    console.log(`[ETHERSCAN] Network error after ${MAX_NETWORK_RETRIES} retries:`, (err as Error)?.message || (err as Error)?.name);
    return [];
  }
}

/**
 * Fetch native transactions (ETH/BNB/MATIC etc.) sorted ASC so earliest transfers
 * come first — critical for following money right after a theft.
 */
async function fetchNativeTxs(
  address: string,
  config: ChainConfig,
  limit = 100
): Promise<NormalizedTx[]> {
  const raw = (await etherscanFetch({
    chainid: config.chainId,
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: String(limit),
    sort: "asc", // oldest first so we follow the theft timeline
  })) as RawEvmTx[];

  return raw
    .filter(tx => tx.isError === "0" && BigInt(tx.value || "0") > 0n)
    .map(tx => ({
      hash: tx.hash,
      from: tx.from.toLowerCase(),
      to: tx.to.toLowerCase(),
      valueRaw: tx.value,
      valueHuman: (Number(BigInt(tx.value)) / 1e18).toFixed(6),
      token: config.nativeToken,
      blockNumber: parseInt(tx.blockNumber, 10),
      timestamp: parseInt(tx.timeStamp, 10),
    }));
}

/**
 * Fetch ERC-20 token transfers.  Many scam operations use USDT/USDC so this is
 * essential for real-world traces.
 */
async function fetchTokenTxs(
  address: string,
  config: ChainConfig,
  limit = 100
): Promise<NormalizedTx[]> {
  const raw = (await etherscanFetch({
    chainid: config.chainId,
    module: "account",
    action: "tokentx",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: String(limit),
    sort: "asc",
  })) as RawErc20Tx[];

  return raw
    .filter(tx => BigInt(tx.value || "0") > 0n)
    .map(tx => {
      const dec = parseInt(tx.tokenDecimal, 10) || 18;
      const humanVal = (Number(BigInt(tx.value)) / Math.pow(10, dec)).toFixed(dec > 6 ? 6 : dec);
      return {
        hash: tx.hash,
        from: tx.from.toLowerCase(),
        to: tx.to.toLowerCase(),
        valueRaw: tx.value,
        valueHuman: humanVal,
        token: tx.tokenSymbol || "ERC20",
        blockNumber: parseInt(tx.blockNumber, 10),
        timestamp: parseInt(tx.timeStamp, 10),
      };
    });
}

// ─── EVM label helpers ────────────────────────────────────────────────────────

function isKnownExchange(address: string, chain?: Chain): { exchange: string; label: string } | null {
  type ExMap = Record<string, { exchange: string; label: string }>;
  const maps = exchangeWallets as unknown as Record<string, ExMap>;
  if (chain === "solana" || chain === "tron" || chain === "btc") {
    return maps[chain]?.[address] ?? null;
  }
  const lower = address.toLowerCase();
  if (chain && chain !== "eth") {
    const chainEntry = maps[chain]?.[lower];
    if (chainEntry) return chainEntry;
  }
  return maps.evm?.[lower] ?? null;
}

function isMixerAddress(address: string): boolean {
  const lower = address.toLowerCase();
  if ((exchangeWallets.mixers as string[]).some(m => m.toLowerCase() === lower)) return true;
  return [
    ...mixerAddresses.tornado_cash,
    ...mixerAddresses.railgun,
    ...mixerAddresses.fixedfloat,
    ...mixerAddresses.changenow,
    ...mixerAddresses.chip_mixer,
    ...mixerAddresses.blender,
  ].some(m => m.toLowerCase() === lower);
}

function isSanctionedAddress(address: string): boolean {
  return (exchangeWallets.sanctioned as string[]).some(
    s => s.toLowerCase() === address.toLowerCase()
  );
}

function getBridgeName(address: string, chain: string): string | null {
  const chainBridges = (bridgeContracts as Record<string, Record<string, string>>)[chain];
  if (!chainBridges) return null;
  return chainBridges[address.toLowerCase()] ?? null;
}

// ─── Per-request Etherscan cache ─────────────────────────────────────────────

interface TxCache {
  native: NormalizedTx[];
  token: NormalizedTx[];
  fetchedAt: number;
}
const TX_CACHE_TTL_MS = 60_000;

async function fetchWithCache(
  address: string,
  config: ChainConfig,
  cache: Map<string, TxCache>
): Promise<{ native: NormalizedTx[]; token: NormalizedTx[] }> {
  const hit = cache.get(address);
  if (hit && Date.now() - hit.fetchedAt < TX_CACHE_TTL_MS) {
    return { native: hit.native, token: hit.token };
  }
  // Sequential to stay under Etherscan's 5 req/s free-tier limit
  let native: NormalizedTx[] = [];
  let token: NormalizedTx[] = [];
  let rateLimited = false;
  try {
    native = await fetchNativeTxs(address, config);
    token = await fetchTokenTxs(address, config);
  } catch (err) {
    if (err instanceof RateLimitError) {
      rateLimited = true;
    } else {
      throw err;
    }
  }

  const lower = address.toLowerCase();
  const hasOutgoing =
    native.some(t => t.from === lower) || token.some(t => t.from === lower);

  if ((rateLimited || (native.length === 0 && token.length === 0) || !hasOutgoing) && env.ANKR_API_KEY) {
    console.log(`[ANKR] fallback used for ${address} on chain ${config.chainId}`);
    const ankrNative = await fetchFromAnkr(address, config.chainId, config.nativeToken);
    native = ankrNative;
    token = [];
  } else if (rateLimited) {
    throw new RateLimitError(config.chainId);
  }

  cache.set(address, { native, token, fetchedAt: Date.now() });
  return { native, token };
}

// ─── EVM tracer ───────────────────────────────────────────────────────────────

async function traceEvm(
  startAddress: string,
  chain: Chain,
  maxDepth = 10,
  bfsLog?: BfsLogEntry[],
  seedVisited?: Set<string>
): Promise<Hop[]> {
  const config = CHAIN_CONFIG[chain];
  if (!config) throw new Error(`Unsupported chain: ${chain}`);

  const hops: Hop[] = [];
  let beyondCexRemaining: number | null = null;
  const visited = seedVisited ?? new Set<string>();
  const txCache = new Map<string, TxCache>(); // per-trace address cache
  const queue: Array<{ address: string; depth: number; fundingTs: number }> = [
    { address: startAddress.toLowerCase(), depth: 0, fundingTs: 0 },
  ];

  console.log(`[TRACE] Starting BFS: startAddress=${startAddress}, chain=${chain}, maxDepth=${maxDepth}`);
  console.log(`[TRACE] Initial queue size: ${queue.length}, seedVisited size: ${visited.size}`);

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth, fundingTs } = item;
    console.log(`[TRACE] Processing: hop=${hops.length + 1}, depth=${depth}, address=${address}, queueRemaining=${queue.length}, visited=${visited.size}, maxDepth=${maxDepth}, fundingTs=${fundingTs}`);

    if (visited.has(address)) {
      console.log(`[TRACE] Skipping ${address}: already visited`);
      bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "already visited" });
      continue;
    }
    if (depth >= maxDepth) {
      console.log(`[TRACE] Skipping ${address}: depth ${depth} >= maxDepth ${maxDepth}`);
      bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "max depth reached" });
      visited.add(address);
      continue;
    }
    visited.add(address);

    // Create logEntry before fetch so rate-limit/error exits are visible in bfsLog
    const logEntry: BfsLogEntry = {
      address,
      depth,
      nativeTxCount: 0,
      tokenTxCount: 0,
      outgoingCount: 0,
    };

    // Fetch native + token in parallel via per-trace cache; retry with backoff on 429
    let nativeTxs: NormalizedTx[], tokenTxs: NormalizedTx[];
    try {
      const fetched = await fetchWithCache(address, config, txCache);
      nativeTxs = fetched.native;
      tokenTxs = fetched.token;
      console.log(`[TRACE] Fetched for ${address}: native ${nativeTxs.length}, token ${tokenTxs.length}, cache size ${txCache.size}`);
    } catch (err) {
      if (err instanceof RateLimitError) {
        logEntry.skipReason = "rate limit hit";
        bfsLog?.push(logEntry);
        if (hops.length > 0) hops[hops.length - 1] = { ...hops[hops.length - 1], partial_trace: true };
        console.log(`[TRACE] Rate limit reached at hop ${hops.length + 1}, marking previous hop as partial_trace, continuing with queue (${queue.length} remaining)`);
        continue; // Continue with other addresses in queue, don't break entire BFS
      }
      console.log(`[TRACE] Unexpected error at hop ${hops.length + 1}, address ${address}:`, (err as Error)?.message || (err as Error)?.name);
      throw err;
    }

    // M7: if fetch window is full, the API may have more txs beyond our limit
    const FETCH_LIMIT = 100;
    const windowFull = nativeTxs.length >= FETCH_LIMIT || tokenTxs.length >= FETCH_LIMIT;

    // Combine and deduplicate by hash+token (same tx can send both native + tokens)
    const seen = new Set<string>();
    const allTxs: NormalizedTx[] = [];
    for (const tx of [...nativeTxs, ...tokenTxs]) {
      const key = `${tx.hash}:${tx.token}`;
      if (!seen.has(key)) { seen.add(key); allTxs.push(tx); }
    }

    // Only outgoing transfers FROM current address, sorted chronologically
    const allOutgoing = allTxs
      .filter(tx => tx.from === address)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Filter to txs at or after this address was funded (temporal integrity)
    const outgoing = fundingTs > 0 ? allOutgoing.filter(t => t.timestamp >= fundingTs) : allOutgoing;

    logEntry.nativeTxCount = nativeTxs.filter(t => t.from === address).length;
    logEntry.tokenTxCount = tokenTxs.filter(t => t.from === address).length;
    logEntry.outgoingCount = outgoing.length;

    if (!outgoing.length) {
      logEntry.skipReason = allOutgoing.length > 0 ? "no-valid-outgoing-after-funding" : "no outgoing txs found";
      bfsLog?.push(logEntry);
      // BUG FIX: continue, not break — other queue entries may still yield hops
      continue;
    }

    // Pick the largest outgoing transfer (by raw value in the same token group)
    // Group by token, pick the group with the largest single transfer
    const byToken = new Map<string, NormalizedTx[]>();
    for (const tx of outgoing) {
      if (!byToken.has(tx.token)) byToken.set(tx.token, []);
      byToken.get(tx.token)!.push(tx);
    }
    let bestTx = outgoing[0];
    let bestVal = 0n;
    for (const txs of byToken.values()) {
      const maxVal = txs.reduce((m, t) => {
        try { const v = BigInt(t.valueRaw); return v > m ? v : m; } catch { return m; }
      }, 0n);
      if (maxVal > bestVal) {
        bestVal = maxVal;
        bestTx = txs.find(t => { try { return BigInt(t.valueRaw) === maxVal; } catch { return false; } }) ?? txs[0];
      }
    }

    const dest = bestTx.to;
    const cexMatch = isKnownExchange(dest, chain);
    const mixer = isMixerAddress(dest) || isMixerAddress(address);
    const sanctioned = isSanctionedAddress(dest) || isSanctionedAddress(address);
    const bridgeName = getBridgeName(dest, chain);
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? bestTx.timestamp - prevHop.timestamp : undefined;

    logEntry.chosenHash = bestTx.hash;
    logEntry.chosenTo = dest;
    logEntry.chosenToken = bestTx.token;
    logEntry.chosenValue = bestTx.valueHuman;
    bfsLog?.push(logEntry);

    hops.push({
      hop: hops.length + 1,
      from: address,
      to: dest,
      value: bestTx.valueHuman,
      valueRaw: bestTx.valueRaw,
      token: bestTx.token,
      txHash: bestTx.hash,
      blockNumber: bestTx.blockNumber,
      timestamp: bestTx.timestamp,
      explorerUrl: `${config.explorerBase}/tx/${bestTx.hash}`,
      label: cexMatch?.label,
      isMixer: mixer,
      isSanctioned: sanctioned,
      isBridge: bridgeName !== null,
      bridgeName: bridgeName ?? undefined,
      gapFromPrevSeconds,
      likely_truncated: windowFull || undefined, // M7
    });

    const currentHop = hops[hops.length - 1];
    let stopAfter = false;
    if (cexMatch && beyondCexRemaining === null) {
      console.log(`[TRACE] CEX destination found at hop ${hops.length}: ${cexMatch.label} (${dest}), tracing up to 5 more hops beyond`);
      for (const h of hops) delete (h as Partial<Hop>).partial_trace;
      currentHop.beyondCex = false;
      beyondCexRemaining = 5;
    } else if (beyondCexRemaining !== null) {
      currentHop.beyondCex = true;
      beyondCexRemaining -= 1;
      if (beyondCexRemaining <= 0) stopAfter = true;
    }

    console.log(`[TRACE] Added hop ${hops.length}: ${address} → ${dest} (${bestTx.token} ${bestTx.valueHuman}), pushing dest to queue`);
    console.log("[evm-bfs] hop-pick", { depth, fundingTs, outgoingCount: allOutgoing.length, validAfterFilter: outgoing.length, picked: { txHash: bestTx.hash, ts: bestTx.timestamp } });

    queue.push({ address: dest, depth: depth + 1, fundingTs: bestTx.timestamp });
    if (stopAfter) break;
  }

  return hops;
}

// ─── Solana tracer (Helius) ───────────────────────────────────────────────────

interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number; // lamports
}

interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  tokenAmount: number; // human-readable
  mint: string;
}

interface HeliusTx {
  signature: string;
  timestamp: number;
  slot: number;
  nativeTransfers?: HeliusNativeTransfer[];
  tokenTransfers?: HeliusTokenTransfer[];
}

async function traceSolana(
  startAddress: string,
  maxDepth = 10,
  bfsLog?: BfsLogEntry[],
  seedVisited?: Set<string>
): Promise<Hop[]> {
  const hops: Hop[] = [];
  let beyondCexRemaining: number | null = null;
  const visited = seedVisited ?? new Set<string>();
  const queue: Array<{ address: string; depth: number; fundingTs: number }> = [
    { address: startAddress, depth: 0, fundingTs: 0 },
  ];

  const apiKey = env.HELIUS_API_KEY ?? "";
  console.log(`[HELIUS] key length: ${apiKey.length}, address: ${startAddress}, maxDepth: ${maxDepth}`);
  if (!apiKey) {
    console.log(`[HELIUS] no key configured, returning empty hops`);
    return hops;
  }

  const heliusFetch = async (address: string): Promise<HeliusTx[]> => {
    const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=100`;
    try {
      const r = await fetch(url, { next: { revalidate: 60 }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        console.log(`[HELIUS] HTTP ${r.status}: ${body.slice(0, 200)}`);
        return [];
      }
      const json = await r.json();
      return Array.isArray(json) ? (json as HeliusTx[]) : [];
    } catch (err) {
      console.log(`[HELIUS] fetch error: ${(err as Error)?.message}`);
      return [];
    }
  };

  interface NormalizedSolTx {
    from: string;
    to: string;
    valueRaw: string;
    valueHuman: string;
    solEquivalent: number;
    token: string;
    hash: string;
    slot: number;
    timestamp: number;
  }

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth, fundingTs } = item;
    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);

    const txs = await heliusFetch(address);

    const nativeNorm: NormalizedSolTx[] = [];
    const tokenNorm: NormalizedSolTx[] = [];

    for (const tx of txs) {
      for (const n of tx.nativeTransfers ?? []) {
        if (n.fromUserAccount !== address) continue;
        const sol = n.amount / 1e9;
        nativeNorm.push({
          from: n.fromUserAccount,
          to: n.toUserAccount,
          valueRaw: String(n.amount),
          valueHuman: sol.toFixed(6),
          solEquivalent: sol,
          token: "SOL",
          hash: tx.signature,
          slot: tx.slot,
          timestamp: tx.timestamp,
        });
      }
      for (const t of tx.tokenTransfers ?? []) {
        if (t.fromUserAccount !== address) continue;
        tokenNorm.push({
          from: t.fromUserAccount,
          to: t.toUserAccount,
          valueRaw: String(t.tokenAmount),
          valueHuman: t.tokenAmount.toFixed(6),
          solEquivalent: 0, // unknown USD/SOL conversion; ranked below native
          token: t.mint.slice(0, 8),
          hash: tx.signature,
          slot: tx.slot,
          timestamp: tx.timestamp,
        });
      }
    }

    const allOutgoingSol = [...nativeNorm, ...tokenNorm].sort((a, b) => a.timestamp - b.timestamp);
    const outgoing = fundingTs > 0 ? allOutgoingSol.filter(t => t.timestamp >= fundingTs) : allOutgoingSol;

    console.log(`[HELIUS] native txs: ${nativeNorm.length}, token txs: ${tokenNorm.length}, outgoing: ${allOutgoingSol.length}, validAfterFilter: ${outgoing.length}`);

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: nativeNorm.length,
      tokenTxCount: tokenNorm.length,
      outgoingCount: outgoing.length,
    };

    if (!outgoing.length) {
      logEntry.skipReason = allOutgoingSol.length > 0 ? "no-valid-outgoing-after-funding" : "no outgoing txs";
      bfsLog?.push(logEntry);
      continue;
    }

    // Pick largest by SOL-equivalent; native wins over token when token has no SOL ranking
    let best = outgoing[0];
    for (const t of outgoing) {
      if (t.solEquivalent > best.solEquivalent) best = t;
    }
    if (best.solEquivalent === 0 && tokenNorm.length > 0) {
      // Fall back to largest token by raw value
      best = tokenNorm.reduce((m, t) =>
        Number(t.valueRaw) > Number(m.valueRaw) ? t : m, tokenNorm[0]);
    }

    const dest = best.to;
    const solExchanges = exchangeWallets.solana as Record<string, { exchange: string; label: string }>;
    const cexMatch = solExchanges[dest] ?? null;
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? best.timestamp - prevHop.timestamp : undefined;

    logEntry.chosenHash = best.hash;
    logEntry.chosenTo = dest;
    logEntry.chosenToken = best.token;
    logEntry.chosenValue = best.valueHuman;
    bfsLog?.push(logEntry);

    hops.push({
      hop: hops.length + 1,
      from: best.from,
      to: dest,
      value: best.valueHuman,
      valueRaw: best.valueRaw,
      token: best.token,
      txHash: best.hash,
      blockNumber: best.slot,
      timestamp: best.timestamp,
      explorerUrl: `https://solscan.io/tx/${best.hash}`,
      label: cexMatch?.label,
      gapFromPrevSeconds,
    });

    const currentHop = hops[hops.length - 1];
    let stopAfter = false;
    if (cexMatch && beyondCexRemaining === null) {
      currentHop.beyondCex = false;
      beyondCexRemaining = 5;
    } else if (beyondCexRemaining !== null) {
      currentHop.beyondCex = true;
      beyondCexRemaining -= 1;
      if (beyondCexRemaining <= 0) stopAfter = true;
    }
    console.log("[solana-bfs] hop-pick", { depth, fundingTs, outgoingCount: allOutgoingSol.length, validAfterFilter: outgoing.length, picked: { txHash: best.hash, ts: best.timestamp } });
    queue.push({ address: dest, depth: depth + 1, fundingTs: best.timestamp });
    if (stopAfter) break;
  }

  return hops;
}

// ─── Tron tracer ──────────────────────────────────────────────────────────────

async function traceTron(
  startAddress: string,
  maxDepth = 10,
  bfsLog?: BfsLogEntry[],
  seedVisited?: Set<string>
): Promise<Hop[]> {
  const hops: Hop[] = [];
  let beyondCexRemaining: number | null = null;
  const visited = seedVisited ?? new Set<string>();
  const queue: Array<{ address: string; depth: number; fundingTs: number }> = [
    { address: startAddress, depth: 0, fundingTs: 0 },
  ];
  const apiKey = env.TRONGRID_API_KEY ?? "";

  console.log("[tron-bfs] start", { address: startAddress, maxDepth, queueSize: queue.length });
  let terminationReason = "queue-empty";

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth, fundingTs } = item;
    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);
    console.log("[tron-bfs] iter", { depth, queueSize: queue.length, hopsCollected: hops.length, fundingTs });

    // Fetch TRX native + TRC-20 transfers in parallel
    const [trxRes, trc20Res] = await Promise.all([
      fetch(
        `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=50&only_from=true&order_by=block_timestamp,asc`,
        { headers: { "TRON-PRO-API-KEY": apiKey }, next: { revalidate: 60 } }
      ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(
        `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=50&only_from=true&order_by=block_timestamp,asc`,
        { headers: { "TRON-PRO-API-KEY": apiKey }, next: { revalidate: 60 } }
      ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]);

    const trxTxs = Array.isArray(trxRes?.data) ? trxRes.data : [];
    const trc20Txs = Array.isArray(trc20Res?.data) ? trc20Res.data : [];

    // Normalize TRX native txs
    interface NativeTronEntry { from: string; to: string; value: string; timestamp: number; hash: string; blockNumber: number }
    const nativeNorm: NativeTronEntry[] = trxTxs
      .filter((tx: any) =>
        tx.raw_data?.contract?.[0]?.type === "TransferContract" &&
        tx.ret?.[0]?.contractRet === "SUCCESS"
      )
      .map((tx: any) => {
        const c = tx.raw_data.contract[0].parameter.value;
        return {
          from: address,
          to: c.to_address,
          value: String(c.amount),
          timestamp: Math.floor(tx.block_timestamp / 1000),
          hash: tx.txID,
          blockNumber: tx.blockNumber ?? 0,
        };
      });

    // Normalize TRC-20 txs
    interface Trc20Entry { from: string; to: string; value: string; symbol: string; decimals: number; timestamp: number; hash: string; blockNumber: number }
    const trc20Norm: Trc20Entry[] = trc20Txs
      .filter((tx: any) => tx.from === address)
      .map((tx: any) => ({
        from: tx.from,
        to: tx.to,
        value: tx.value,
        symbol: tx.token_info?.symbol ?? "TRC20",
        decimals: tx.token_info?.decimals ?? 6,
        timestamp: Math.floor(tx.block_timestamp / 1000),
        hash: tx.transaction_id,
        blockNumber: 0,
      }));

    // Only consider outgoing txs that occurred at or after this address was funded
    const validNative = fundingTs > 0 ? nativeNorm.filter(t => t.timestamp >= fundingTs) : nativeNorm;
    const validTrc20 = fundingTs > 0 ? trc20Norm.filter(t => t.timestamp >= fundingTs) : trc20Norm;

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: nativeNorm.length,
      tokenTxCount: trc20Norm.length,
      outgoingCount: validNative.length + validTrc20.length,
    };

    // Pick best: largest native if any, else largest TRC-20
    let chosenFrom = address, chosenTo = "", chosenValue = "", chosenRaw = "0", chosenSymbol = "TRX", chosenTs = 0, chosenHash = "", chosenBlock = 0;
    let bestRaw = 0n;

    for (const t of validNative) {
      try {
        const v = BigInt(t.value);
        if (v > bestRaw) {
          bestRaw = v; chosenTo = t.to; chosenRaw = t.value;
          chosenValue = (Number(v) / 1_000_000).toFixed(6);
          chosenSymbol = "TRX"; chosenTs = t.timestamp; chosenHash = t.hash; chosenBlock = t.blockNumber;
        }
      } catch { /**/ }
    }
    for (const t of validTrc20) {
      try {
        const v = BigInt(t.value);
        const normalized = Number(v) / Math.pow(10, t.decimals);
        // Compare USD-rough: treat TRC20 as stablecoin equivalent, native TRX ~$0.12
        // Simple heuristic: if TRX chosen value < TRC20 value in absolute raw terms, prefer TRC20
        if (bestRaw === 0n || normalized > Number(bestRaw) / 1_000_000 * 0.12) {
          // prefer TRC-20 if no native chosen or TRC-20 is bigger in value
          if (bestRaw === 0n) {
            chosenTo = t.to; chosenRaw = t.value;
            chosenValue = normalized.toFixed(6);
            chosenSymbol = t.symbol; chosenTs = t.timestamp; chosenHash = t.hash; chosenBlock = t.blockNumber;
            bestRaw = v;
          }
        }
      } catch { /**/ }
    }

    if (!chosenTo) {
      logEntry.skipReason = (nativeNorm.length + trc20Norm.length > 0) ? "no-valid-outgoing-after-funding" : "no outgoing txs";
      bfsLog?.push(logEntry);
      continue;
    }
    console.log("[tron-bfs] hop-pick", { depth, fundingTs, outgoingCount: nativeNorm.length + trc20Norm.length, validAfterFilter: validNative.length + validTrc20.length, picked: { txHash: chosenHash, ts: chosenTs, value: chosenValue } });

    const tronExchanges = exchangeWallets.tron as Record<string, { exchange: string; label: string }>;
    const cexMatch = tronExchanges[chosenTo] ?? null;
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? chosenTs - prevHop.timestamp : undefined;

    logEntry.chosenHash = chosenHash;
    logEntry.chosenTo = chosenTo;
    logEntry.chosenToken = chosenSymbol;
    logEntry.chosenValue = chosenValue;
    bfsLog?.push(logEntry);

    hops.push({
      hop: hops.length + 1,
      from: chosenFrom,
      to: chosenTo,
      value: chosenValue,
      valueRaw: chosenRaw,
      token: chosenSymbol,
      txHash: chosenHash,
      blockNumber: chosenBlock,
      timestamp: chosenTs,
      explorerUrl: `https://tronscan.org/#/transaction/${chosenHash}`,
      label: cexMatch?.label,
      gapFromPrevSeconds,
    });

    const currentHop = hops[hops.length - 1];
    let stopAfter = false;
    if (cexMatch && beyondCexRemaining === null) {
      currentHop.beyondCex = false;
      beyondCexRemaining = 5;
    } else if (beyondCexRemaining !== null) {
      currentHop.beyondCex = true;
      beyondCexRemaining -= 1;
      if (beyondCexRemaining <= 0) stopAfter = true;
    }
    queue.push({ address: chosenTo, depth: depth + 1, fundingTs: chosenTs });
    if (stopAfter) { terminationReason = "cex-beyond-limit"; break; }
  }

  if (hops.length >= maxDepth) terminationReason = "depth-cap-reached";
  console.log("[tron-bfs] end", { hopsFound: hops.length, terminationReason, maxDepth });
  return hops;
}

// ─── Bitcoin tracer ───────────────────────────────────────────────────────────

const BTC_ADDRESS_RE = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;

interface MempoolVin {
  prevout?: { scriptpubkey_address?: string; value?: number };
}

interface MempoolVout {
  scriptpubkey_address?: string;
  value: number;
}

interface MempoolTx {
  txid: string;
  status: { block_height?: number; block_time?: number; confirmed: boolean };
  vin: MempoolVin[];
  vout: MempoolVout[];
}

async function traceBitcoin(
  startAddress: string,
  maxDepth = 10,
  bfsLog?: BfsLogEntry[],
  seedVisited?: Set<string>
): Promise<Hop[]> {
  if (!BTC_ADDRESS_RE.test(startAddress)) return [];

  const hops: Hop[] = [];
  let beyondCexRemaining: number | null = null;
  const visited = seedVisited ?? new Set<string>();
  const queue: Array<{ address: string; depth: number; fundingTs: number }> = [
    { address: startAddress, depth: 0, fundingTs: 0 },
  ];
  const btcExchanges = exchangeWallets.btc as Record<string, { exchange: string; label: string }>;

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth, fundingTs } = item;
    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);

    let txs: MempoolTx[] = [];
    try {
      const res = await fetch(
        `https://mempool.space/api/address/${address}/txs`,
        { next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000) }
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.log(`[MEMPOOL] HTTP ${res.status}: ${body.slice(0, 200)}`);
        bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "mempool http error" });
        continue;
      }
      const json = await res.json();
      txs = Array.isArray(json) ? (json as MempoolTx[]) : [];
    } catch (err) {
      console.log(`[MEMPOOL] fetch error: ${(err as Error)?.message}`);
      bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "mempool fetch error" });
      continue;
    }

    const outgoing = txs.filter(tx =>
      tx.vin.some(v => v.prevout?.scriptpubkey_address === address)
    );

    console.log(`[MEMPOOL] txs: ${txs.length}, outgoing: ${outgoing.length}`);

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: txs.length,
      tokenTxCount: 0,
      outgoingCount: outgoing.length,
    };

    // mempool.space returns newest first; sort ascending by block_time for chronological flow
    outgoing.sort((a, b) => (a.status.block_time ?? 0) - (b.status.block_time ?? 0));

    // Filter to txs at or after this address was funded (temporal integrity)
    const validOutgoing = fundingTs > 0 ? outgoing.filter(tx => (tx.status.block_time ?? 0) >= fundingTs) : outgoing;

    if (!validOutgoing.length) {
      logEntry.skipReason = outgoing.length > 0 ? "no-valid-outgoing-after-funding" : "no outgoing txs";
      bfsLog?.push(logEntry);
      continue;
    }

    const outTx = validOutgoing[0];
    const destVout = outTx.vout.find(o => o.scriptpubkey_address && o.scriptpubkey_address !== address);
    if (!destVout || !destVout.scriptpubkey_address) {
      logEntry.skipReason = "no external recipient";
      bfsLog?.push(logEntry);
      continue;
    }

    const dest = destVout.scriptpubkey_address;
    const cexMatch = btcExchanges[dest] ?? null;
    const timestamp = outTx.status.block_time ?? 0;
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? timestamp - prevHop.timestamp : undefined;

    logEntry.chosenHash = outTx.txid;
    logEntry.chosenTo = dest;
    logEntry.chosenToken = "BTC";
    logEntry.chosenValue = (destVout.value / 1e8).toFixed(8);
    bfsLog?.push(logEntry);

    hops.push({
      hop: hops.length + 1,
      from: address,
      to: dest,
      value: (destVout.value / 1e8).toFixed(8),
      valueRaw: String(destVout.value),
      token: "BTC",
      txHash: outTx.txid,
      blockNumber: outTx.status.block_height ?? 0,
      timestamp,
      explorerUrl: `https://mempool.space/tx/${outTx.txid}`,
      label: cexMatch?.label,
      gapFromPrevSeconds,
    });

    if (cexMatch) {
      if (beyondCexRemaining === null) beyondCexRemaining = 5;
    } else if (beyondCexRemaining !== null) {
      hops[hops.length - 1].beyondCex = true;
      beyondCexRemaining -= 1;
      if (beyondCexRemaining <= 0) break;
    }

    console.log("[btc-bfs] hop-pick", { depth, fundingTs, outgoingCount: outgoing.length, validAfterFilter: validOutgoing.length, picked: { txHash: outTx.txid, ts: timestamp } });
    queue.push({ address: dest, depth: depth + 1, fundingTs: timestamp });
  }

  return hops;
}

// ─── Deep analysis helpers ────────────────────────────────────────────────────

export function detectBridges(hops: Hop[]): Hop[] {
  return hops.filter(h => h.isBridge);
}

export function detectDeepMixers(hops: Hop[]): Hop[] {
  return hops.filter(h => h.isMixer);
}

export function clusterWallets(hops: Hop[]): ClusterResult {
  const addresses = new Set<string>();
  for (const hop of hops) {
    addresses.add(hop.from);
    addresses.add(hop.to);
  }
  const fromSet = new Set(hops.map(h => h.from.toLowerCase()));
  const toSet = new Set(hops.map(h => h.to.toLowerCase()));
  const commonFunders = [...fromSet].filter(a => toSet.has(a));
  return {
    seedAddress: hops[0]?.from ?? "",
    relatedAddresses: [...addresses].filter(a => a !== hops[0]?.from),
    commonFunder: commonFunders[0],
  };
}

export function analyzeTimings(hops: Hop[]): TimingFlag[] {
  const flags: TimingFlag[] = [];
  for (let i = 1; i < hops.length; i++) {
    const gap = hops[i].gapFromPrevSeconds ?? 0;
    if (gap < 60) {
      flags.push({ hopIndex: i, gapSeconds: gap, note: `Hop ${hops[i].hop} occurred only ${gap}s after hop ${hops[i - 1].hop} — possible automated layering` });
    } else if (gap > 86400 * 7) {
      flags.push({ hopIndex: i, gapSeconds: gap, note: `Hop ${hops[i].hop} occurred ${Math.floor(gap / 86400)} days after hop ${hops[i - 1].hop} — possible intentional delay` });
    }
  }
  return flags;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function traceAddress(
  address: string,
  chain: Chain,
  maxHops = 10,
  bfsLog?: BfsLogEntry[]
): Promise<Hop[]> {
  // Cache check — skip if caller passed bfsLog (debug mode wants live data)
  if (!bfsLog) {
    const cached = await getTraceCache(address, chain);
    console.log("[cache] supabase-check", { address, chain, hit: !!cached, hopCount: cached?.hops?.length ?? 0 });
    if (cached) return cached.hops;
    console.log("[cache] miss-running-bfs", { address, chain, maxHops });
  }

  let hops: Hop[];
  switch (chain) {
    case "eth":
    case "bsc":
    case "polygon":
    case "arbitrum":
    case "base":
      hops = await traceEvm(address, chain, maxHops, bfsLog);
      break;
    case "solana":
      hops = await traceSolana(address, maxHops, bfsLog);
      break;
    case "tron":
      hops = await traceTron(address, maxHops, bfsLog);
      break;
    case "btc":
      hops = await traceBitcoin(address, maxHops, bfsLog);
      break;
    default:
      throw new Error(`Unknown chain: ${chain}`);
  }
  const annotated = await annotateHopsWithScam(hops, chain);

  // Store result; partial traces get a 1-hour TTL so they'll be retried
  if (!bfsLog) await setTraceCache(address, chain, annotated, bfsLog);

  return annotated;
}


async function annotateHopsWithScam(hops: Hop[], chain: Chain): Promise<Hop[]> {
  if (hops.length === 0) return hops;
  const addresses = hops.flatMap(h => [h.from, h.to]);
  const matchMap = await lookupScamAddressBatch(addresses, chain);
  if (matchMap.size === 0) return hops;
  return hops.map(h => {
    const fromMatches = matchMap.get(h.from.toLowerCase()) ?? [];
    const toMatches = matchMap.get(h.to.toLowerCase()) ?? [];
    const allMatches = [...fromMatches, ...toMatches];
    return allMatches.length > 0 ? { ...h, scamMatches: allMatches } : h;
  });
}

export async function continueTrace(
  existingHops: Hop[],
  chain: Chain,
  maxTotalHops = 20
): Promise<Hop[]> {
  if (existingHops.length === 0) return [];
  const remaining = maxTotalHops - existingHops.length;
  if (remaining <= 0) return existingHops;

  const lastHop = existingHops[existingHops.length - 1];
  if (lastHop.label) return existingHops; // ended at CEX

  const lastDest = lastHop.to;

  // H2: seed visited from existing hops so BFS never re-enters an already-traced address
  const priorVisited = new Set<string>();
  for (const h of existingHops) {
    priorVisited.add(h.from.toLowerCase());
    priorVisited.add(h.to.toLowerCase());
  }
  priorVisited.delete(lastDest.toLowerCase());

  let extraHops: Hop[];
  switch (chain) {
    case "eth":
    case "bsc":
    case "polygon":
    case "arbitrum":
    case "base":
      extraHops = await traceEvm(lastDest, chain, remaining, undefined, priorVisited);
      break;
    case "solana":
      extraHops = await traceSolana(lastDest, remaining, undefined, priorVisited);
      break;
    case "tron":
      extraHops = await traceTron(lastDest, remaining, undefined, priorVisited);
      break;
    case "btc":
      extraHops = await traceBitcoin(lastDest, remaining, undefined, priorVisited);
      break;
    default:
      throw new Error(`Unknown chain: ${chain}`);
  }

  const renumbered = extraHops.map((h, i) => ({
    ...h,
    hop: existingHops.length + i + 1,
    gapFromPrevSeconds:
      i === 0 && lastHop ? h.timestamp - lastHop.timestamp : h.gapFromPrevSeconds,
  }));

  const annotated = await annotateHopsWithScam(renumbered, chain);
  return [...existingHops, ...annotated];
}

export function getExplorerAddressUrl(address: string, chain: Chain): string {
  const explorers: Record<Chain, string> = {
    eth:      "https://etherscan.io/address",
    bsc:      "https://bscscan.com/address",
    polygon:  "https://polygonscan.com/address",
    arbitrum: "https://arbiscan.io/address",
    base:     "https://basescan.org/address",
    solana:   "https://solscan.io/account",
    tron:     "https://tronscan.org/#/address",
    btc:      "https://mempool.space/address",
  };
  return `${explorers[chain]}/${address}`;
}

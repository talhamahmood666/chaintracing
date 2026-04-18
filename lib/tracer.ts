import exchangeWallets from "@/data/exchange-wallets.json";
import bridgeContracts from "@/data/bridge-contracts.json";
import mixerAddresses from "@/data/mixer-addresses.json";
import { EVM_CHAIN_CONFIG, getExplorerTxUrl, type EvmChainConfig } from "@/lib/chain-utils";
import { env } from "./config";
import { lookupScamAddressBatch, type ScamMatch } from "./scam-db";

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

async function etherscanFetch(
  params: Record<string, string>,
  attempt = 0
): Promise<unknown[]> {
  const p = new URLSearchParams({
    ...params,
    apikey: env.ETHERSCAN_API_KEY ?? "",
  });
  try {
    const res = await fetch(`${ETHERSCAN_V2}?${p}`, { next: { revalidate: 60 } });
    // 429 or Etherscan "Max rate limit reached" message
    if (res.status === 429) {
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1100));
        return etherscanFetch(params, 1);
      }
      throw new RateLimitError(params.chainid ?? "unknown");
    }
    if (!res.ok) return [];
    const json = await res.json();
    // Etherscan signals rate-limit in the result field too
    if (
      (json.status === "0" || json.status === 0) &&
      typeof json.result === "string" &&
      json.result.toLowerCase().includes("rate limit")
    ) {
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1100));
        return etherscanFetch(params, 1);
      }
      throw new RateLimitError(params.chainid ?? "unknown");
    }
    if (json.status === "0" || json.status === 0) return [];
    const result = Array.isArray(json.result) ? json.result : json.result?.result ?? [];
    return Array.isArray(result) ? result : [];
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
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
  const lower = address.toLowerCase();
  type ExMap = Record<string, { exchange: string; label: string }>;
  // Check chain-specific map first (bsc, polygon, arbitrum), then fall back to evm
  if (chain && chain !== "eth" && chain !== "solana" && chain !== "tron" && chain !== "btc") {
    const chainMap = (exchangeWallets as unknown as Record<string, ExMap>)[chain];
    if (chainMap?.[lower]) return chainMap[lower];
  }
  const entry = (exchangeWallets.evm as ExMap)[lower];
  return entry ?? null;
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
  const visited = seedVisited ?? new Set<string>();
  const queue: Array<{ address: string; depth: number }> = [
    { address: startAddress.toLowerCase(), depth: 0 },
  ];

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth } = item;

    if (visited.has(address) || depth >= maxDepth) {
      bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: visited.has(address) ? "already visited" : "max depth reached" });
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

    // Fetch both native and token transfers in parallel; handle rate-limit gracefully
    let nativeTxs: NormalizedTx[], tokenTxs: NormalizedTx[];
    try {
      [nativeTxs, tokenTxs] = await Promise.all([
        fetchNativeTxs(address, config),
        fetchTokenTxs(address, config),
      ]);
    } catch (err) {
      if (err instanceof RateLimitError) {
        // M4: annotate last hop and surface warning; don't lose what we have
        logEntry.skipReason = "rate limit hit";
        bfsLog?.push(logEntry);
        if (hops.length > 0) hops[hops.length - 1] = { ...hops[hops.length - 1], partial_trace: true };
        break;
      }
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

    // Only outgoing transfers FROM current address
    const outgoing = allTxs
      .filter(tx => tx.from === address)
      .sort((a, b) => a.timestamp - b.timestamp); // chronological

    logEntry.nativeTxCount = nativeTxs.filter(t => t.from === address).length;
    logEntry.tokenTxCount = tokenTxs.filter(t => t.from === address).length;
    logEntry.outgoingCount = outgoing.length;

    if (!outgoing.length) {
      logEntry.skipReason = "no outgoing txs found";
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

    // FIX: do NOT stop on scam/mixer/sanctioned flags — flag and continue tracing
    if (cexMatch) break; // Only stop at a known exchange

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
  maxDepth = 10,
  bfsLog?: BfsLogEntry[],
  seedVisited?: Set<string>
): Promise<Hop[]> {
  const hops: Hop[] = [];
  const visited = seedVisited ?? new Set<string>();
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

    // Fetch both SOL native and SPL token transfers
    const [solRes, splRes] = await Promise.all([
      fetch(
        `https://pro-api.solscan.io/v2.0/account/transfer?address=${address}&page=1&page_size=50&sort_by=block_time&sort_order=asc`,
        { headers: { token: apiKey }, next: { revalidate: 60 } }
      ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(
        `https://pro-api.solscan.io/v2.0/account/token/transfer?address=${address}&page=1&page_size=50&sort_by=block_time&sort_order=asc`,
        { headers: { token: apiKey }, next: { revalidate: 60 } }
      ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]);

    const solTxs: SolscanTx[] = Array.isArray(solRes?.data) ? solRes.data : [];
    const splTxs: SolscanTx[] = Array.isArray(splRes?.data) ? splRes.data : [];

    // Include SOL native + SPL token transfers; both have from_address/to_address
    const combined: SolscanTx[] = [...solTxs, ...splTxs];
    const outgoing = combined
      .filter(tx => tx.from_address === address)
      .sort((a, b) => a.block_time - b.block_time);

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: solTxs.filter(t => t.from_address === address).length,
      tokenTxCount: splTxs.filter(t => t.from_address === address).length,
      outgoingCount: outgoing.length,
    };

    if (!outgoing.length) {
      logEntry.skipReason = "no outgoing txs";
      bfsLog?.push(logEntry);
      continue;
    }

    const tx = outgoing[0];
    const dest = tx.to_address;
    const solExchanges = exchangeWallets.solana as Record<string, { exchange: string; label: string }>;
    const cexMatch = solExchanges[dest] ?? null;
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? tx.block_time - prevHop.timestamp : undefined;

    // Detect if it's an SPL token transfer
    const isSpl = (tx.activity_type ?? "").includes("SPL") || (tx.activity_type ?? "").includes("TOKEN");
    const decimals = isSpl ? 6 : 9;
    const symbol = isSpl ? "SPL" : "SOL";

    logEntry.chosenHash = tx.trans_id;
    logEntry.chosenTo = dest;
    logEntry.chosenToken = symbol;
    logEntry.chosenValue = (tx.amount / Math.pow(10, decimals)).toFixed(6);
    bfsLog?.push(logEntry);

    hops.push({
      hop: hops.length + 1,
      from: tx.from_address,
      to: dest,
      value: (tx.amount / Math.pow(10, decimals)).toFixed(6),
      valueRaw: String(tx.amount),
      token: symbol,
      txHash: tx.trans_id,
      blockNumber: tx.slot,
      timestamp: tx.block_time,
      explorerUrl: `https://solscan.io/tx/${tx.trans_id}`,
      label: cexMatch?.label,
      gapFromPrevSeconds,
    });

    if (cexMatch) break;
    queue.push({ address: dest, depth: depth + 1 });
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
  const visited = seedVisited ?? new Set<string>();
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

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: nativeNorm.length,
      tokenTxCount: trc20Norm.length,
      outgoingCount: nativeNorm.length + trc20Norm.length,
    };

    // Pick best: largest native if any, else largest TRC-20
    let chosenFrom = address, chosenTo = "", chosenValue = "", chosenRaw = "0", chosenSymbol = "TRX", chosenTs = 0, chosenHash = "", chosenBlock = 0;
    let bestRaw = 0n;

    for (const t of nativeNorm) {
      try {
        const v = BigInt(t.value);
        if (v > bestRaw) {
          bestRaw = v; chosenTo = t.to; chosenRaw = t.value;
          chosenValue = (Number(v) / 1_000_000).toFixed(6);
          chosenSymbol = "TRX"; chosenTs = t.timestamp; chosenHash = t.hash; chosenBlock = t.blockNumber;
        }
      } catch { /**/ }
    }
    for (const t of trc20Norm) {
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
      logEntry.skipReason = "no outgoing txs";
      bfsLog?.push(logEntry);
      continue;
    }

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

    if (cexMatch) break;
    queue.push({ address: chosenTo, depth: depth + 1 });
  }

  return hops;
}

// ─── Bitcoin tracer ───────────────────────────────────────────────────────────

const BTC_ADDRESS_RE = /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/;

interface BlockchairOutput {
  recipient: string;
  value: number;
}

interface BlockchairTx {
  transaction: { hash: string; block_id: number; time: string };
  outputs: BlockchairOutput[];
}

async function traceBitcoin(
  startAddress: string,
  maxDepth = 10,
  bfsLog?: BfsLogEntry[],
  seedVisited?: Set<string>
): Promise<Hop[]> {
  if (!BTC_ADDRESS_RE.test(startAddress)) return [];

  const hops: Hop[] = [];
  const visited = seedVisited ?? new Set<string>();
  const queue: Array<{ address: string; depth: number }> = [
    { address: startAddress, depth: 0 },
  ];

  while (queue.length > 0 && hops.length < maxDepth) {
    const item = queue.shift();
    if (!item) break;
    const { address, depth } = item;
    if (visited.has(address) || depth >= maxDepth) continue;
    visited.add(address);

    let json: { data?: Record<string, { transactions?: BlockchairTx[] }> };
    try {
      const res = await fetch(
        `https://api.blockchair.com/bitcoin/dashboards/address/${address}?limit=100&transaction_details=true`,
        { next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000) }
      );
      if (!res.ok) { bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "blockchair http error" }); continue; }
      json = await res.json();
    } catch {
      bfsLog?.push({ address, depth, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "blockchair fetch error" });
      continue;
    }

    const addrData = json.data?.[address];
    const txs: BlockchairTx[] = addrData?.transactions ?? [];

    const outgoing = txs.filter(tx =>
      tx.outputs.length > 0 &&
      !tx.outputs.every(o => o.recipient === address)
    );

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: txs.length,
      tokenTxCount: 0,
      outgoingCount: outgoing.length,
    };

    if (!outgoing.length) {
      logEntry.skipReason = "no outgoing txs";
      bfsLog?.push(logEntry);
      continue;
    }

    const outTx = outgoing[0];
    const dest = outTx.outputs.find(o => o.recipient !== address);
    if (!dest) {
      logEntry.skipReason = "no external recipient";
      bfsLog?.push(logEntry);
      continue;
    }

    const timestamp = Math.floor(new Date(outTx.transaction.time).getTime() / 1000);
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? timestamp - prevHop.timestamp : undefined;

    logEntry.chosenHash = outTx.transaction.hash;
    logEntry.chosenTo = dest.recipient;
    logEntry.chosenToken = "BTC";
    logEntry.chosenValue = (dest.value / 1e8).toFixed(8);
    bfsLog?.push(logEntry);

    hops.push({
      hop: hops.length + 1,
      from: address,
      to: dest.recipient,
      value: (dest.value / 1e8).toFixed(8),
      valueRaw: String(dest.value),
      token: "BTC",
      txHash: outTx.transaction.hash,
      blockNumber: outTx.transaction.block_id,
      timestamp,
      explorerUrl: `https://mempool.space/tx/${outTx.transaction.hash}`,
      gapFromPrevSeconds,
    });

    queue.push({ address: dest.recipient, depth: depth + 1 });
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
  return annotateHopsWithScam(hops, chain);
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

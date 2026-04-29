import exchangeWallets from "@/data/exchange-wallets.json";
import bridgeContracts from "@/data/bridge-contracts.json";
import mixerAddresses from "@/data/mixer-addresses.json";
import { EVM_CHAIN_CONFIG, getExplorerTxUrl, type EvmChainConfig } from "@/lib/chain-utils";
import { env } from "./config";
import { lookupScamAddressBatch, normalizeScamAddress, type ScamMatch } from "./scam-db";
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

type FetchMode = "recent" | "from-block";

/**
 * Fetch native transactions (ETH/BNB/MATIC etc.).
 * Default mode "recent" pulls the newest `limit` txs; the BFS re-sorts the
 * merged candidate set ascending for temporal integrity. Use "from-block" for
 * incident-mode tracing forward from a known hack block.
 */
async function fetchNativeTxs(
  address: string,
  config: ChainConfig,
  limit = 100,
  fetchMode: FetchMode = "recent",
  fromBlock?: number
): Promise<NormalizedTx[]> {
  const raw = (await etherscanFetch({
    chainid: config.chainId,
    module: "account",
    action: "txlist",
    address,
    startblock: String(fetchMode === "from-block" ? (fromBlock ?? 0) : 0),
    endblock: "99999999",
    page: "1",
    offset: String(limit),
    sort: fetchMode === "recent" ? "desc" : "asc",
  })) as RawEvmTx[];

  const result = raw
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
  const oldestTs = result.length ? Math.min(...result.map(t => t.timestamp)) : 0;
  const newestTs = result.length ? Math.max(...result.map(t => t.timestamp)) : 0;
  console.log(`[fetch:evm-native]`, { address, chainId: config.chainId, mode: fetchMode, returned: result.length, oldestTs, newestTs });
  return result;
}

/**
 * Fetch ERC-20 token transfers.  Many scam operations use USDT/USDC so this is
 * essential for real-world traces.
 */
async function fetchTokenTxs(
  address: string,
  config: ChainConfig,
  limit = 100,
  fetchMode: FetchMode = "recent",
  fromBlock?: number
): Promise<NormalizedTx[]> {
  const raw = (await etherscanFetch({
    chainid: config.chainId,
    module: "account",
    action: "tokentx",
    address,
    startblock: String(fetchMode === "from-block" ? (fromBlock ?? 0) : 0),
    endblock: "99999999",
    page: "1",
    offset: String(limit),
    sort: fetchMode === "recent" ? "desc" : "asc",
  })) as RawErc20Tx[];

  const result = raw
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
  const oldestTs = result.length ? Math.min(...result.map(t => t.timestamp)) : 0;
  const newestTs = result.length ? Math.max(...result.map(t => t.timestamp)) : 0;
  console.log(`[fetch:evm-token]`, { address, chainId: config.chainId, mode: fetchMode, returned: result.length, oldestTs, newestTs });
  return result;
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

// ─── Base chain QuickNode fallback ───────────────────────────────────────────
// Etherscan V2 free tier excludes Base (chainId 8453) — calls return NOTOK
// and Ankr free tier doesn't reliably index Base either. We use direct
// QuickNode JSON-RPC for ERC20 logs instead. Native ETH on Base is rare in
// scam contexts, so we skip it for now (TODO: block-scan if needed).

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

async function quickNodeRpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const url = process.env.QUICKNODE_BASE_URL;
  if (!url) return null;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.log(`[base-quicknode] HTTP ${r.status} on ${method}`);
      return null;
    }
    const j = await r.json();
    if (j.error) {
      console.log(`[base-quicknode] rpc error on ${method}:`, j.error?.message);
      return null;
    }
    return j.result as T;
  } catch (err) {
    console.log(`[base-quicknode] fetch error on ${method}:`, (err as Error)?.message);
    return null;
  }
}

function _padAddress(a: string): string {
  return "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

function _decodeStringResult(hex: string): string {
  if (!hex || hex === "0x") return "";
  const data = hex.slice(2);
  // Short bytes32-style return (no offset/length encoding)
  if (data.length < 128) {
    return Buffer.from(data, "hex").toString("utf8").replace(/\0+/g, "").trim();
  }
  const len = parseInt(data.slice(64, 128), 16);
  if (!len || len > 256) return "";
  const strHex = data.slice(128, 128 + len * 2);
  return Buffer.from(strHex, "hex").toString("utf8").replace(/\0+/g, "").trim();
}

interface QuickNodeLog {
  address: string;
  topics: string[];
  data: string;
  transactionHash: string;
  blockNumber: string;
}

const OVERSIZE = "OVERSIZE" as const;
type LogsResult = QuickNodeLog[] | typeof OVERSIZE | null;

function _isOversizeMessage(msg: string | undefined): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return m.includes("too large") || m.includes("size limit") ||
    m.includes("exceeds") || m.includes("response size") ||
    m.includes("limit exceeded") || m.includes("payload");
}

async function _quickNodeGetLogs(
  fromBlockHex: string,
  toBlockHex: string,
  topics: (string | null)[]
): Promise<LogsResult> {
  const url = process.env.QUICKNODE_BASE_URL;
  if (!url) return null;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getLogs",
        params: [{ fromBlock: fromBlockHex, toBlock: toBlockHex, topics }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (r.status === 413) {
      console.log(`[base-quicknode] HTTP 413 (payload too large) on eth_getLogs`);
      return OVERSIZE;
    }
    if (!r.ok) {
      console.log(`[base-quicknode] HTTP ${r.status} on eth_getLogs`);
      return null;
    }
    const j = await r.json();
    if (j.error) {
      if (_isOversizeMessage(j.error?.message)) {
        console.log(`[base-quicknode] RPC oversize error on eth_getLogs:`, j.error.message);
        return OVERSIZE;
      }
      console.log(`[base-quicknode] rpc error on eth_getLogs:`, j.error?.message);
      return null;
    }
    return Array.isArray(j.result) ? (j.result as QuickNodeLog[]) : null;
  } catch (err) {
    console.log(`[base-quicknode] fetch error on eth_getLogs:`, (err as Error)?.message);
    return null;
  }
}

// Note: pathological high-throughput contracts (USDC token contract, Uniswap
// routers) have tens of thousands of Transfer events even in tiny windows and
// will likely never fit under the JSON-RPC payload cap. Real scam-victim
// addresses have far fewer transfers and succeed at the 5k-block default.
async function fetchLogsWithRetry(
  address: string,
  latestBlock: number
): Promise<QuickNodeLog[]> {
  const topics = [TRANSFER_TOPIC, _padAddress(address), null];
  const minWindow = 100;
  let window = 5000;

  while (true) {
    const fromHex = "0x" + Math.max(0, latestBlock - window).toString(16);
    const res = await _quickNodeGetLogs(fromHex, "latest", topics);

    if (res === OVERSIZE) {
      const next = Math.floor(window / 2);
      if (next < minWindow) {
        console.log(`[base-quicknode] oversize at window ${window}, next ${next} below min ${minWindow}, attempting last-ditch 50-block window`);
        const lastDitchHex = "0x" + Math.max(0, latestBlock - 50).toString(16);
        const last = await _quickNodeGetLogs(lastDitchHex, "latest", topics);
        if (last && last !== OVERSIZE) {
          console.log(`[base-quicknode] last-ditch 50-block window succeeded, results ${last.length}`);
          return last;
        }
        console.log(`[base-quicknode] last-ditch 50-block window failed, returning empty`);
        return [];
      }
      console.log(`[base-quicknode] HTTP 413, retry: window ${window} → ${next}`);
      window = next;
      continue;
    }

    if (!res) {
      console.log(`[base-quicknode] non-oversize failure at window ${window}, returning empty`);
      return [];
    }

    // Success: try one expansion if results are sparse
    if (res.length < 50 && window < 20000) {
      const expanded = Math.min(window * 4, 20000);
      const expHex = "0x" + Math.max(0, latestBlock - expanded).toString(16);
      const expRes = await _quickNodeGetLogs(expHex, "latest", topics);
      if (expRes && expRes !== OVERSIZE) {
        console.log(`[base-quicknode] expanded window ${window} → ${expanded}, results ${res.length} → ${expRes.length}`);
        return expRes;
      }
      console.log(`[base-quicknode] expansion to ${expanded} failed, keeping ${res.length} results from window ${window}`);
    }
    console.log(`[base-quicknode] success at window ${window}, results ${res.length}`);
    return res;
  }
}

async function fetchBaseViaQuickNode(
  address: string,
  limit = 100
): Promise<{ native: NormalizedTx[]; token: NormalizedTx[] }> {
  if (!process.env.QUICKNODE_BASE_URL) {
    console.log("[base-quicknode] QUICKNODE_BASE_URL not set, returning empty");
    return { native: [], token: [] };
  }

  const latestHex = await quickNodeRpc<string>("eth_blockNumber", []);
  if (!latestHex) return { native: [], token: [] };
  const latest = parseInt(latestHex, 16);

  const logs = await fetchLogsWithRetry(address, latest);
  if (logs.length === 0) {
    console.log("[fetch:base-quicknode]", { address, returned: 0 });
    return { native: [], token: [] };
  }

  // Cap to most-recent `limit` to keep BFS fast.
  const sorted = logs
    .slice()
    .sort((a, b) => parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16))
    .slice(0, limit);

  const metaCache = new Map<string, { symbol: string; decimals: number }>();
  async function getMeta(contract: string): Promise<{ symbol: string; decimals: number }> {
    const key = contract.toLowerCase();
    const hit = metaCache.get(key);
    if (hit) return hit;
    let symbol = "ERC20", decimals = 18;
    const symRes = await quickNodeRpc<string>("eth_call", [{ to: contract, data: "0x95d89b41" }, "latest"]);
    if (symRes) { const s = _decodeStringResult(symRes); if (s) symbol = s; }
    const decRes = await quickNodeRpc<string>("eth_call", [{ to: contract, data: "0x313ce567" }, "latest"]);
    if (decRes && decRes !== "0x") { const d = parseInt(decRes, 16); if (Number.isFinite(d) && d >= 0 && d <= 36) decimals = d; }
    const m = { symbol, decimals };
    metaCache.set(key, m);
    return m;
  }

  const tsCache = new Map<string, number>();
  async function getTs(blockHex: string): Promise<number> {
    const hit = tsCache.get(blockHex);
    if (hit !== undefined) return hit;
    const blk = await quickNodeRpc<{ timestamp: string }>("eth_getBlockByNumber", [blockHex, false]);
    const ts = blk?.timestamp ? parseInt(blk.timestamp, 16) : 0;
    tsCache.set(blockHex, ts);
    await new Promise(r => setTimeout(r, 40)); // QuickNode free tier: 25 req/sec
    return ts;
  }

  const result: NormalizedTx[] = [];
  for (const log of sorted) {
    try {
      const meta = await getMeta(log.address);
      const ts = await getTs(log.blockNumber);
      const toRaw = log.topics[2] ?? "0x0";
      const to = "0x" + toRaw.slice(-40).toLowerCase();
      const valueRaw = BigInt(log.data || "0x0").toString();
      const valueHuman = (Number(BigInt(valueRaw)) / Math.pow(10, meta.decimals))
        .toFixed(meta.decimals > 6 ? 6 : meta.decimals);
      result.push({
        hash: log.transactionHash,
        from: address.toLowerCase(),
        to,
        valueRaw,
        valueHuman,
        token: meta.symbol,
        blockNumber: parseInt(log.blockNumber, 16),
        timestamp: ts,
      });
    } catch (err) {
      console.log("[base-quicknode] log parse error:", (err as Error)?.message);
    }
  }

  const oldestTs = result.length ? Math.min(...result.map(t => t.timestamp)) : 0;
  const newestTs = result.length ? Math.max(...result.map(t => t.timestamp)) : 0;
  console.log("[fetch:base-quicknode]", { address, returned: result.length, oldestTs, newestTs });

  return { native: [], token: result };
}

// ─── BSC via Alchemy RPC (Etherscan V2 free tier excludes BSC) ───────────────

async function alchemyBscRpc<T>(method: string, params: unknown[]): Promise<T | null> {
  const url = process.env.ALCHEMY_BSC_URL;
  if (!url) return null;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.log(`[bsc-alchemy] HTTP ${r.status} on ${method}`);
      return null;
    }
    const j = await r.json();
    if (j.error) {
      console.log(`[bsc-alchemy] rpc error on ${method}:`, j.error?.message);
      return null;
    }
    return j.result as T;
  } catch (err) {
    console.log(`[bsc-alchemy] fetch error on ${method}:`, (err as Error)?.message);
    return null;
  }
}

async function _alchemyBscGetLogs(
  fromBlockHex: string,
  toBlockHex: string,
  topics: (string | null)[]
): Promise<LogsResult> {
  const url = process.env.ALCHEMY_BSC_URL;
  if (!url) return null;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getLogs",
        params: [{ fromBlock: fromBlockHex, toBlock: toBlockHex, topics }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (r.status === 413) {
      console.log(`[bsc-alchemy] HTTP 413 (payload too large) on eth_getLogs`);
      return OVERSIZE;
    }
    if (!r.ok) {
      console.log(`[bsc-alchemy] HTTP ${r.status} on eth_getLogs`);
      return null;
    }
    const j = await r.json();
    if (j.error) {
      if (_isOversizeMessage(j.error?.message)) {
        console.log(`[bsc-alchemy] RPC oversize error on eth_getLogs:`, j.error.message);
        return OVERSIZE;
      }
      console.log(`[bsc-alchemy] rpc error on eth_getLogs:`, j.error?.message);
      return null;
    }
    return Array.isArray(j.result) ? (j.result as QuickNodeLog[]) : null;
  } catch (err) {
    console.log(`[bsc-alchemy] fetch error on eth_getLogs:`, (err as Error)?.message);
    return null;
  }
}

async function fetchBscLogsWithRetry(
  address: string,
  latestBlock: number
): Promise<QuickNodeLog[]> {
  const topics = [TRANSFER_TOPIC, _padAddress(address), null];
  const minWindow = 100;
  let window = 5000;

  while (true) {
    const fromHex = "0x" + Math.max(0, latestBlock - window).toString(16);
    const res = await _alchemyBscGetLogs(fromHex, "latest", topics);

    if (res === OVERSIZE) {
      const next = Math.floor(window / 2);
      if (next < minWindow) {
        console.log(`[bsc-alchemy] oversize at window ${window}, next ${next} below min ${minWindow}, attempting last-ditch 50-block window`);
        const lastDitchHex = "0x" + Math.max(0, latestBlock - 50).toString(16);
        const last = await _alchemyBscGetLogs(lastDitchHex, "latest", topics);
        if (last && last !== OVERSIZE) {
          console.log(`[bsc-alchemy] last-ditch 50-block window succeeded, results ${last.length}`);
          return last;
        }
        console.log(`[bsc-alchemy] last-ditch 50-block window failed, returning empty`);
        return [];
      }
      console.log(`[bsc-alchemy] HTTP 413, retry: window ${window} → ${next}`);
      window = next;
      continue;
    }

    if (!res) {
      console.log(`[bsc-alchemy] non-oversize failure at window ${window}, returning empty`);
      return [];
    }

    if (res.length < 50 && window < 20000) {
      const expanded = Math.min(window * 4, 20000);
      const expHex = "0x" + Math.max(0, latestBlock - expanded).toString(16);
      const expRes = await _alchemyBscGetLogs(expHex, "latest", topics);
      if (expRes && expRes !== OVERSIZE) {
        console.log(`[bsc-alchemy] expanded window ${window} → ${expanded}, results ${res.length} → ${expRes.length}`);
        return expRes;
      }
      console.log(`[bsc-alchemy] expansion to ${expanded} failed, keeping ${res.length} results from window ${window}`);
    }
    console.log(`[bsc-alchemy] success at window ${window}, results ${res.length}`);
    return res;
  }
}

async function fetchBscViaAlchemy(
  address: string,
  limit = 100
): Promise<{ native: NormalizedTx[]; token: NormalizedTx[] }> {
  if (!process.env.ALCHEMY_BSC_URL) {
    console.log("[bsc-alchemy] missing ALCHEMY_BSC_URL");
    return { native: [], token: [] };
  }

  const latestHex = await alchemyBscRpc<string>("eth_blockNumber", []);
  if (!latestHex) return { native: [], token: [] };
  const latest = parseInt(latestHex, 16);

  const logs = await fetchBscLogsWithRetry(address, latest);
  if (logs.length === 0) {
    console.log("[fetch:bsc-alchemy]", { address, returned: 0 });
    return { native: [], token: [] };
  }

  const sorted = logs
    .slice()
    .sort((a, b) => parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16))
    .slice(0, limit);

  const metaCache = new Map<string, { symbol: string; decimals: number }>();
  async function getMeta(contract: string): Promise<{ symbol: string; decimals: number }> {
    const key = contract.toLowerCase();
    const hit = metaCache.get(key);
    if (hit) return hit;
    let symbol = "ERC20", decimals = 18;
    const symRes = await alchemyBscRpc<string>("eth_call", [{ to: contract, data: "0x95d89b41" }, "latest"]);
    if (symRes) { const s = _decodeStringResult(symRes); if (s) symbol = s; }
    const decRes = await alchemyBscRpc<string>("eth_call", [{ to: contract, data: "0x313ce567" }, "latest"]);
    if (decRes && decRes !== "0x") { const d = parseInt(decRes, 16); if (Number.isFinite(d) && d >= 0 && d <= 36) decimals = d; }
    const m = { symbol, decimals };
    metaCache.set(key, m);
    return m;
  }

  const tsCache = new Map<string, number>();
  async function getTs(blockHex: string): Promise<number> {
    const hit = tsCache.get(blockHex);
    if (hit !== undefined) return hit;
    const blk = await alchemyBscRpc<{ timestamp: string }>("eth_getBlockByNumber", [blockHex, false]);
    const ts = blk?.timestamp ? parseInt(blk.timestamp, 16) : 0;
    tsCache.set(blockHex, ts);
    await new Promise(r => setTimeout(r, 40));
    return ts;
  }

  const result: NormalizedTx[] = [];
  for (const log of sorted) {
    try {
      const meta = await getMeta(log.address);
      const ts = await getTs(log.blockNumber);
      const toRaw = log.topics[2] ?? "0x0";
      const to = "0x" + toRaw.slice(-40).toLowerCase();
      const valueRaw = BigInt(log.data || "0x0").toString();
      const valueHuman = (Number(BigInt(valueRaw)) / Math.pow(10, meta.decimals))
        .toFixed(meta.decimals > 6 ? 6 : meta.decimals);
      result.push({
        hash: log.transactionHash,
        from: address.toLowerCase(),
        to,
        valueRaw,
        valueHuman,
        token: meta.symbol,
        blockNumber: parseInt(log.blockNumber, 16),
        timestamp: ts,
      });
    } catch (err) {
      console.log("[bsc-alchemy] log parse error:", (err as Error)?.message);
    }
  }

  const oldestTs = result.length ? Math.min(...result.map(t => t.timestamp)) : 0;
  const newestTs = result.length ? Math.max(...result.map(t => t.timestamp)) : 0;
  console.log("[fetch:bsc-alchemy]", { address, returned: result.length, oldestTs, newestTs });

  return { native: [], token: result };
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

  // Base (chainId 8453) is excluded from Etherscan V2 free tier — use QuickNode RPC.
  if (config.chainId === "8453") {
    const result = await fetchBaseViaQuickNode(address, 100);
    cache.set(address, { native: result.native, token: result.token, fetchedAt: Date.now() });
    return result;
  }

  // BSC (chainId 56) is excluded from Etherscan V2 free tier — use Alchemy RPC.
  if (config.chainId === "56") {
    const result = await fetchBscViaAlchemy(address, 100);
    cache.set(address, { native: result.native, token: result.token, fetchedAt: Date.now() });
    return result;
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

// ─── Tiered transfer selection (Bug fix: dimensional comparison) ─────────────
// Comparing raw BigInt values across tokens with different decimals is invalid:
// e.g. 0.001 ETH (10^15) appears "larger" than 1,000,000 USDT (10^12). Tier by
// economic significance instead: stablecoins → natives → same-token fallback.

const STABLECOIN_SYMBOLS = new Set([
  "USDT", "USDC", "USDC.E", "BUSD", "DAI", "FDUSD", "TUSD", "USDE", "PYUSD", "USDP", "GUSD",
]);
const NATIVE_SYMBOLS = new Set([
  "ETH", "BNB", "MATIC", "POL", "AVAX", "TRX", "SOL", "BTC",
]);

function _isStable(sym: string): boolean { return STABLECOIN_SYMBOLS.has(sym.toUpperCase()); }
function _isNative(sym: string): boolean { return NATIVE_SYMBOLS.has(sym.toUpperCase()); }

function _nativeDustRaw(sym: string): bigint {
  const s = sym.toUpperCase();
  if (s === "TRX") return 1_000_000n;             // 1 TRX
  if (s === "BNB" || s === "MATIC" || s === "POL") return 10n ** 16n; // 0.01
  return 10n ** 15n;                              // 0.001 ETH/AVAX/etc.
}

interface SelectableTx { token: string; valueRaw: string; valueHuman: string }

function selectBestTransfer<T extends SelectableTx>(txs: T[]): T | null {
  if (!txs.length) return null;

  // Tier 1: stablecoins ≥ $1, ranked by human-readable value.
  const stables = txs.filter(t => _isStable(t.token) && parseFloat(t.valueHuman) >= 1.0);
  if (stables.length) {
    return stables.reduce((m, t) =>
      parseFloat(t.valueHuman) > parseFloat(m.valueHuman) ? t : m
    );
  }

  // Tier 2: native chain tokens above per-chain dust, ranked by raw value.
  const natives = txs.filter(t => {
    if (!_isNative(t.token)) return false;
    try { return BigInt(t.valueRaw) >= _nativeDustRaw(t.token); } catch { return false; }
  });
  if (natives.length) {
    return natives.reduce((m, t) => {
      try { return BigInt(t.valueRaw) > BigInt(m.valueRaw) ? t : m; } catch { return m; }
    });
  }

  // Tier 3: largest within a single token group (never compare across tokens).
  const byToken = new Map<string, T[]>();
  for (const tx of txs) {
    if (!byToken.has(tx.token)) byToken.set(tx.token, []);
    byToken.get(tx.token)!.push(tx);
  }
  let best: T | null = null;
  let bestVal = -1n;
  for (const group of byToken.values()) {
    for (const t of group) {
      try {
        const v = BigInt(t.valueRaw);
        if (v > bestVal) { bestVal = v; best = t; }
      } catch { /* skip non-numeric raws */ }
    }
  }
  return best;
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

  console.log("[tracer:evm]", { startAddress, chain, maxHops: maxDepth });
  if (chain === "bsc") {
    console.log("[tracer:bsc]", { startAddress, maxHops: maxDepth });
  }
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

    // Tiered selection: stablecoins → natives → same-token fallback.
    const bestTx = selectBestTransfer(outgoing) ?? outgoing[0];
    if (chain === "base") {
      console.log(`[BASE-DEBUG] ${address}: native=${nativeTxs.length}, token=${tokenTxs.length}, outgoing=${outgoing.length}, picked=${bestTx.token} ${bestTx.valueHuman}`);
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

  console.log("[tracer:solana]", { startAddress, maxHops: maxDepth });
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
      const arr = Array.isArray(json) ? (json as HeliusTx[]) : [];
      const oldestTs = arr.length ? Math.min(...arr.map(t => t.timestamp ?? 0)) : 0;
      const newestTs = arr.length ? Math.max(...arr.map(t => t.timestamp ?? 0)) : 0;
      console.log(`[fetch:solana]`, { address, mode: "recent", returned: arr.length, oldestTs, newestTs });
      return arr;
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
        const SOL_MINT_SYMBOL: Record<string, string> = {
          "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
          "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
        };
        const symbol = SOL_MINT_SYMBOL[t.mint] ?? t.mint.slice(0, 8);
        tokenNorm.push({
          from: t.fromUserAccount,
          to: t.toUserAccount,
          valueRaw: String(t.tokenAmount),
          valueHuman: t.tokenAmount.toFixed(6),
          solEquivalent: 0, // unknown USD/SOL conversion; ranked below native
          token: symbol,
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

    // Tiered selection: stablecoins → SOL native → same-token fallback.
    const best = (selectBestTransfer(outgoing) ?? outgoing[0]) as NormalizedSolTx;

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
  console.log("[tracer:tron]", { startAddress, maxHops: maxDepth });
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
        `https://api.trongrid.io/v1/accounts/${address}/transactions?limit=50&only_from=true&order_by=block_timestamp,desc`,
        { headers: { "TRON-PRO-API-KEY": apiKey }, next: { revalidate: 60 } }
      ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(
        `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=50&only_from=true&order_by=block_timestamp,desc`,
        { headers: { "TRON-PRO-API-KEY": apiKey }, next: { revalidate: 60 } }
      ).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]);

    const trxTxs = Array.isArray(trxRes?.data) ? trxRes.data : [];
    const trc20Txs = Array.isArray(trc20Res?.data) ? trc20Res.data : [];
    console.log(`[fetch:tron]`, { address, mode: "recent", nativeReturned: trxTxs.length, trc20Returned: trc20Txs.length });

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

    // Unify into one candidate list, then run tiered selection.
    interface TronCandidate extends SelectableTx {
      to: string; timestamp: number; hash: string; blockNumber: number;
    }
    const candidates: TronCandidate[] = [
      ...validNative.map(t => ({
        token: "TRX",
        valueRaw: t.value,
        valueHuman: ((() => { try { return Number(BigInt(t.value)) / 1_000_000; } catch { return 0; } })()).toFixed(6),
        to: t.to, timestamp: t.timestamp, hash: t.hash, blockNumber: t.blockNumber,
      })),
      ...validTrc20.map(t => ({
        token: t.symbol,
        valueRaw: t.value,
        valueHuman: ((() => { try { return Number(BigInt(t.value)) / Math.pow(10, t.decimals); } catch { return 0; } })()).toFixed(6),
        to: t.to, timestamp: t.timestamp, hash: t.hash, blockNumber: t.blockNumber,
      })),
    ];

    let chosenFrom = address, chosenTo = "", chosenValue = "", chosenRaw = "0", chosenSymbol = "TRX", chosenTs = 0, chosenHash = "", chosenBlock = 0;
    const bestCandidate = selectBestTransfer(candidates);
    if (bestCandidate) {
      chosenTo = bestCandidate.to;
      chosenRaw = bestCandidate.valueRaw;
      chosenValue = bestCandidate.valueHuman;
      chosenSymbol = bestCandidate.token;
      chosenTs = bestCandidate.timestamp;
      chosenHash = bestCandidate.hash;
      chosenBlock = bestCandidate.blockNumber;
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
  console.log("[tracer:btc]", { startAddress, maxHops: maxDepth });
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

    // FIX#5: Pagination — if no outgoing found and mempool returned a full page, fetch older txs
    let allTxs = txs;
    if (txs.length === 50) {
      let page = 1;
      let lastTxid = txs[txs.length - 1]?.txid;
      while (page < 3 && lastTxid) {
        try {
          const pageRes = await fetch(
            `https://mempool.space/api/address/${address}/txs/chain/${lastTxid}`,
            { next: { revalidate: 60 }, signal: AbortSignal.timeout(15_000) }
          );
          if (!pageRes.ok) { console.log(`[MEMPOOL] pagination HTTP ${pageRes.status} at page ${page + 1}`); break; }
          const pageJson = await pageRes.json();
          const pageTxs: MempoolTx[] = Array.isArray(pageJson) ? (pageJson as MempoolTx[]) : [];
          if (pageTxs.length === 0) break;
          allTxs = allTxs.concat(pageTxs);
          lastTxid = pageTxs[pageTxs.length - 1]?.txid;
          page++;
          if (pageTxs.length < 50) break;
        } catch (err) {
          console.log(`[MEMPOOL] pagination fetch error page ${page + 1}: ${(err as Error)?.message}`);
          break;
        }
      }
    }

    const outgoing = allTxs.filter(tx =>
      tx.vin.some(v => v.prevout?.scriptpubkey_address === address)
    );

    console.log(`[MEMPOOL] txs: ${allTxs.length}, outgoing: ${outgoing.length}`);

    const logEntry: BfsLogEntry = {
      address, depth,
      nativeTxCount: allTxs.length,
      tokenTxCount: 0,
      outgoingCount: outgoing.length,
    };

    // FIX#4: Deposit-only detection — incoming txs but zero outgoing
    if (outgoing.length === 0 && allTxs.length > 0) {
      const hasIncoming = allTxs.some(tx => tx.vout.some(o => o.scriptpubkey_address === address));
      if (hasIncoming && hops.length > 0) {
        hops[hops.length - 1].label = hops[hops.length - 1].label ?? "Deposit address (no outflow)";
      }
      logEntry.skipReason = "deposit-only: no outgoing txs";
      bfsLog?.push(logEntry);
      console.log(`[btc-bfs] skip deposit-only`, { depth, address, txCount: allTxs.length });
      break;
    }

    // FIX#2: Sort — treat missing block_time as Infinity (unconfirmed goes to end)
    // FIX#3: Depth-0 genesis — sort descending to pick most recent outgoing tx
    const confirmedOutgoing = outgoing.filter(tx => tx.status.block_time !== undefined);
    const unconfirmedOutgoing = outgoing.filter(tx => tx.status.block_time === undefined);
    if (depth === 0 && fundingTs === 0) {
      // Genesis address: pick most recent confirmed outgoing tx
      confirmedOutgoing.sort((a, b) => (b.status.block_time ?? 0) - (a.status.block_time ?? 0));
    } else {
      // Normal: oldest confirmed first (chronological flow)
      confirmedOutgoing.sort((a, b) => (a.status.block_time ?? 0) - (b.status.block_time ?? 0));
    }
    // Prefer confirmed; fall back to unconfirmed only if no confirmed exist
    const sortedOutgoing = confirmedOutgoing.length > 0 ? confirmedOutgoing : unconfirmedOutgoing;

    // Filter to txs at or after this address was funded (temporal integrity)
    const validOutgoing = fundingTs > 0
      ? sortedOutgoing.filter(tx => (tx.status.block_time ?? 0) >= fundingTs)
      : sortedOutgoing;

    if (!validOutgoing.length) {
      const reason = outgoing.length > 0 ? "no-valid-outgoing-after-funding" : "no outgoing txs";
      logEntry.skipReason = reason;
      // Temporal filter exit = clean terminal (pooled/processor address), NOT a partial trace.
      // Only label as high-volume hot wallet when tx count suggests it.
      if (reason === "no-valid-outgoing-after-funding" && allTxs.length >= 50 && hops.length > 0) {
        const lastHop = hops[hops.length - 1];
        if (!lastHop.label) lastHop.label = "Likely processor or hot wallet (high tx volume, funds pooled)";
      }
      bfsLog?.push(logEntry);
      console.log(`[btc-bfs] skip ${reason}`, { depth, address, outgoingCount: outgoing.length, fundingTs, txTotal: allTxs.length });
      continue;
    }

    const outTx = validOutgoing[0];

    // FIX#6: Pick largest-value non-self vout instead of first non-self (avoids change outputs)
    const externalVouts = outTx.vout.filter(o => o.scriptpubkey_address && o.scriptpubkey_address !== address);
    const destVout = externalVouts.reduce<typeof externalVouts[0] | undefined>(
      (best, o) => (!best || o.value > best.value ? o : best),
      undefined
    );
    if (!destVout || !destVout.scriptpubkey_address) {
      logEntry.skipReason = "no external recipient";
      if (hops.length > 0) hops[hops.length - 1].partial_trace = true; // FIX#7
      bfsLog?.push(logEntry);
      console.log(`[btc-bfs] skip no-external-recipient`, { depth, address, txid: outTx.txid });
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

    console.log("[btc-bfs] hop-pick", { depth, fundingTs, outgoingCount: outgoing.length, validAfterFilter: validOutgoing.length, picked: { txHash: outTx.txid, ts: timestamp, dest } });
    queue.push({ address: dest, depth: depth + 1, fundingTs: timestamp });
  }

  return hops;
}

// ─── Bitcoin UTXO-chain tracer (Mode 1) ──────────────────────────────────────

interface MempoolOutspend {
  spent: boolean;
  txid?: string;
  vin?: number;
  status?: { block_height?: number; block_time?: number; confirmed: boolean };
}

async function fetchMempoolTx(txid: string): Promise<MempoolTx | null> {
  try {
    const res = await fetch(`https://mempool.space/api/tx/${txid}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.log(`[btc-utxo] tx fetch HTTP ${res.status} for ${txid}`);
      return null;
    }
    return (await res.json()) as MempoolTx;
  } catch (err) {
    console.log(`[btc-utxo] tx fetch error ${txid}: ${(err as Error)?.message}`);
    return null;
  }
}

async function fetchOutspends(txid: string): Promise<MempoolOutspend[] | null> {
  try {
    const res = await fetch(`https://mempool.space/api/tx/${txid}/outspends`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.log(`[btc-utxo] outspends HTTP ${res.status} for ${txid}`);
      return null;
    }
    return (await res.json()) as MempoolOutspend[];
  } catch (err) {
    console.log(`[btc-utxo] outspends fetch error ${txid}: ${(err as Error)?.message}`);
    return null;
  }
}

export async function traceBitcoinUtxo(
  startTxid: string,
  startVout: number,
  maxHops = 10,
  bfsLog?: BfsLogEntry[]
): Promise<Hop[]> {
  const hops: Hop[] = [];
  const btcExchanges = exchangeWallets.btc as Record<string, { exchange: string; label: string }>;
  let beyondCexRemaining: number | null = null;

  let currentTxid = startTxid;
  let currentVout = startVout;
  let prevToAddress: string | undefined;

  console.log(`[btc-utxo] start`, { startTxid, startVout, maxHops });

  while (hops.length < maxHops) {
    // Fetch outspends for current tx
    const outspends = await fetchOutspends(currentTxid);
    if (!outspends) {
      console.log(`[btc-utxo] outspends fetch failed`, { txid: currentTxid, vout: currentVout });
      if (hops.length > 0) hops[hops.length - 1].partial_trace = true;
      bfsLog?.push({ address: currentTxid, depth: hops.length, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "outspends-fetch-error" });
      break;
    }

    const outspend = outspends[currentVout];
    if (!outspend) {
      console.log(`[btc-utxo] vout index out of range`, { txid: currentTxid, vout: currentVout, outspendCount: outspends.length });
      if (hops.length > 0) hops[hops.length - 1].partial_trace = true;
      bfsLog?.push({ address: currentTxid, depth: hops.length, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "vout-out-of-range" });
      break;
    }

    if (!outspend.spent) {
      console.log(`[btc-utxo] output unspent — terminal (funds at rest)`, { txid: currentTxid, vout: currentVout });
      bfsLog?.push({ address: currentTxid, depth: hops.length, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "unspent-terminal" });
      break;
    }

    if (!outspend.txid) {
      console.log(`[btc-utxo] output spent but spending txid missing`, { txid: currentTxid, vout: currentVout });
      if (hops.length > 0) hops[hops.length - 1].partial_trace = true;
      bfsLog?.push({ address: currentTxid, depth: hops.length, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "spending-txid-missing" });
      break;
    }

    console.log(`[btc-utxo] outspend found`, { txid: currentTxid, vout: currentVout, spendingTxid: outspend.txid });

    // Fetch the spending tx
    const spendingTx = await fetchMempoolTx(outspend.txid);
    if (!spendingTx) {
      if (hops.length > 0) hops[hops.length - 1].partial_trace = true;
      bfsLog?.push({ address: outspend.txid, depth: hops.length, nativeTxCount: 0, tokenTxCount: 0, outgoingCount: 0, skipReason: "spending-tx-fetch-error" });
      break;
    }

    // Collect all input-side addresses (for change detection and `from` field)
    const inputAddresses = new Set<string>(
      spendingTx.vin
        .map(v => v.prevout?.scriptpubkey_address)
        .filter((a): a is string => !!a)
    );

    // `from`: prefer previous hop's `to`, else first input address
    const fromAddress = (prevToAddress && inputAddresses.has(prevToAddress))
      ? prevToAddress
      : [...inputAddresses][0] ?? "unknown";

    // Pick largest non-change output
    const nonChangeVouts = spendingTx.vout.filter(
      o => o.scriptpubkey_address && !inputAddresses.has(o.scriptpubkey_address)
    );

    let destVout: MempoolVout | undefined;
    let destVoutIndex: number;
    let selfShuffle = false;

    if (nonChangeVouts.length > 0) {
      destVout = nonChangeVouts.reduce((best, o) => o.value > best.value ? o : best);
      destVoutIndex = spendingTx.vout.indexOf(destVout);
    } else {
      // All outputs go back to input addresses (mixer-like self-shuffle)
      selfShuffle = true;
      console.log(`[btc-utxo] self-shuffle suspected — all outputs to input addresses`, { spendingTxid: outspend.txid });
      destVout = spendingTx.vout.reduce((best, o) => o.value > best.value ? o : best, spendingTx.vout[0]);
      destVoutIndex = spendingTx.vout.indexOf(destVout);
    }

    if (!destVout || !destVout.scriptpubkey_address) {
      console.log(`[btc-utxo] no viable output in spending tx`, { spendingTxid: outspend.txid });
      bfsLog?.push({ address: outspend.txid, depth: hops.length, nativeTxCount: spendingTx.vout.length, tokenTxCount: 0, outgoingCount: 0, skipReason: "no-viable-output" });
      break;
    }

    const dest = destVout.scriptpubkey_address;
    const cexMatch = btcExchanges[dest] ?? null;
    const timestamp = spendingTx.status.block_time ?? 0;
    const prevHop = hops[hops.length - 1];
    const gapFromPrevSeconds = prevHop ? timestamp - prevHop.timestamp : undefined;

    const hop: Hop = {
      hop: hops.length + 1,
      from: fromAddress,
      to: dest,
      value: (destVout.value / 1e8).toFixed(8),
      valueRaw: String(destVout.value),
      token: "BTC",
      txHash: outspend.txid,
      blockNumber: spendingTx.status.block_height ?? 0,
      timestamp,
      explorerUrl: `https://mempool.space/tx/${outspend.txid}`,
      label: cexMatch?.label ?? (selfShuffle ? "Self-shuffle / possible mixer" : undefined),
      gapFromPrevSeconds,
    };
    hops.push(hop);

    bfsLog?.push({
      address: fromAddress,
      depth: hops.length - 1,
      nativeTxCount: spendingTx.vout.length,
      tokenTxCount: 0,
      outgoingCount: nonChangeVouts.length,
      chosenHash: outspend.txid,
      chosenTo: dest,
      chosenToken: "BTC",
      chosenValue: hop.value,
      skipReason: selfShuffle ? "self-shuffle" : undefined,
    });

    console.log(`[btc-utxo] hop-pick`, { hop: hop.hop, from: fromAddress, to: dest, value: hop.value, txid: outspend.txid, selfShuffle });

    if (cexMatch) {
      if (beyondCexRemaining === null) beyondCexRemaining = 5;
    } else if (beyondCexRemaining !== null) {
      hops[hops.length - 1].beyondCex = true;
      beyondCexRemaining -= 1;
      if (beyondCexRemaining <= 0) {
        console.log(`[btc-utxo] beyondCex limit reached`);
        break;
      }
    }

    prevToAddress = dest;
    currentTxid = outspend.txid;
    currentVout = destVoutIndex;
  }

  if (hops.length >= maxHops) {
    console.log(`[btc-utxo] max-hops reached`, { maxHops });
    if (hops.length > 0) hops[hops.length - 1].partial_trace = true;
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


export async function traceAddressWithUtxo(
  input: { address: string; chain: Chain; startTxid?: string; startVout?: number; maxHops?: number },
  bfsLog?: BfsLogEntry[]
): Promise<Hop[]> {
  const { address, chain, startTxid, startVout, maxHops = 10 } = input;
  const utxoMode = chain === "btc" && !!startTxid && typeof startVout === "number";
  const cacheKey = utxoMode ? `${address}|${startTxid}:${startVout}` : address;

  if (!bfsLog) {
    const cached = await getTraceCache(cacheKey, chain);
    console.log("[cache] supabase-check", { cacheKey, chain, hit: !!cached, hopCount: cached?.hops?.length ?? 0 });
    if (cached) return cached.hops;
    console.log("[cache] miss-running-trace", { cacheKey, chain, maxHops, utxoMode });
  }

  let hops: Hop[];
  if (utxoMode) {
    hops = await traceBitcoinUtxo(startTxid!, startVout!, maxHops, bfsLog);
  } else {
    hops = await traceAddress(address, chain, maxHops, bfsLog);
    // traceAddress handles its own caching, so return early to avoid double-cache
    return hops;
  }

  const annotated = await annotateHopsWithScam(hops, chain);
  if (!bfsLog) await setTraceCache(cacheKey, chain, annotated, bfsLog);
  return annotated;
}

async function annotateHopsWithScam(hops: Hop[], chain: Chain): Promise<Hop[]> {
  if (hops.length === 0) return hops;
  const addresses = hops.flatMap(h => [h.from, h.to]);
  const matchMap = await lookupScamAddressBatch(addresses, chain);
  if (matchMap.size === 0) return hops;
  return hops.map(h => {
    const fromMatches = matchMap.get(normalizeScamAddress(h.from, chain)) ?? [];
    const toMatches = matchMap.get(normalizeScamAddress(h.to, chain)) ?? [];
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

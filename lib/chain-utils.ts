// Shared chain utilities, constants, and validation functions
import type { Chain } from "./tracer";

// Supported chains
export const SUPPORTED_CHAINS: Chain[] = ["eth", "bsc", "polygon", "arbitrum", "base", "solana", "tron", "btc"];

// Chain display names (for UI)
export const CHAIN_DISPLAY_NAMES: Record<Chain, string> = {
  eth:      "Ethereum (ETH)",
  bsc:      "BNB Smart Chain (BSC)",
  polygon:  "Polygon (MATIC)",
  arbitrum: "Arbitrum (ARB)",
  base:     "Base (ETH)",
  solana:   "Solana (SOL)",
  tron:     "Tron (TRX)",
  btc:      "Bitcoin (BTC)",
};

// Address input placeholders
export const ADDRESS_PLACEHOLDERS: Record<Chain, string> = {
  eth:      "0x...",
  bsc:      "0x...",
  polygon:  "0x...",
  arbitrum: "0x...",
  base:     "0x...",
  solana:   "Wallet address...",
  tron:     "T...",
  btc:      "1... or 3... or bc1...",
};

// Address validation patterns
export const ADDRESS_PATTERNS: Record<Chain, RegExp> = {
  eth:      /^0x[a-fA-F0-9]{40}$/,
  bsc:      /^0x[a-fA-F0-9]{40}$/,
  polygon:  /^0x[a-fA-F0-9]{40}$/,
  arbitrum: /^0x[a-fA-F0-9]{40}$/,
  base:     /^0x[a-fA-F0-9]{40}$/,
  solana:   /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  tron:     /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  btc:      /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/,
};

// Address validation error messages
export const ADDRESS_HINTS: Record<Chain, string> = {
  eth:      "Invalid Ethereum address. Expected a 42-character hex string starting with 0x.",
  bsc:      "Invalid BSC address. Expected a 42-character hex string starting with 0x.",
  polygon:  "Invalid Polygon address. Expected a 42-character hex string starting with 0x.",
  arbitrum: "Invalid Arbitrum address. Expected a 42-character hex string starting with 0x.",
  base:     "Invalid Base address. Expected a 42-character hex string starting with 0x.",
  solana:   "Invalid Solana address. Expected a base58 string between 32 and 44 characters.",
  tron:     "Invalid Tron address. Expected a 34-character string starting with T.",
  btc:      "Invalid Bitcoin address. Expected a legacy (1.../3...) or bech32 (bc1...) address.",
};

// EVM chain configuration (for Etherscan V2 multichain API)
export interface EvmChainConfig {
  chainId: string;
  nativeToken: string;
  explorerBase: string;
}

export const EVM_CHAIN_CONFIG: Record<Chain, EvmChainConfig | null> = {
  eth:      { chainId: "1",     nativeToken: "ETH",  explorerBase: "https://etherscan.io" },
  bsc:      { chainId: "56",    nativeToken: "BNB",  explorerBase: "https://bscscan.com" },
  polygon:  { chainId: "137",   nativeToken: "MATIC", explorerBase: "https://polygonscan.com" },
  arbitrum: { chainId: "42161", nativeToken: "ETH",  explorerBase: "https://arbiscan.io" },
  base:     { chainId: "8453",  nativeToken: "ETH",  explorerBase: "https://basescan.org" },
  solana:   null,
  tron:     null,
  btc:      null,
};

// Block explorer URL bases
const EXPLORER_BASES: Record<Chain, string> = {
  eth:      "https://etherscan.io",
  bsc:      "https://bscscan.com",
  polygon:  "https://polygonscan.com",
  arbitrum: "https://arbiscan.io",
  base:     "https://basescan.org",
  solana:   "https://solscan.io",
  tron:     "https://tronscan.org/#",
  btc:      "https://mempool.space",
};

// Explorer URL paths
const EXPLORER_ADDRESS_PATHS: Record<Chain, string> = {
  eth:      "/address",
  bsc:      "/address",
  polygon:  "/address",
  arbitrum: "/address",
  base:     "/address",
  solana:   "/account",
  tron:     "/address",
  btc:      "/address",
};

const EXPLORER_TX_PATHS: Record<Chain, string> = {
  eth:      "/tx",
  bsc:      "/tx",
  polygon:  "/tx",
  arbitrum: "/tx",
  base:     "/tx",
  solana:   "/tx",
  tron:     "/transaction",
  btc:      "/tx",
};

/**
 * Validate an address for a given chain
 */
export function validateAddress(address: string, chain: Chain): string | null {
  const trimmed = address.trim();
  if (!ADDRESS_PATTERNS[chain].test(trimmed)) {
    return ADDRESS_HINTS[chain];
  }
  return null;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(address: string, chain: Chain): string {
  const base = EXPLORER_BASES[chain];
  const path = EXPLORER_ADDRESS_PATHS[chain];
  return `${base}${path}/${address}`;
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string, chain: Chain): string {
  const base = EXPLORER_BASES[chain];
  const path = EXPLORER_TX_PATHS[chain];
  return `${base}${path}/${txHash}`;
}

/**
 * Get native token symbol for a chain
 */
export function getNativeToken(chain: Chain): string {
  if (chain === "solana") return "SOL";
  if (chain === "tron") return "TRX";
  if (chain === "btc") return "BTC";
  return EVM_CHAIN_CONFIG[chain]?.nativeToken || "ETH";
}

/**
 * Check if a chain is EVM-based
 */
export function isEvmChain(chain: Chain): boolean {
  return ["eth", "bsc", "polygon", "arbitrum", "base"].includes(chain);
}

/**
 * Get chain ID for EVM chains (for Etherscan V2 API)
 */
export function getChainId(chain: Chain): string | null {
  return EVM_CHAIN_CONFIG[chain]?.chainId || null;
}

/**
 * Shorten an address for display
 */
export function shortAddr(addr: string, start = 6, end = 6): string {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

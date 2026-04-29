import { createClient } from "@supabase/supabase-js";
import { env } from "./config";

export interface ScamMatch {
  category: string;
  source: string;
  sourceUrl?: string;
  confidenceScore: number;
  verified: boolean;
  notes?: string;
}

// Fails open (returns null) if env vars are absent.
function getScamDbClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// EVM addresses are identical across ETH / BSC / Polygon / Arbitrum.
// We store them once under 'eth' and normalize lookups accordingly.
const EVM_CHAINS = new Set(["eth", "bsc", "polygon", "arbitrum", "base"]);

function normalizeChain(chain: string): string {
  if (chain === "bsc" || chain === "polygon" || chain === "arbitrum" || chain === "base") return "eth";
  return chain;
}

function isEvmChain(chain: string): boolean {
  return EVM_CHAINS.has(chain);
}

export function normalizeScamAddress(address: string, chain: string): string {
  const c = normalizeChain(chain);
  return (c === "solana" || c === "tron" || c === "btc") ? address : address.toLowerCase();
}

/** Look up a single address in the scam database. Fails open (returns []). */
export async function lookupScamAddress(
  address: string,
  chain: string
): Promise<ScamMatch[]> {
  try {
    const db = getScamDbClient();
    if (!db) return [];
    const { data, error } = await db
      .from("scam_addresses")
      .select("category, source, source_url, confidence_score, verified, notes")
      .eq("address", normalizeScamAddress(address, chain))
      .in("chain", isEvmChain(chain) ? [normalizeChain(chain), "evm-multi"] : [normalizeChain(chain)])
      .or("verified.eq.true,confidence_score.gte.50")
      .limit(10);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((row) => ({
      category: row.category as string,
      source: row.source as string,
      sourceUrl: row.source_url as string | undefined,
      confidenceScore: row.confidence_score as number,
      verified: row.verified as boolean,
      notes: row.notes as string | undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Batch lookup for multiple addresses.
 * Returns a Map keyed by lowercase address → ScamMatch[].
 * Fails open (returns empty Map) on any error.
 */
export async function lookupScamAddressBatch(
  addresses: string[],
  chain: string
): Promise<Map<string, ScamMatch[]>> {
  const result = new Map<string, ScamMatch[]>();
  if (addresses.length === 0) return result;
  try {
    const db = getScamDbClient();
    if (!db) return result;
    const searchChain = normalizeChain(chain);
    const normAddrs = [...new Set(addresses.map((a) => normalizeScamAddress(a, chain)))];
    const { data, error } = await db
      .from("scam_addresses")
      .select("address, category, source, source_url, confidence_score, verified, notes")
      .in("address", normAddrs)
      .in("chain", isEvmChain(chain) ? [searchChain, "evm-multi"] : [searchChain])
      .or("verified.eq.true,confidence_score.gte.50");
    if (error || !data) return result;
    for (const row of data as Array<Record<string, unknown>>) {
      const key = normalizeScamAddress(row.address as string, chain);
      const match: ScamMatch = {
        category: row.category as string,
        source: row.source as string,
        sourceUrl: row.source_url as string | undefined,
        confidenceScore: row.confidence_score as number,
        verified: row.verified as boolean,
        notes: row.notes as string | undefined,
      };
      const existing = result.get(key);
      if (existing) {
        existing.push(match);
      } else {
        result.set(key, [match]);
      }
    }
  } catch {
    // fail open — scam DB unavailability should not break traces
  }
  return result;
}

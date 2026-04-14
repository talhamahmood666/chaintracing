import { createClient } from "@supabase/supabase-js";

export interface ScamMatch {
  category: string;
  source: string;
  sourceUrl?: string;
  confidenceScore: number;
  verified: boolean;
}

// Lazy client — does not import lib/config.ts so no validateEnv() side-effect.
// Fails open (returns null) if env vars are absent.
function getScamDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// EVM addresses are identical across ETH / BSC / Polygon / Arbitrum.
// We store them once under 'eth' and normalize lookups accordingly.
function normalizeChain(chain: string): string {
  if (chain === "bsc" || chain === "polygon" || chain === "arbitrum") return "eth";
  return chain;
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
      .select("category, source, source_url, confidence_score, verified")
      .eq("address", address.toLowerCase())
      .eq("chain", normalizeChain(chain))
      .limit(10);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((row) => ({
      category: row.category as string,
      source: row.source as string,
      sourceUrl: row.source_url as string | undefined,
      confidenceScore: row.confidence_score as number,
      verified: row.verified as boolean,
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
    const lowerAddrs = [...new Set(addresses.map((a) => a.toLowerCase()))];
    const { data, error } = await db
      .from("scam_addresses")
      .select("address, category, source, source_url, confidence_score, verified")
      .in("address", lowerAddrs)
      .eq("chain", searchChain);
    if (error || !data) return result;
    for (const row of data as Array<Record<string, unknown>>) {
      const key = (row.address as string).toLowerCase();
      const match: ScamMatch = {
        category: row.category as string,
        source: row.source as string,
        sourceUrl: row.source_url as string | undefined,
        confidenceScore: row.confidence_score as number,
        verified: row.verified as boolean,
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

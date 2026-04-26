// CACHE VERSIONING: bump TRACER_VERSION whenever tracer logic changes.
// Format: YYYY-MM-DD-shortdesc. This auto-invalidates all cached entries.
import { getAdminClient } from "@/lib/supabase";
import type { Hop, BfsLogEntry, Chain } from "@/lib/tracer";

const TRACER_VERSION = "2026-04-26-base-quicknode";

const CACHE_TTL_HOURS = 24;
const PARTIAL_CACHE_TTL_HOURS = 1; // shorter TTL so partial traces get retried sooner

export interface CacheHit {
  hops: Hop[];
  bfsLog: BfsLogEntry[] | null;
}

export async function getTraceCache(
  address: string,
  chain: Chain
): Promise<CacheHit | null> {
  try {
    const db = getAdminClient();
    const { data, error } = await db
      .from("trace_cache")
      .select("hops, bfs_log, tracer_version")
      .eq("address", address.toLowerCase())
      .eq("chain", chain)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (error || !data) return null;

    if ((data as { tracer_version?: string | null }).tracer_version !== TRACER_VERSION) {
      // Stale cache from a prior tracer version — fire-and-forget delete, treat as miss.
      void db
        .from("trace_cache")
        .delete()
        .eq("address", address.toLowerCase())
        .eq("chain", chain)
        .then(() => undefined, () => undefined);
      return null;
    }

    return {
      hops: data.hops as Hop[],
      bfsLog: data.bfs_log as BfsLogEntry[] | null,
    };
  } catch {
    return null; // cache miss on any DB error — degrade gracefully
  }
}

export async function setTraceCache(
  address: string,
  chain: Chain,
  hops: Hop[],
  bfsLog?: BfsLogEntry[]
): Promise<void> {
  try {
    const isPartial = hops.some(h => h.partial_trace);
    const ttlHours = isPartial ? PARTIAL_CACHE_TTL_HOURS : CACHE_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 3_600_000).toISOString();

    const db = getAdminClient();
    await db.from("trace_cache").upsert(
      {
        address: address.toLowerCase(),
        chain,
        hops,
        bfs_log: bfsLog ?? null,
        traced_at: new Date().toISOString(),
        expires_at: expiresAt,
        tracer_version: TRACER_VERSION,
      },
      { onConflict: "address,chain" }
    );
  } catch {
    // Caching is best-effort — never block the caller on a DB write failure
  }
}

export async function clearTraceCache(
  address: string,
  chain?: Chain
): Promise<boolean> {
  try {
    const db = getAdminClient();
    let q = db
      .from("trace_cache")
      .delete()
      .eq("address", address.toLowerCase());
    if (chain) q = q.eq("chain", chain);
    const { error } = await q;
    return !error;
  } catch {
    return false;
  }
}

export async function clearAllTraceCache(): Promise<boolean> {
  try {
    const db = getAdminClient();
    const { error } = await db
      .from("trace_cache")
      .delete()
      .neq("address", "__never_match__");
    return !error;
  } catch {
    return false;
  }
}

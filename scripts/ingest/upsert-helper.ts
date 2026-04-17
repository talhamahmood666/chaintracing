import { createClient } from "@supabase/supabase-js";

export interface ScamRow {
  address: string;
  chain: string;
  category: string;
  source: string;
  source_url: string;
  verified: boolean;
  confidence_score: number;
  notes?: string;
  reported_at?: string;
}

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function dedup(rows: ScamRow[]): ScamRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.address.toLowerCase()}:${r.chain}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const BATCH_SIZE = 500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertBatch(db: any, rows: ScamRow[]): Promise<number> {
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await db.rpc("upsert_scam_addresses_batch", {
      rows: batch,
    });
    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    } else {
      total += data ?? batch.length;
    }
  }
  return total;
}

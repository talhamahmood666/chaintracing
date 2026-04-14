import { createClient } from "@supabase/supabase-js";
import { env } from "./config";

// env.ts validateEnv() guarantees these are set at startup
const url = env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

// Browser/server client (anon key)
export const supabase = createClient(url, anonKey);

// Server-only admin client (service role key — never expose to browser)
export function getAdminClient() {
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, serviceKey!, {
    auth: { persistSession: false },
  });
}

export interface ReportRow {
  id: string;
  created_at: string;
  address: string;
  chain: string;
  email: string | null;
  status: "pending" | "paid";
  plisio_txn_id: string | null;
  tier: "quick" | "deep";
  hops: unknown;
  risk_score: number;
  risk_level: string;
  risk_flags: unknown;
  risk_summary: string;
  deep_analysis?: unknown;
}
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const revalidate = 300; // 5-min cache

export async function GET() {
  const db = getAdminClient();
  const [{ count: scans }, { count: flagged }] = await Promise.all([
    db.from("reports").select("*", { count: "exact", head: true }),
    db.from("scam_addresses").select("*", { count: "exact", head: true }),
  ]);
  return NextResponse.json({ scans: scans ?? 0, flagged: flagged ?? 0, chains: 8 });
}

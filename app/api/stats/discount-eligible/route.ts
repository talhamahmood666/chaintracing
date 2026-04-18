import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-helpers";
import { getAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { user } = await getUser(request);
  if (!user) return NextResponse.json({ eligible: false });

  const db = getAdminClient();
  const { count } = await db
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "paid");

  return NextResponse.json({ eligible: (count ?? 0) === 0 });
}

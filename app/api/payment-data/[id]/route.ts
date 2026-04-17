import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) return Response.json({ error: "Missing token" }, { status: 400 });

  const db = getAdminClient();
  const { data: report } = await db
    .from("reports")
    .select("view_token, payment_data, tier")
    .eq("id", id)
    .single();

  if (!report || report.view_token !== token) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const orderLabel = report.tier === "deep" ? "ChainTracing Deep Trace" : "ChainTracing Quick Scan";
  return Response.json({ paymentData: report.payment_data, orderLabel });
}

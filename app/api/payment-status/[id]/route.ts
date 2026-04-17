import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { rateLimit, rateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limitRes = await rateLimit(request, rateLimits.paymentStatusLimit);
  if (limitRes) return limitRes;

  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const db = getAdminClient();
  const { data: report } = await db
    .from("reports")
    .select("status, view_token")
    .eq("id", id)
    .single();

  if (!report || report.view_token !== token) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ status: report.status });
}

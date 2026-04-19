import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin();

  const body = await request.formData();
  const id = body.get("id") as string;
  const action = body.get("action") as string;

  if (!id || !["verify", "reject", "info_requested"].includes(action)) {
    return Response.redirect(new URL("/admin/community-reports", request.url), 303);
  }

  const db = getAdminClient();

  if (action === "verify") {
    // Fetch the report
    const { data: report } = await db
      .from("user_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (report) {
      // Upsert into scam_addresses
      const { data: scamRow } = await db
        .from("scam_addresses")
        .upsert({
          address: report.address,
          chain: report.chain,
          category: report.category,
          source: "user_report",
          verified: true,
          confidence_score: 60,
          notes: report.description.slice(0, 200),
        }, { onConflict: "address,chain" })
        .select("id")
        .single();

      await db
        .from("user_reports")
        .update({
          status: "verified",
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
          promoted_to_scam_id: scamRow?.id ?? null,
        })
        .eq("id", id);

      logger.info("Community report verified", { id, address: report.address });
    }
  } else {
    await db
      .from("user_reports")
      .update({
        status: action,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  return Response.redirect(new URL("/admin/community-reports", request.url), 303);
}

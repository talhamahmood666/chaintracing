import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await requireAdmin();
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const action = formData.get("action") as string;

  if (!id || !action) return Response.redirect(new URL("/admin/submissions", request.url), 303);

  const db = getAdminClient();
  if (action === "verify") {
    await db.from("scam_addresses").update({ verified: true, confidence_score: 90 }).eq("id", id);
  } else if (action === "reject") {
    await db.from("scam_addresses").delete().eq("id", id);
  }

  return Response.redirect(new URL("/admin/submissions", request.url), 303);
}

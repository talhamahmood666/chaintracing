import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Verify admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const db = getAdminClient();
  const { data: adminRow } = await db.from("admins").select("user_id").eq("user_id", user.id).single();
  if (!adminRow) return new Response("Forbidden", { status: 403 });

  const form = await request.formData();
  const reportId = form.get("reportId");
  const action = form.get("action");

  if (!reportId || typeof reportId !== "string") return new Response("Missing reportId", { status: 400 });
  if (action !== "refund" && action !== "mark_paid") return new Response("Invalid action", { status: 400 });

  const newStatus = action === "refund" ? "refunded" : "paid";

  const { error } = await db
    .from("reports")
    .update({ status: newStatus })
    .eq("id", reportId);

  if (error) return new Response("DB error: " + error.message, { status: 500 });

  await db.from("admin_actions").insert({
    admin_user_id: user.id,
    action_type: action,
    target_type: "report",
    target_id: reportId,
    notes: `Manual ${action} by admin`,
  });

  redirect("/admin/reports");
}

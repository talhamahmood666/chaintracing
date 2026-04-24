import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { isAdminUser } from "@/lib/auth-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await isAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let id: string, resolved: boolean;
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    id = body.id;
    resolved = body.resolved === true || body.resolved === "true";
  } else {
    const form = await request.formData().catch(() => null);
    id = form?.get("id") as string;
    resolved = (form?.get("resolved") as string) === "true";
  }

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getAdminClient();
  const { error } = await db
    .from("contact_submissions")
    .update({ resolved })
    .eq("id", id);

  if (error) {
    logger.error("Failed to update contact submission", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Redirect back to admin contact page after form POST
  return NextResponse.redirect(new URL("/admin/contact", request.url));
}

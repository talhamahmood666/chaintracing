import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth-helpers";
import { getAdminClient } from "@/lib/supabase";
import { checkOrigin } from "@/lib/origin-check";
import { rateLimit, rateLimits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  const limitRes = await rateLimit(request, rateLimits.shareLimit || { limit: 5, window: 60 });
  if (limitRes) return limitRes;

  let body: {
    reportId?: string;
    txnHash?: string;
    hopAddress?: string;
    sharedText?: string;
    platform?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reportId, txnHash, hopAddress, sharedText, platform } = body;

  if (!reportId || typeof reportId !== "string") {
    return Response.json({ error: "reportId is required" }, { status: 400 });
  }
  if (!sharedText) {
    return Response.json({ error: "sharedText is required" }, { status: 400 });
  }

  const db = getAdminClient();

  const { data: report, error: reportError } = await db
    .from("reports")
    .select("id")
    .eq("id", reportId)
    .single();

  if (reportError || !report) {
    return Response.json({ error: "Invalid reportId" }, { status: 400 });
  }

  const { user } = await getUser(request);

  const { error } = await db.from("shares").insert({
    report_id: reportId,
    platform: platform ?? null,
    txn_hash: txnHash ?? null,
    hop_address: hopAddress ?? null,
    shared_text: sharedText,
  });

  if (error) {
    console.error("Share insert failed", error);
    return Response.json({ error: "Failed to record share" }, { status: 500 });
  }

  void user; // user_id not in shares schema — attached via report_id
  return Response.json({ success: true });
}

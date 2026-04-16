import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth-helpers";
import { getAdminClient } from "@/lib/supabase";
import { checkOrigin } from "@/lib/origin-check";
import { rateLimit, rateLimits } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  // Rate limit: max 5 shares per minute per IP
  const limitRes = await rateLimit(request, rateLimits.shareLimit || { limit: 5, window: 60 });
  if (limitRes) return limitRes;

  let body: {
    txnHash?: string;
    hopAddress?: string;
    sharedText?: string;
    hopCount?: number;
    riskScore?: number;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { txnHash, hopAddress, sharedText, hopCount, riskScore } = body;

  if (!txnHash || !sharedText) {
    return Response.json({ error: "txnHash and sharedText required" }, { status: 400 });
  }

  try {
    const { user } = await getUser(request);
    const db = getAdminClient();

    // Log the share attempt
    await db.from("shares").insert({
      user_id: user?.id ?? null,
      platform: "unknown",
      txn_hash: txnHash,
      hop_address: hopAddress,
      shared_text: sharedText,
      hop_count: hopCount,
      risk_score: riskScore,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Share tracking failed", err);
    return Response.json({ success: true }); // Don't fail the share for analytics errors
  }
}
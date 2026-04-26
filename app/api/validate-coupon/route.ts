import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { rateLimit, rateLimits } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limitRes = await rateLimit(request, rateLimits.couponLimit);
  if (limitRes) return limitRes;

  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") ?? "").trim().toUpperCase();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  if (!code) {
    return Response.json({ valid: false, reason: "No code provided" }, { status: 400 });
  }

  const db = getAdminClient();
  const { data: coupon } = await db
    .from("coupons")
    .select("id, max_uses, uses, expires_at, active")
    .eq("code", code)
    .single();

  if (!coupon) return Response.json({ valid: false, reason: "Invalid coupon code" });
  if (!coupon.active) return Response.json({ valid: false, reason: "Coupon is no longer active" });
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return Response.json({ valid: false, reason: "Coupon has expired" });
  }
  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses) {
    return Response.json({ valid: false, reason: "Coupon has reached its usage limit" });
  }

  if (email) {
    const { data: existing } = await db
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .is("user_id", null)
      .ilike("email", email)
      .maybeSingle();
    if (existing) return Response.json({ valid: false, reason: "Coupon already used for this email" });
  }

  return Response.json({ valid: true });
}

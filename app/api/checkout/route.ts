import { NextRequest } from "next/server";
import { Agent, setGlobalDispatcher } from "undici";
import { getAdminClient } from "@/lib/supabase";
import {
  continueTrace,
  detectBridges,
  detectDeepMixers,
  clusterWallets,
  analyzeTimings,
  type Chain,
  type Hop,
} from "@/lib/tracer";
import { scoreAddress } from "@/lib/risk";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { validateAddress } from "@/lib/chain-utils";
import { logger } from "@/lib/logger";
import { checkOrigin } from "@/lib/origin-check";
import { getUser } from "@/lib/auth-helpers";
import { isAdminById } from "@/lib/auth-admin";
import { env } from "@/lib/config";
import { randomBytes } from "crypto";

// Force IPv4 for all outbound fetch calls in this route.
// WSL2 lacks IPv6 routing, causing undici to hang when it tries the AAAA record first.
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

export const maxDuration = 30;

const SUPPORTED_CHAINS: Chain[] = ["eth", "bsc", "polygon", "arbitrum", "solana", "tron", "btc", "base"];

function getTierPrice(tier: string, halfOff = false): string {
  const base = tier === "deep" ? env.TIER_DEEP_PRICE_USD : env.TIER_QUICK_PRICE_USD;
  if (!halfOff) return base;
  return (parseFloat(base) / 2).toFixed(2);
}

async function isFirstReportUser(userId: string): Promise<boolean> {
  // Count BOTH paid AND pending reports — prevents double-discount via concurrent tabs (C3/M2).
  // The actual atomicity guard is the partial unique index reports_one_discount_per_user;
  // this check is a fast pre-flight to avoid hitting the index on most requests.
  const db = getAdminClient();
  const { count } = await db
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["paid", "pending"]);
  return (count ?? 0) === 0;
}

// Minimal shape check for client-supplied hops — we re-score server-side anyway
function isValidHopArray(val: unknown): val is Hop[] {
  if (!Array.isArray(val)) return false;
  if (val.length === 0) return true;
  if (val.length > 25) return false; // sanity cap
  for (const h of val) {
    if (typeof h !== "object" || h === null) return false;
    if (typeof h.from !== "string" || typeof h.to !== "string") return false;
    if (typeof h.txHash !== "string" || typeof h.timestamp !== "number") return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  // Apply rate limiting (5 req / hour per IP via Upstash)
  const limitRes = await rateLimit(request, rateLimits.checkoutLimit);
  if (limitRes) return limitRes;

  // Auth — optional for checkout (user may have scanned anonymously, then logs in)
  const { user, supabase: _sessionSupabase } = await getUser(request);
  const adminUser = user ? await isAdminById(user.id) : false;

  let body: {
    address?: string;
    chain?: string;
    email?: string;
    tier?: string;
    intent?: string;
    hops?: unknown;
    riskScore?: unknown;
    riskLevel?: unknown;
    riskFlags?: unknown;
    riskSummary?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, chain, email, tier = "quick", intent } = body;

  if (!address || typeof address !== "string") {
    return Response.json({ error: "address is required" }, { status: 400 });
  }
  if (!chain || !SUPPORTED_CHAINS.includes(chain as Chain)) {
    return Response.json({ error: "Invalid chain" }, { status: 400 });
  }
  if (tier !== "quick" && tier !== "deep") {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  // H4: re-validate address format per chain (same as trace route)
  const addrValidationError = validateAddress(address.trim(), chain as Chain);
  if (addrValidationError) {
    return Response.json({ error: addrValidationError }, { status: 400 });
  }

  // Client must supply the hops from the free scan
  if (!isValidHopArray(body.hops)) {
    return Response.json(
      { error: "Trace data (hops) is required. Run a free scan first." },
      { status: 400 }
    );
  }

  // H1: cap client-supplied hops to the tier's entitlement server-side.
  // Free users are entitled to 5 hops (auth) or 2 hops (anon). Quick = 10, Deep = 20.
  // Slicing here prevents a client from submitting more hops than their tier allows.
  const TIER_MAX_HOPS: Record<string, number> = { quick: 10, deep: 20 };
  const rawHops = body.hops as Hop[];
  const clientHops = rawHops.slice(0, TIER_MAX_HOPS[tier] ?? 10);

  // Sanity check: first hop must originate from the claimed address
  if (
    clientHops.length > 0 &&
    clientHops[0].from.toLowerCase() !== address.trim().toLowerCase()
  ) {
    return Response.json(
      { error: "Hop data does not match the provided address." },
      { status: 400 }
    );
  }

  // Admin bypass: skip payment entirely, create fully-unlocked paid report
  if (adminUser) {
    try {
      const extendedHops = await continueTrace(clientHops, chain as Chain, 20);
      const risk = await scoreAddress(address.trim(), chain as Chain, extendedHops, intent);
      const bridges = detectBridges(extendedHops);
      const mixers = detectDeepMixers(extendedHops);
      const cluster = clusterWallets(extendedHops);
      const timingFlags = analyzeTimings(extendedHops);

      const viewToken = randomBytes(16).toString("hex");
      const db = getAdminClient();
      const { data: report, error: dbError } = await db
        .from("reports")
        .insert({
          address: address.trim(),
          chain,
          status: "paid",
          tier: "deep",
          hops: extendedHops,
          risk_score: risk.score,
          risk_level: risk.level,
          risk_flags: risk.flags,
          risk_summary: risk.summary,
          deep_analysis: { bridges, mixers, cluster, timingFlags },
          view_token: viewToken,
          user_id: user!.id,
        })
        .select("id")
        .single();

      if (dbError || !report) {
        logger.error("Admin bypass: failed to create report", dbError);
        return Response.json({ error: "Failed to create report" }, { status: 500 });
      }

      return Response.json({ reportId: report.id, viewToken, adminBypass: true });
    } catch (err) {
      logger.error("Admin bypass checkout failed", err);
      return Response.json({ error: "Admin checkout failed" }, { status: 500 });
    }
  }

  const baseUrl = env.baseUrl;
  const plisioKey = env.PLISIO_SECRET_KEY;
  if (!plisioKey) {
    logger.error("PLISIO_SECRET_KEY not configured");
    return Response.json({ error: "Payment not configured" }, { status: 500 });
  }

  try {
    // Check first-report discount eligibility
    const discountEligible = user ? await isFirstReportUser(user.id) : false;

    // Re-score server-side from the client-supplied hops to prevent tampering
    const risk = await scoreAddress(address.trim(), chain as Chain, clientHops, intent);

    const viewToken = randomBytes(16).toString("hex");

    // For quick tier: use client hops as-is. For deep tier: we'll extend later.
    const db = getAdminClient();

    // C3: The partial unique index (reports_one_discount_per_user) makes the
    // discount atomic. If two concurrent requests both try to insert discount_applied=true
    // for the same user, the second will fail with a unique-constraint error.
    // We catch that and retry without the discount so the user still gets their report.
    let report: { id: string } | null = null;
    let dbError: { message?: string } | null = null;
    let appliedDiscount = discountEligible;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await db
        .from("reports")
        .insert({
          address: address.trim(),
          chain,
          email: email ?? null,
          status: tier === "deep" ? "tracing" : "pending",
          tier,
          hops: clientHops,
          risk_score: risk.score,
          risk_level: risk.level,
          risk_flags: risk.flags,
          risk_summary: risk.summary,
          view_token: viewToken,
          user_id: user?.id ?? null,
          discount_applied: attempt === 0 ? appliedDiscount : false,
        })
        .select("id")
        .single();

      if (!error) { report = data; break; }
      // If index conflict (duplicate discount for user), retry at full price
      if (error.code === "23505" && attempt === 0) {
        appliedDiscount = false;
        logger.warn("Discount index conflict — falling back to full price", { userId: user?.id });
        continue;
      }
      dbError = error;
      break;
    }

    if (dbError || !report) {
      logger.error("Failed to create report in database", dbError, {
        address: address.slice(0, 10) + "...",
        chain,
        tier,
        hopsCount: clientHops.length,
      });
      return Response.json(
        {
          error: "Failed to create report",
          details: env.isDevelopment ? dbError?.message : undefined,
        },
        { status: 500 }
      );
    }

    // For deep tier: kick off background trace extension (hops 11→20) and deep analysis.
    // This runs fire-and-forget so we can return the invoice URL immediately.
    if (tier === "deep") {
      const reportId = report.id;
      const tracedChain = chain as Chain;
      const tracedAddress = address.trim();

      // Fire-and-forget — errors are logged but don't block the response
      (async () => {
        try {
          const extendedHops = await continueTrace(clientHops, tracedChain, 20);
          const deepRisk = await scoreAddress(tracedAddress, tracedChain, extendedHops);
          const bridges = detectBridges(extendedHops);
          const mixers = detectDeepMixers(extendedHops);
          const cluster = clusterWallets(extendedHops);
          const timingFlags = analyzeTimings(extendedHops);
          const deepAnalysis = { bridges, mixers, cluster, timingFlags };

          await db
            .from("reports")
            .update({
              hops: extendedHops,
              risk_score: deepRisk.score,
              risk_level: deepRisk.level,
              risk_flags: deepRisk.flags,
              risk_summary: deepRisk.summary,
              deep_analysis: deepAnalysis,
              status: "pending", // Ready for payment
            })
            .eq("id", reportId);

          logger.info("Deep trace completed in background", {
            reportId,
            totalHops: extendedHops.length,
          });
        } catch (err) {
          logger.error("Background deep trace failed", err, { reportId });
          // Fall back to the original hops so the report isn't stuck on 'tracing'
          await db
            .from("reports")
            .update({ status: "pending" })
            .eq("id", reportId)
            .eq("status", "tracing");
        }
      })();
    }

    const price = getTierPrice(tier, appliedDiscount);
    const orderName = tier === "deep"
      ? `ChainTracing Deep Trace${appliedDiscount ? " (50% off)" : ""}`
      : `ChainTracing Quick Scan${appliedDiscount ? " (50% off)" : ""}`;

    // Create Plisio invoice
    const params = new URLSearchParams({
      api_key: plisioKey,
      order_number: report.id,
      order_name: orderName,
      source_currency: "USD",
      source_amount: price,
      currency: "USDT_TRX",
      callback_url: `${baseUrl}/api/webhook`,
      success_url: `${baseUrl}/report/${report.id}?token=${viewToken}`,
      fail_url: `${baseUrl}/?error=payment`,
    });

    const plisioRes = await fetch(
      `https://api.plisio.net/api/v1/invoices/new?${params}`,
      { cache: "no-store" }
    );

    if (!plisioRes.ok) {
      const respBody = await plisioRes.text();
      logger.error("Plisio HTTP error", { status: plisioRes.status, body: respBody }, {
        reportId: report.id,
        tier,
        price,
      });
      return Response.json({ error: "Payment provider error" }, { status: 502 });
    }

    const plisioData = await plisioRes.json();

    if (plisioData.status !== "success" || !plisioData.data?.txn_id) {
      logger.error("Plisio API error", plisioData, { reportId: report.id, tier, price });
      return Response.json({ error: "Could not create invoice" }, { status: 502 });
    }

    const pd = plisioData.data;
    const paymentData = {
      walletAddress: pd.wallet_hash as string,
      amount: pd.amount as string,
      currency: pd.currency as string,
      qrCode: pd.qr_code as string,
      expiresAt: pd.expire_utc as string,
      txnId: pd.txn_id as string,
    };

    await db
      .from("reports")
      .update({ plisio_txn_id: pd.txn_id, payment_data: paymentData })
      .eq("id", report.id);

    const responseBody: Record<string, unknown> = {
      reportId: report.id,
      viewToken,
      paymentData,
    };

    if (intent === "law_enforcement" && tier === "quick") {
      responseBody.upsell = `For law enforcement cases, the Deep Trace tier ($${env.TIER_DEEP_PRICE_USD}) extends the hop chain to 20 transactions, includes wallet clustering and timing analysis, and produces a more comprehensive PDF — which may be useful for formal evidence submissions.`;
    }

    return Response.json(responseBody);
  } catch (err) {
    logger.error("Checkout failed", err, { address: address?.slice(0, 10) + "...", chain, tier });
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}

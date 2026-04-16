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
import { logger } from "@/lib/logger";
import { checkOrigin } from "@/lib/origin-check";
import { getUser } from "@/lib/auth-helpers";
import { env } from "@/lib/config";
import { randomBytes } from "crypto";

// Force IPv4 for all outbound fetch calls in this route.
// WSL2 lacks IPv6 routing, causing undici to hang when it tries the AAAA record first.
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

const SUPPORTED_CHAINS: Chain[] = ["eth", "bsc", "polygon", "arbitrum", "solana", "tron"];

const TIER_PRICES: Record<string, string> = {
  quick: "9.99",
  deep: "29.99",
};

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

  let body: {
    address?: string;
    chain?: string;
    email?: string;
    tier?: string;
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

  const { address, chain, email, tier = "quick" } = body;

  if (!address || typeof address !== "string") {
    return Response.json({ error: "address is required" }, { status: 400 });
  }
  if (!chain || !SUPPORTED_CHAINS.includes(chain as Chain)) {
    return Response.json({ error: "Invalid chain" }, { status: 400 });
  }
  if (tier !== "quick" && tier !== "deep") {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Client must supply the hops from the free scan
  if (!isValidHopArray(body.hops)) {
    return Response.json(
      { error: "Trace data (hops) is required. Run a free scan first." },
      { status: 400 }
    );
  }

  const clientHops = body.hops as Hop[];

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

  const baseUrl = env.baseUrl;
  const plisioKey = env.PLISIO_SECRET_KEY;
  if (!plisioKey) {
    logger.error("PLISIO_SECRET_KEY not configured");
    return Response.json({ error: "Payment not configured" }, { status: 500 });
  }

  try {
    // Re-score server-side from the client-supplied hops to prevent tampering
    const risk = await scoreAddress(address.trim(), chain as Chain, clientHops);

    const viewToken = randomBytes(16).toString("hex");

    // For quick tier: use client hops as-is. For deep tier: we'll extend later.
    const db = getAdminClient();
    const { data: report, error: dbError } = await db
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
      })
      .select("id")
      .single();

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

    const price = TIER_PRICES[tier] ?? "9.99";
    const orderName = tier === "deep" ? "ChainTracing Deep Trace" : "ChainTracing Quick Scan";

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

    if (plisioData.status !== "success" || !plisioData.data?.invoice_url) {
      logger.error("Plisio API error", plisioData, { reportId: report.id, tier, price });
      return Response.json({ error: "Could not create invoice" }, { status: 502 });
    }

    return Response.json({
      invoice_url: plisioData.data.invoice_url,
      reportId: report.id,
      viewToken,
    });
  } catch (err) {
    logger.error("Checkout failed", err, { address: address?.slice(0, 10) + "...", chain, tier });
    return Response.json({ error: "Checkout failed" }, { status: 500 });
  }
}

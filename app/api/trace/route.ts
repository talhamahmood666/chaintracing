import { NextRequest } from "next/server";
import { traceAddress, type Chain } from "@/lib/tracer";
import { scoreAddress } from "@/lib/risk";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import {
  SUPPORTED_CHAINS,
  ADDRESS_PATTERNS,
  ADDRESS_HINTS,
  validateAddress,
} from "@/lib/chain-utils";
import { logger } from "@/lib/logger";
import { checkOrigin } from "@/lib/origin-check";
import { getUser } from "@/lib/auth-helpers";
import { getAdminClient } from "@/lib/supabase";
import { isAdminById } from "@/lib/auth-admin";
import { randomBytes } from "crypto";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  // Apply rate limiting (10 req / 60 s per IP via Upstash)
  const limitRes = await rateLimit(request, rateLimits.traceLimit);
  if (limitRes) return limitRes;

  let body: { address?: string; chain?: string; intent?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, chain } = body;

  if (!address || typeof address !== "string") {
    return Response.json({ error: "address is required" }, { status: 400 });
  }
  if (!chain || !SUPPORTED_CHAINS.includes(chain as Chain)) {
    return Response.json(
      { error: `chain must be one of: ${SUPPORTED_CHAINS.join(", ")}` },
      { status: 400 }
    );
  }

  const typedChain = chain as Chain;

  // Use shared validation function
  const validationError = validateAddress(address.trim(), typedChain);
  if (validationError) {
    return Response.json(
      { error: validationError },
      { status: 400 }
    );
  }

  try {
    // Attempt to attach user_id from session — auth is optional for free traces
    const { user } = await getUser(request);
    const adminUser = user ? await isAdminById(user.id) : false;

    const hops = await traceAddress(address.trim(), typedChain, adminUser ? 50 : 10);
    const risk = await scoreAddress(address.trim(), typedChain, hops, body.intent);

    // Create a report record in the database for the free trace
    const db = getAdminClient();
    const viewToken = randomBytes(16).toString("hex");

    const { data: report, error: dbError } = await db
      .from("reports")
      .insert({
        address: address.trim(),
        chain,
        status: adminUser ? "paid" : "available",
        tier: adminUser ? "quick" : "free",
        hops: hops,
        risk_score: risk.score,
        risk_level: risk.level,
        risk_flags: risk.flags,
        risk_summary: risk.summary,
        view_token: viewToken,
        user_id: user?.id ?? null,  // C2: attach user so dashboard + hop-cutoff work
      })
      .select("id")
      .single();

    if (dbError || !report) {
      logger.error("Failed to create free trace report", dbError, {
        address: address.slice(0, 10) + "...",
        chain,
        hopsCount: hops.length,
      });
      // Fallback to old behavior if DB fails
      return Response.json({
        error: "Failed to save trace. Please try again.",
        fallback: {
          address,
          chain,
          riskScore: risk.score,
          riskLevel: risk.level,
          riskSummary: risk.summary,
          flags: risk.flags,
          scamDbMatchCount: risk.scamDbMatchCount,
          hopCount: hops.length,
          hops,
          firstHop: hops[0] ? { to: hops[0].to, label: hops[0].label } : null,
        }
      }, { status: 500 });
    }

    // Return risk assessment with reportId and viewToken for redirect
    // The UI shows only the first hop as a teaser — full hops are kept in state
    // so the client can forward them to /api/checkout without a re-trace.
    return Response.json({
      address,
      chain,
      riskScore: risk.score,
      riskLevel: risk.level,
      riskSummary: risk.summary,
      flags: risk.flags,
      scamDbMatchCount: risk.scamDbMatchCount,
      hopCount: hops.length,
      hops,
      firstHop: hops[0]
        ? { to: hops[0].to, label: hops[0].label }
        : null,
      userId: user?.id ?? null,
      reportId: report.id,
      viewToken: viewToken,
      isAdmin: adminUser,
    });
  } catch (err) {
    logger.error("Trace failed", err, { address: address?.slice(0, 10) + "...", chain });
    const errorMessage = err instanceof Error ? err.message : String(err);
    return Response.json(
      {
        error: "Trace failed. Check that the address and chain are correct.",
        details: env.isDevelopment ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
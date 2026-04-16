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

    const hops = await traceAddress(address.trim(), typedChain);
    const risk = await scoreAddress(address.trim(), typedChain, hops);

    // Return risk assessment for display and full hops for checkout passthrough.
    // The UI shows only the first hop as a teaser — full hops are kept in state
    // so the client can forward them to /api/checkout without a re-trace.
    // user_id is not stored for free traces — it's attached only at checkout
    // when the user confirms payment and identity.
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
    });
  } catch (err) {
    logger.error("Trace failed", err, { address: address?.slice(0, 10) + "...", chain });
    return Response.json(
      { error: "Trace failed. Check that the address and chain are correct." },
      { status: 500 }
    );
  }
}
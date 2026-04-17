import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

// ── Upstash Ratelimit setup ───────────────────────────────────────────────────
// Two sliding-window limiters:
//   traceLimit    — 10 requests per 60 s  (free scans + PDF downloads)
//   checkoutLimit —  5 requests per hour  (paid checkouts)
//
// Fail-open: if Upstash is unreachable we log the error and allow the request
// so that a Redis outage never takes down the app.

type LimiterType = "trace" | "checkout" | "share" | "paymentStatus";

// undefined = not yet initialised; null = init failed / env vars missing
let traceRatelimit: Ratelimit | null | undefined = undefined;
let checkoutRatelimit: Ratelimit | null | undefined = undefined;
let shareRatelimit: Ratelimit | null | undefined = undefined;
let paymentStatusRatelimit: Ratelimit | null | undefined = undefined;

function initLimiters(): void {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    logger.warn("UPSTASH_REDIS_REST_URL or TOKEN not set — rate limiting disabled (fail-open)");
    traceRatelimit = null;
    checkoutRatelimit = null;
    shareRatelimit = null;
    paymentStatusRatelimit = null;
    return;
  }

  const redis = new Redis({ url, token });

  traceRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:trace",
  });

  checkoutRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "3600 s"),
    prefix: "rl:checkout",
  });

  shareRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "rl:share",
  });

  paymentStatusRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "rl:payment-status",
  });
}

function getLimiter(type: LimiterType): Ratelimit | null {
  if (traceRatelimit === undefined) initLimiters();
  if (type === "checkout") return checkoutRatelimit ?? null;
  if (type === "share") return shareRatelimit ?? null;
  if (type === "paymentStatus") return paymentStatusRatelimit ?? null;
  return traceRatelimit ?? null;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return "anonymous";
}

export interface RateLimitConfig {
  limiterType: LimiterType;
  prefix: string;
}

/**
 * Apply rate limiting to an API request.
 * Returns a 429 NextResponse on limit breach, or null to allow the request.
 * Always fails open: if Upstash is unreachable the request is allowed.
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const limiter = getLimiter(config.limiterType);

  if (!limiter) {
    // Env vars missing or init failed — fail-open
    return null;
  }

  const ip = getClientIp(request);
  const key = `${config.prefix}:${ip}`;

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return new NextResponse(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again in ${retryAfter}s.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    return null;
  } catch (err) {
    // Upstash unreachable — fail-open so a Redis outage doesn't break the app
    logger.error("Upstash rate limit check failed — allowing request (fail-open)", err, { key });
    return null;
  }
}

// Pre-configured limiters
export const rateLimits = {
  // 10 requests per 60 seconds — for trace and PDF endpoints
  traceLimit: { limiterType: "trace" as LimiterType, prefix: "trace" },
  // 5 requests per hour — for checkout endpoint
  checkoutLimit: { limiterType: "checkout" as LimiterType, prefix: "checkout" },
  // 5 requests per 60 seconds — isolated share bucket, does not consume trace quota
  shareLimit: { limiterType: "share" as LimiterType, prefix: "share" },
  // 20 requests per 60 seconds — payment status polling
  paymentStatusLimit: { limiterType: "paymentStatus" as LimiterType, prefix: "payment-status" },
};

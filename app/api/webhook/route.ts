import { createHmac, timingSafeEqual } from "crypto";
import { getAdminClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// No origin check here — Plisio sends server-to-server callbacks with no
// Origin header. Authentication is handled by HMAC-SHA1 signature verification.
export async function POST(request: Request) {
  // ── Parse body ──────────────────────────────────────────────────────────────
  // Read raw text first so we aren't dependent on JSON.stringify round-tripping.
  // Plisio sends JSON when callback_url includes `?json=true`.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad request: invalid JSON", { status: 400 });
  }

  const plisioKey = env.PLISIO_SECRET_KEY;
  if (!plisioKey) {
    logger.error("PLISIO_SECRET_KEY not configured in webhook");
    return new Response("Not configured", { status: 500 });
  }

  // ── Signature verification ──────────────────────────────────────────────────
  // Plisio callback verification (https://plisio.net/documentation/appendices/verifying-callbacks):
  //   1. Extract and remove `verify_hash` from the body
  //   2. Sort remaining keys alphabetically (PHP ksort equivalent)
  //   3. JSON.stringify the sorted object
  //   4. HMAC-SHA1(sorted_json, secret_key) → hex
  //   5. Compare to verify_hash
  //
  // We re-serialize from the parsed object (matching Plisio's spec) rather than
  // using the raw body, because Plisio's own libraries sort + stringify.

  const { verify_hash, ...rest } = body;
  if (!verify_hash || typeof verify_hash !== "string") {
    return new Response("Missing verify_hash", { status: 400 });
  }

  const sorted = Object.fromEntries(
    Object.keys(rest)
      .sort()
      .map((k) => [k, rest[k]])
  );
  const payload = JSON.stringify(sorted);

  const expected = createHmac("sha1", plisioKey).update(payload).digest("hex");

  // Timing-safe comparison to prevent timing attacks on the signature
  const sigValid =
    expected.length === verify_hash.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(verify_hash));

  if (!sigValid) {
    logger.warn("Plisio verify_hash mismatch", {
      orderId: rest.order_number,
      status: rest.status,
    });
    return new Response("Invalid signature", { status: 400 });
  }

  // ── Process callback ────────────────────────────────────────────────────────
  const status = typeof rest.status === "string" ? rest.status : null;
  const orderId = typeof rest.order_number === "string" ? rest.order_number : null;
  const txnId = typeof rest.txn_id === "string" ? rest.txn_id : null;

  logger.info("Plisio webhook received", { orderId, txnId, status });

  if (status === "completed" && orderId) {
    const db = getAdminClient();
    // Only transition pending/tracing → paid. This prevents duplicate webhooks
    // from overwriting a paid report back to another state, and makes the
    // handler idempotent — Plisio may retry on network timeouts.
    // "tracing" is used by deep-tier reports where the background trace may
    // still be running when payment arrives.
    const { data, error: dbError } = await db
      .from("reports")
      .update({ status: "paid", plisio_txn_id: txnId })
      .eq("id", orderId)
      .in("status", ["pending", "tracing"])
      .select("id");

    if (dbError) {
      logger.error("Webhook DB update failed", {
        orderId,
        txnId,
        error: dbError.message,
      });
      // Return 500 so Plisio retries
      return new Response("Database error", { status: 500 });
    }

    if (!data || data.length === 0) {
      // No rows matched — figure out why
      const { data: existing } = await db
        .from("reports")
        .select("id, status")
        .eq("id", orderId)
        .single();

      if (!existing) {
        logger.warn("Webhook for unknown report", { orderId, txnId });
      } else {
        logger.info("Duplicate webhook — report already paid", {
          orderId,
          txnId,
          currentStatus: existing.status,
        });
      }
      // Return 200 in both cases — retrying won't help
      return new Response("OK", { status: 200 });
    }

    logger.info("Report marked as paid", { orderId, txnId });
  }

  return new Response("OK", { status: 200 });
}

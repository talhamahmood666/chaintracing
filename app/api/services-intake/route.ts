/*
 * SQL — run this in Supabase SQL editor before deploying:
 *
 * CREATE TABLE service_intakes (
 *   id uuid primary key default gen_random_uuid(),
 *   case_id text unique not null,
 *   tier text not null check (tier in ('bronze', 'silver', 'gold')),
 *   name text not null,
 *   email text not null,
 *   country text not null,
 *   amount_lost_usd numeric not null,
 *   date_of_loss date not null,
 *   chain text not null,
 *   scammer_address text not null,
 *   victim_txid text,
 *   narrative text not null,
 *   police_report boolean not null,
 *   goals text[] not null,
 *   status text not null default 'new' check (status in ('new', 'reviewing', 'in_progress', 'delivered', 'closed')),
 *   created_at timestamptz not null default now()
 * );
 */

import { NextRequest } from "next/server";
import { Resend } from "resend";
import { getAdminClient } from "@/lib/supabase";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function makeCaseId(): string {
  const prefix = "CT";
  const rand = randomBytes(4).toString("hex").toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${ts}-${rand}`;
}

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  const limitRes = await rateLimit(request, rateLimits.submitLimit);
  if (limitRes) return limitRes;

  let body: {
    tier?: string;
    name?: string;
    email?: string;
    country?: string;
    amountLostUsd?: number;
    dateOfLoss?: string;
    chain?: string;
    scammerAddress?: string;
    victimTxid?: string;
    narrative?: string;
    policeReport?: boolean;
    goals?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const VALID_TIERS = ["bronze", "silver", "gold"];
  const VALID_CHAINS = ["btc", "eth", "usdt", "sol", "trx", "bnb", "matic", "arb", "base", "other"];
  const VALID_GOALS = ["police", "subpoena", "civil", "understand"];

  const { tier, name, email, country, amountLostUsd, dateOfLoss, chain, scammerAddress, victimTxid, narrative, policeReport, goals } = body;

  if (!tier || !VALID_TIERS.includes(tier))
    return Response.json({ error: "tier must be bronze, silver, or gold" }, { status: 400 });
  if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 100)
    return Response.json({ error: "Name is required (2–100 chars)" }, { status: 400 });
  if (!email || typeof email !== "string" || !email.includes("@") || email.length > 200)
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  if (!country || typeof country !== "string" || country.trim().length < 2)
    return Response.json({ error: "Country is required" }, { status: 400 });
  if (!amountLostUsd || typeof amountLostUsd !== "number" || amountLostUsd <= 0)
    return Response.json({ error: "Amount lost must be a positive number" }, { status: 400 });
  if (!dateOfLoss || typeof dateOfLoss !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfLoss))
    return Response.json({ error: "dateOfLoss must be YYYY-MM-DD" }, { status: 400 });
  if (!chain || !VALID_CHAINS.includes(chain.toLowerCase()))
    return Response.json({ error: "Invalid chain" }, { status: 400 });
  if (!scammerAddress || typeof scammerAddress !== "string" || scammerAddress.trim().length < 10)
    return Response.json({ error: "Scammer address is required" }, { status: 400 });
  if (!narrative || typeof narrative !== "string" || narrative.trim().length < 20 || narrative.length > 1000)
    return Response.json({ error: "Narrative is required (20–1000 chars)" }, { status: 400 });
  if (typeof policeReport !== "boolean")
    return Response.json({ error: "policeReport must be boolean" }, { status: 400 });
  if (!Array.isArray(goals) || goals.length === 0 || !goals.every(g => VALID_GOALS.includes(g)))
    return Response.json({ error: "At least one valid goal is required" }, { status: 400 });

  const caseId = makeCaseId();
  const db = getAdminClient();

  const { error: dbError } = await db.from("service_intakes").insert({
    case_id: caseId,
    tier,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    country: country.trim(),
    amount_lost_usd: amountLostUsd,
    date_of_loss: dateOfLoss,
    chain: chain.toLowerCase(),
    scammer_address: scammerAddress.trim(),
    victim_txid: victimTxid?.trim() || null,
    narrative: narrative.trim(),
    police_report: policeReport,
    goals,
    status: "new",
  });

  if (dbError) {
    logger.error("Failed to insert service intake", dbError, { caseId, tier });
    return Response.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }

  // Email notifications — non-fatal
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  if (apiKey) {
    const resend = new Resend(apiKey);

    // Notification to operator
    const notifyText = [
      `New ${tier.toUpperCase()} investigation request`,
      `Case ID: ${caseId}`,
      ``,
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Country: ${country.trim()}`,
      `Amount lost: $${amountLostUsd.toLocaleString("en-US")} USD`,
      `Date of loss: ${dateOfLoss}`,
      `Chain: ${chain.toUpperCase()}`,
      `Scammer address: ${scammerAddress.trim()}`,
      victimTxid ? `Victim txid: ${victimTxid.trim()}` : "",
      `Police report filed: ${policeReport ? "Yes" : "No"}`,
      `Goals: ${goals.join(", ")}`,
      ``,
      `Narrative:`,
      narrative.trim(),
    ].filter(l => l !== undefined && !(l === "" && false)).join("\n");

    const confirmText = [
      `Hi ${name.trim()},`,
      ``,
      `Your ChainTracing investigation request has been received.`,
      ``,
      `Case ID: ${caseId}`,
      `Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      ``,
      `We will review your case within 24 hours and email you with next steps.`,
      `Please save your case ID — you will need it for all correspondence.`,
      ``,
      `Important: you will not be charged until your forensic report is delivered.`,
      ``,
      `— ChainTracing`,
      `chaintracing.org`,
    ].join("\n");

    await Promise.allSettled([
      resend.emails.send({
        from,
        to: "talhamahmood666@gmail.com",
        subject: `[ChainTracing] New ${tier.toUpperCase()} intake: ${caseId} — ${name.trim()}`,
        text: notifyText,
      }).catch(e => logger.warn("Resend operator email failed", e)),
      resend.emails.send({
        from,
        to: email.trim(),
        subject: `Your ChainTracing investigation request — Case ${caseId}`,
        text: confirmText,
      }).catch(e => logger.warn("Resend victim confirmation email failed", e)),
    ]);
  }

  return Response.json({ caseId }, { status: 201 });
}

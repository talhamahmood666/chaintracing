import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { getUser } from "@/lib/auth-helpers";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ETH_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRX_RE = /^T[a-zA-Z0-9]{33}$/;
const BTC_RE = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;

const SUPPORTED_CHAINS = ["eth", "bsc", "polygon", "arbitrum", "solana", "tron", "btc", "base"];
const VALID_CATEGORIES = ["rugpull", "phishing", "fake_exchange", "drainer", "impersonation", "exploit", "other"];

function validateAddress(address: string, chain: string): boolean {
  switch (chain) {
    case "eth": case "bsc": case "polygon": case "arbitrum": case "base":
      return ETH_RE.test(address);
    case "solana": return SOL_RE.test(address);
    case "tron":   return TRX_RE.test(address);
    case "btc":    return BTC_RE.test(address);
    default:       return false;
  }
}

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  const limitRes = await rateLimit(request, rateLimits.submitLimit);
  if (limitRes) return limitRes;

  const { user } = await getUser(request);

  let body: {
    address?: string;
    chain?: string;
    category?: string;
    description?: string;
    amount_lost_usd?: number;
    tx_hash?: string;
    evidence_urls?: unknown;
    anon_email?: string;
  };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, chain, category, description, amount_lost_usd, tx_hash, anon_email } = body;

  if (!address || typeof address !== "string")
    return Response.json({ error: "address is required" }, { status: 400 });
  if (!chain || !SUPPORTED_CHAINS.includes(chain))
    return Response.json({ error: "Invalid chain" }, { status: 400 });
  if (!validateAddress(address.trim(), chain))
    return Response.json({ error: "Invalid address format for chain" }, { status: 400 });
  if (!category || !VALID_CATEGORIES.includes(category))
    return Response.json({ error: "Invalid category" }, { status: 400 });
  if (!description || typeof description !== "string" || description.trim().length < 50)
    return Response.json({ error: "Description must be at least 50 characters" }, { status: 400 });

  const evidenceUrls = Array.isArray(body.evidence_urls)
    ? (body.evidence_urls as unknown[]).filter(u => typeof u === "string" && u.trim()).slice(0, 3)
    : [];

  // Check for duplicate submission from this user
  if (user) {
    const db = getAdminClient();
    const { count } = await db
      .from("user_reports")
      .select("*", { count: "exact", head: true })
      .eq("address", address.trim().toLowerCase())
      .eq("chain", chain)
      .eq("submitted_by", user.id);
    if ((count ?? 0) > 0) {
      return Response.json({ error: "You have already reported this address" }, { status: 409 });
    }
  }

  const db = getAdminClient();
  const { error } = await db.from("user_reports").insert({
    address: address.trim().toLowerCase(),
    chain,
    category,
    description: description.trim(),
    amount_lost_usd: amount_lost_usd ?? null,
    tx_hash: tx_hash?.trim() || null,
    evidence_urls: evidenceUrls,
    submitted_by: user?.id ?? null,
    anon_email: anon_email?.trim() || null,
    status: "pending",
  });

  if (error) {
    logger.error("report-scammer insert error", error);
    return Response.json({ error: "Failed to submit report" }, { status: 500 });
  }

  return Response.json({ accepted: true });
}

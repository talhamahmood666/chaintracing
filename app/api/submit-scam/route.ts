import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { requireUser } from "@/lib/auth-helpers";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const ETH_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRX_RE = /^T[a-zA-Z0-9]{33}$/;
const BTC_RE = /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

const SUPPORTED_CHAINS = ["eth", "bsc", "polygon", "arbitrum", "solana", "tron", "btc"];

function validateAddress(address: string, chain: string): boolean {
  switch (chain) {
    case "eth": case "bsc": case "polygon": case "arbitrum":
      return ETH_RE.test(address);
    case "solana": return SOL_RE.test(address);
    case "tron":   return TRX_RE.test(address);
    case "btc":    return BTC_RE.test(address);
    default:       return false;
  }
}

function normalizeChain(chain: string): string {
  if (chain === "bsc" || chain === "polygon" || chain === "arbitrum") return "eth";
  return chain;
}

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  const auth = await requireUser(request);
  if (!auth) return Response.json({ error: "Authentication required" }, { status: 401 });
  const { user } = auth;

  // Rate limit keyed by user_id (5/day)
  const limitRes = await rateLimit(
    { ...request, headers: new Headers({ ...Object.fromEntries(request.headers), "x-forwarded-for": user.id }) } as NextRequest,
    rateLimits.submitLimit
  );
  if (limitRes) return limitRes;

  let body: { address?: string; chain?: string; description?: string; txHash?: string };
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { address, chain, description, txHash } = body;
  if (!address || typeof address !== "string") return Response.json({ error: "address is required" }, { status: 400 });
  if (!chain || !SUPPORTED_CHAINS.includes(chain)) return Response.json({ error: "Invalid chain" }, { status: 400 });
  if (!validateAddress(address.trim(), chain)) return Response.json({ error: "Invalid address format for chain" }, { status: 400 });
  if (!description || description.trim().length < 20) return Response.json({ error: "description must be at least 20 characters" }, { status: 400 });

  const normalizedAddr = address.trim().toLowerCase();
  const normalizedChain = normalizeChain(chain);
  let confidence = 20;

  // Boost if tx hash provided and valid format
  const hasTxEvidence = !!txHash && TX_HASH_RE.test(txHash.trim());
  if (hasTxEvidence) confidence += 10;

  const db = getAdminClient();

  // Check for existing entry to bump duplicate_count
  const { data: existing } = await db
    .from("scam_addresses")
    .select("id, confidence_score, duplicate_count")
    .eq("address", normalizedAddr)
    .eq("chain", normalizedChain)
    .limit(1)
    .single();

  if (existing) {
    const newConfidence = Math.min(90, (existing.confidence_score as number) + 10);
    await db
      .from("scam_addresses")
      .update({
        duplicate_count: ((existing.duplicate_count as number) ?? 1) + 1,
        confidence_score: newConfidence,
      })
      .eq("id", existing.id);

    return Response.json({ accepted: true, confidence: newConfidence, duplicate: true });
  }

  const { error } = await db.from("scam_addresses").insert({
    address: normalizedAddr,
    chain: normalizedChain,
    category: "scam",
    source: "community",
    source_url: null,
    verified: false,
    confidence_score: confidence,
    submitted_by: user.id,
    submission_notes: description.trim(),
    tx_evidence: hasTxEvidence ? txHash!.trim() : null,
    duplicate_count: 1,
  });

  if (error) {
    logger.error("submit-scam insert error", error);
    return Response.json({ error: "Failed to submit" }, { status: 500 });
  }

  return Response.json({ accepted: true, confidence });
}

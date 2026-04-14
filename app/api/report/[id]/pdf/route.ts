import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { generatePdfBuffer, type ScamDbMatchEntry } from "@/lib/pdf";
import {
  clusterWallets,
  analyzeTimings,
  type Hop,
  type Chain,
} from "@/lib/tracer";
import type { RiskFlag } from "@/lib/risk";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import "@/lib/config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const originBlock = checkOrigin(_request);
  if (originBlock) return originBlock;

  // Apply rate limiting (10 req / 60 s per IP via Upstash)
  const limitRes = await rateLimit(_request, rateLimits.traceLimit);
  if (limitRes) return limitRes;

  const token = _request.nextUrl.searchParams.get("token");
  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminClient();

  const { data: report, error } = await db
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("view_token", token)
    .single();

  if (error || !report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }
  if (report.status !== "paid") {
    return Response.json({ error: "Payment required" }, { status: 402 });
  }

  const hops = report.hops as Hop[];
  const tier: "quick" | "deep" = (report.tier as "quick" | "deep") ?? "quick";

  const cluster = tier === "deep" ? clusterWallets(hops) : undefined;
  const timingFlags = tier === "deep" ? analyzeTimings(hops) : undefined;

  // Collect scam matches from annotated hops (available for reports traced after scam DB was added)
  const scamDbMatches: ScamDbMatchEntry[] = [];
  for (const hop of hops) {
    const hopWithScam = hop as Hop & { scamMatches?: Array<{ category: string; source: string; confidenceScore: number }> };
    if (hopWithScam.scamMatches && hopWithScam.scamMatches.length > 0) {
      for (const match of hopWithScam.scamMatches) {
        scamDbMatches.push({
          address: hop.to,
          category: match.category,
          source: match.source,
          confidenceScore: match.confidenceScore,
        });
      }
    }
  }

  const buf = await generatePdfBuffer({
    reportId: report.id,
    address: report.address,
    chain: report.chain as Chain,
    hops,
    riskScore: report.risk_score,
    riskLevel: report.risk_level ?? "unknown",
    riskSummary: report.risk_summary,
    riskFlags: report.risk_flags as RiskFlag[],
    generatedAt: new Date(report.created_at).toUTCString(),
    tier,
    cluster,
    timingFlags,
    scamDbMatches: scamDbMatches.length > 0 ? scamDbMatches : undefined,
  });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="chaintracing-${id.slice(0, 8)}.pdf"`,
      "Content-Length": String(buf.length),
    },
  });
}

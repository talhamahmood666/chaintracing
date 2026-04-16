import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import { createClient } from "@/lib/auth-helpers";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { Hop } from "@/lib/tracer";
import type { RiskFlag } from "@/lib/risk";
import { ReportView } from "./report-view";

/** Max hops shown in free scan before FOMO cut-off */
export const FREE_HOP_CUTOFF = 2;
export const MAX_HOPS_FOR_DEEP_SCAN = 20; // Total number of hops we can detect in deep scan

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const db = getAdminClient();
  const { data: report, error } = await db
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("view_token", token)
    .single();

  if (error || !report) notFound();

  // Check auth so upsell can target only non-logged-in users
  const cookieStore = await cookies();
  // Build a minimal NextRequest so getUser doesn't require the full request object
  const fakeReq = new NextRequest("http://localhost", {
    headers: Object.fromEntries(
      cookieStore.getAll().map((c) => [c.name, c.value])
    ),
  });
  const { user } = await createClient().auth.getUser?.(fakeReq) ?? { user: null };

  const allHops = report.hops as Hop[];
  const isPaid = report.status === "paid";
  const isDeep = (report.tier as "quick" | "deep") === "deep";

  const exchangeDepositCount = allHops.filter((h) => h.label).length;

  return (
    <ReportView
      report={{
        id: report.id,
        address: report.address,
        chain: report.chain,
        hops: allHops,
        riskScore: report.risk_score,
        riskSummary: report.risk_summary,
        riskFlags: report.risk_flags as RiskFlag[],
        createdAt: report.created_at,
        paid: isPaid,
        tier: isDeep ? "deep" : "quick",
        viewToken: token,
        userId: user?.id ?? null,
      }}
      fomo={{
        shownHops: isPaid ? allHops.length : Math.min(allHops.length, FREE_HOP_CUTOFF),
        totalHops: allHops.length,
        exchangeDeposits: exchangeDepositCount,
        isLoggedIn: !!user,
      }}
    />
  );
}
import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import type { Hop } from "@/lib/tracer";
import type { RiskFlag } from "@/lib/risk";
import { ReportView } from "./report-view";

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

  return (
    <ReportView
      report={{
        id: report.id,
        address: report.address,
        chain: report.chain,
        hops: report.hops as Hop[],
        riskScore: report.risk_score,
        riskSummary: report.risk_summary,
        riskFlags: report.risk_flags as RiskFlag[],
        createdAt: report.created_at,
        paid: report.status === "paid",
        tier: (report.tier as "quick" | "deep") ?? "quick",
        viewToken: token,
      }}
    />
  );
}

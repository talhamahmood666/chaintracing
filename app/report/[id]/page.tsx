import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";
import { createClient as createServerClient } from "@/lib/supabase-server";
import ReportView from "./report-view";
import type { Hop } from "@/lib/tracer";
import type { RiskFlag } from "@/lib/risk";

/** Max hops shown in free scan before FOMO cut-off */
export const FREE_HOP_CUTOFF = 2;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function ReportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  if (token === "ofac-demo-token") {
    const staticReport = {
      id: "ofac-demo-report",
      address: "0xd5ED34b52AC4ab84d8FA8A231a3218bbF01Ed510",
      chain: "eth",
      risk_score: 95,
      risk_flags: [{ id: "ofac_sanctioned", label: "OFAC Sanctioned", severity: "critical" }],
      risk_summary: "This address is on the OFAC SDN sanctions list.",
      hops: [{
        hop: 1,
        from: "0xd5ED34b52AC4ab84d8FA8A231a3218bbF01Ed510",
        to: "0x0000000000000000000000000000000000000000",
        value: "0",
        valueRaw: "0",
        token: "ETH",
        txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        blockNumber: 0,
        timestamp: Math.floor(Date.now() / 1000),
        explorerUrl: "https://etherscan.io/tx/0x0000000000000000000000000000000000000000000000000000000000000000",
        label: "OFAC Sanctioned Address",
        isSanctioned: true,
      }],
      status: "available",
      created_at: new Date().toISOString(),
    };

    return (
      <ReportView
        report={staticReport}
        viewToken={token}
        isPaid={false}
        deepScanAvailable={false}
      />
    );
  }

  const db = getAdminClient();
  const { data: report, error } = await db
    .from("reports")
    .select("*")
    .eq("id", id)
    .eq("view_token", token)
    .single();

  if (error || !report) notFound();

  // Get current user (if any)
  const supabase = await createServerClient();
  const { data: { user } = { data: { user: null } } } = await supabase.auth.getUser();

  console.log("[ReportPage] DB report object:", JSON.stringify(report, null, 2));

  const allHops = report.hops as Hop[];
  const isPaid = report.status === "paid";
  const deepScanAvailable = !isPaid && allHops.length > FREE_HOP_CUTOFF;

  // For free scans, only show first N hops
  const visibleHops = isPaid ? allHops : allHops.slice(0, FREE_HOP_CUTOFF);

  // Add a flag to the report object for the view - normalize camelCase/underscore fields
  const enhancedReport = {
    ...report,
    hops: visibleHops,
    riskScore: report.risk_score ?? report.riskScore ?? 0,
    riskFlags: (report.risk_flags ?? report.riskFlags) as RiskFlag[],
    summary: report.summary ?? report.risk_summary ?? undefined,
  };

  return (
    <ReportView
      report={enhancedReport}
      viewToken={token}
      isPaid={isPaid}
      deepScanAvailable={deepScanAvailable}
    />
  );
}

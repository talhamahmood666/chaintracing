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

  const allHops = report.hops as Hop[];
  const isPaid = report.status === "paid";
  const deepScanAvailable = !isPaid && allHops.length > FREE_HOP_CUTOFF;

  // For free scans, only show first N hops
  const visibleHops = isPaid ? allHops : allHops.slice(0, FREE_HOP_CUTOFF);

  // Add a flag to the report object for the view
  const enhancedReport = {
    ...report,
    hops: visibleHops,
    riskFlags: report.risk_flags as RiskFlag[],
    summary: report.summary || undefined,
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

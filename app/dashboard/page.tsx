import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getAdminClient } from "@/lib/supabase";
import { isAdminUser } from "@/lib/auth-admin";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { tab } = await searchParams;
  const db = getAdminClient();
  const isAdmin = await isAdminUser();

  let reportsQuery = db
    .from("reports")
    .select("id, address, chain, risk_score, risk_level, tier, status, created_at, view_token, user_id")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!isAdmin) reportsQuery = reportsQuery.eq("user_id", user.id);

  const { data: reports } = await reportsQuery;

  const paidReports = (reports ?? []).filter(r => r.status === "paid");
  const quickPrice = parseFloat(env.TIER_QUICK_PRICE_USD);
  const deepPrice = parseFloat(env.TIER_DEEP_PRICE_USD);
  const totalSpent = paidReports.reduce((sum, r) => sum + (r.tier === "deep" ? deepPrice : quickPrice), 0);

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      reports={reports ?? []}
      totalSpent={totalSpent}
      activeTab={tab ?? "traces"}
      tierPrices={{ quick: quickPrice, deep: deepPrice }}
      isAdmin={isAdmin}
    />
  );
}

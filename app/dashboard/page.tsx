import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getAdminClient } from "@/lib/supabase";
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

  const { data: reports } = await db
    .from("reports")
    .select("id, address, chain, risk_score, risk_level, tier, status, created_at, view_token")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

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
    />
  );
}

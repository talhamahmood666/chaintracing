import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";
import { env } from "@/lib/config";
import { ScansLineChart } from "./ScansLineChart";

export const dynamic = "force-dynamic";

function AdminStatCard({ label, value, color = '#00D9FF' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="glass rounded-xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-black" style={{ color, fontFamily: 'var(--font-geist-mono)' }}>{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const db = getAdminClient();
  // eslint-disable-next-line react-hooks/purity -- Server Component, runs once per request
  const now = Date.now();

  const [
    { count: totalReports },
    { count: paidReports },
    { count: quickPaid },
    { count: deepPaid },
    { count: totalShares },
    { data: last7 },
  ] = await Promise.all([
    db.from("reports").select("*", { count: "exact", head: true }),
    db.from("reports").select("*", { count: "exact", head: true }).eq("status", "paid"),
    db.from("reports").select("*", { count: "exact", head: true }).eq("status", "paid").eq("tier", "quick"),
    db.from("reports").select("*", { count: "exact", head: true }).eq("status", "paid").eq("tier", "deep"),
    db.from("shares").select("*", { count: "exact", head: true }),
    db.from("reports")
      .select("created_at, status, tier")
      .gte("created_at", new Date(now - 30 * 86400_000).toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const quickPrice = parseFloat(env.TIER_QUICK_PRICE_USD);
  const deepPrice = parseFloat(env.TIER_DEEP_PRICE_USD);
  const revenue = ((quickPaid ?? 0) * quickPrice + (deepPaid ?? 0) * deepPrice).toFixed(2);

  const dayMap: Record<string, { total: number; paid: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400_000).toISOString().slice(0, 10);
    dayMap[d] = { total: 0, paid: 0 };
  }
  for (const r of last7 ?? []) {
    const d = r.created_at.slice(0, 10);
    if (dayMap[d]) { dayMap[d].total++; if (r.status === "paid") dayMap[d].paid++; }
  }
  const chartData = Object.entries(dayMap).map(([date, { total }]) => ({ date, scans: total }));

  return (
    <div>
      <h1 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <AdminStatCard label="Total Reports" value={totalReports ?? 0} />
        <AdminStatCard label="Paid Reports" value={paidReports ?? 0} color="#00E676" />
        <AdminStatCard label="Quick / Deep" value={`${quickPaid ?? 0} / ${deepPaid ?? 0}`} color="#FFA500" />
        <AdminStatCard label="Est. Revenue" value={`$${revenue}`} color="#00E676" />
        <AdminStatCard label="Total Shares" value={totalShares ?? 0} color="var(--text-secondary)" />
      </div>

      <div className="glass rounded-xl p-5 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Scans — Last 30 Days
        </h2>
        <ScansLineChart data={chartData} />
      </div>

      <div className="glass rounded-xl p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
          Last 30 Days — Scans &amp; Paid
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Date', 'Scans', 'Paid'].map(h => (
                <th key={h} className="text-left pb-2 pr-4 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(dayMap).map(([date, { total, paid }]) => (
              <tr key={date} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="py-2 pr-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{date}</td>
                <td className="py-2 pr-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>{total}</td>
                <td className="py-2 font-bold text-sm" style={{ color: paid > 0 ? '#00E676' : 'var(--text-muted)' }}>{paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

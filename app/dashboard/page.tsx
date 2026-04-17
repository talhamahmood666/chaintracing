import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Report = {
  id: string;
  address: string;
  chain: string;
  risk_score: number | null;
  risk_level: string | null;
  tier: string;
  status: string;
  created_at: string;
  view_token: string | null;
};

function RiskBadge({ level }: { level: string | null }) {
  const color = level === "high" ? '#FF4757' : level === "medium" ? '#FFA500' : '#00E676';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {level ?? 'unknown'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "paid" ? '#00D9FF' : status === "tracing" ? '#9B59B6' : status === "pending" ? '#FFA500' : 'rgba(232,244,253,0.3)';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {status}
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { next } = await searchParams;
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  const { data: reports, error } = await supabase
    .from("reports")
    .select("id, address, chain, risk_score, risk_level, tier, status, created_at, view_token")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const totalReports = reports?.length ?? 0;
  const highRisk = reports?.filter(r => r.risk_level === 'high').length ?? 0;
  const paid = reports?.filter(r => r.status === 'paid').length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Your Reports</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
        <Link href="/"
          className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628' }}>
          + New Scan
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Reports', value: totalReports, color: '#00D9FF' },
          { label: 'High Risk Found', value: highRisk, color: '#FF4757' },
          { label: 'Deep Scans', value: paid, color: '#00E676' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color, fontFamily: 'var(--font-geist-mono)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
          Failed to load reports: {error.message}
        </div>
      )}

      {!reports || reports.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No reports yet</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Start a trace to get your first forensic report</p>
          <Link href="/" className="px-6 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>
            Go to scanner →
          </Link>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Date', 'Address', 'Chain', 'Tier', 'Risk', 'Status', 'Report'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(reports as Report[]).map((r) => (
                <tr key={r.id} className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {r.address.slice(0, 6)}…{r.address.slice(-4)}
                  </td>
                  <td className="px-4 py-3 text-xs uppercase font-bold" style={{ color: 'var(--text-muted)' }}>{r.chain}</td>
                  <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{r.tier}</td>
                  <td className="px-4 py-3"><RiskBadge level={r.risk_level} /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === "paid" && r.view_token ? (
                      <a href={`/report/${r.id}?token=${r.view_token}`}
                        className="text-xs font-bold transition-colors" style={{ color: '#00D9FF' }}>
                        View →
                      </a>
                    ) : r.status === "pending" ? (
                      <span className="text-xs font-medium" style={{ color: '#FFA500' }}>Awaiting payment</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

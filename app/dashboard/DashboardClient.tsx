'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

interface Report {
  id: string;
  address: string;
  chain: string;
  risk_score: number | null;
  risk_level: string | null;
  tier: string;
  status: string;
  created_at: string;
  view_token: string | null;
}

interface Props {
  user: { id: string; email: string };
  reports: Report[];
  totalSpent: number;
  activeTab: string;
  tierPrices: { quick: number; deep: number };
}

const NAV = [
  { id: "traces",   label: "My Traces",       icon: "⬡" },
  { id: "new-scan", label: "New Scan",         icon: "+" },
  { id: "billing",  label: "Billing",          icon: "💳" },
  { id: "settings", label: "Account Settings", icon: "⚙" },
  { id: "help",     label: "Help",             icon: "?" },
];

function RiskBadge({ score, level }: { score: number | null; level: string | null }) {
  const s = score ?? 0;
  const color = s >= 75 ? '#FF4757' : s >= 50 ? '#FFA500' : s >= 25 ? '#FFD700' : '#00E676';
  const lbl = level ?? (s >= 75 ? 'critical' : s >= 50 ? 'high' : s >= 25 ? 'medium' : 'low');
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {lbl}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { paid: '#00E676', pending: '#FFA500', tracing: '#9B59B6', available: '#00D9FF' };
  const color = map[status] ?? 'rgba(232,244,253,0.3)';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color = '#00D9FF' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-black" style={{ color, fontFamily: 'var(--font-geist-mono)' }}>{value}</p>
    </div>
  );
}

// ── Traces tab ─────────────────────────────────────────────────────────────
function TracesTab({ reports }: { reports: Report[] }) {
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 20;

  const filtered = reports.filter(r => {
    if (search && !r.address.toLowerCase().includes(search.toLowerCase())) return false;
    if (chainFilter && r.chain !== chainFilter) return false;
    if (riskFilter) {
      const s = r.risk_score ?? 0;
      if (riskFilter === "critical" && s < 75) return false;
      if (riskFilter === "high" && (s < 50 || s >= 75)) return false;
      if (riskFilter === "medium" && (s < 25 || s >= 50)) return false;
      if (riskFilter === "low" && s >= 25) return false;
    }
    return true;
  });

  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(filtered.length / PAGE);

  const high = reports.filter(r => (r.risk_score ?? 0) >= 50).length;
  const paid = reports.filter(r => r.status === "paid").length;

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '0.5rem', padding: '6px 10px', fontSize: '0.75rem', outline: 'none' };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Traces" value={reports.length} />
        <StatCard label="High Risk Found" value={high} color="#FF4757" />
        <StatCard label="Paid Reports" value={paid} color="#00E676" />
        <StatCard label="Deep Scans" value={reports.filter(r => r.tier === "deep").length} color="#FFA500" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input type="text" placeholder="Search address…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ ...inputStyle, minWidth: 180 }} />
        <select value={chainFilter} onChange={e => { setChainFilter(e.target.value); setPage(0); }} style={inputStyle}>
          <option value="">All chains</option>
          {["eth","bsc","polygon","arbitrum","base","solana","tron","btc"].map(c => (
            <option key={c} value={c} style={{ background: '#0D1B2A' }}>{c.toUpperCase()}</option>
          ))}
        </select>
        <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(0); }} style={inputStyle}>
          <option value="">All risk levels</option>
          {["critical","high","medium","low"].map(l => (
            <option key={l} value={l} style={{ background: '#0D1B2A' }}>{l}</option>
          ))}
        </select>
        {(search || chainFilter || riskFilter) && (
          <button onClick={() => { setSearch(""); setChainFilter(""); setRiskFilter(""); setPage(0); }}
            className="px-3 py-1 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl py-20 text-center">
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {reports.length === 0 ? "No traces yet" : "No results"}
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {reports.length === 0 ? "Start a scan to create your first trace" : "Try adjusting your filters"}
          </p>
          {reports.length === 0 && (
            <a href="/" className="px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>
              Start First Trace →
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date','Address','Chain','Risk','Tier','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {r.address.slice(0, 6)}…{r.address.slice(-4)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 rounded font-bold uppercase text-xs"
                        style={{ background: 'rgba(0,217,255,0.08)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.15)' }}>
                        {r.chain}
                      </span>
                    </td>
                    <td className="px-4 py-3"><RiskBadge score={r.risk_score} level={r.risk_level} /></td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{r.tier}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.view_token && (
                          <a href={`/report/${r.id}?token=${r.view_token}`}
                            className="text-xs font-bold transition-colors hover:underline" style={{ color: '#00D9FF' }}>
                            View →
                          </a>
                        )}
                        {r.status === "paid" && r.view_token && (
                          <a href={`/api/report/${r.id}/pdf?token=${r.view_token}`}
                            className="text-xs font-medium transition-colors hover:underline" style={{ color: 'var(--text-muted)' }}>
                            PDF
                          </a>
                        )}
                        {r.status === "pending" && (
                          <span className="text-xs" style={{ color: '#FFA500' }}>Awaiting payment</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', opacity: page === 0 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {page + 1} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Billing tab ────────────────────────────────────────────────────────────
function BillingTab({ reports, totalSpent, tierPrices }: { reports: Report[]; totalSpent: number; tierPrices: { quick: number; deep: number } }) {
  const paid = reports.filter(r => r.status === "paid").sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Total Paid Reports" value={paid.length} />
        <StatCard label="Total Spent" value={`$${totalSpent.toFixed(2)}`} color="#00E676" />
      </div>
      <div className="glass rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Date','Report ID','Tier','Amount','Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paid.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No paid reports yet</td></tr>
            ) : paid.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{r.id.slice(0, 12)}…</td>
                <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{r.tier}</td>
                <td className="px-4 py-3 text-xs font-bold" style={{ color: '#00E676' }}>
                  ${r.tier === "deep" ? tierPrices.deep.toFixed(2) : tierPrices.quick.toFixed(2)}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Settings tab ───────────────────────────────────────────────────────────
function SettingsTab({ email }: { email: string }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,217,255,0.2)', color: 'var(--text-primary)', borderRadius: '0.75rem', padding: '10px 14px', fontSize: '0.875rem', outline: 'none', width: '100%' };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) { setMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return; }
    setLoading(true);
    const { createClient } = await import("@/lib/supabase-browser");
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: newPw });
    setLoading(false);
    if (error) setMsg({ type: 'err', text: error.message });
    else { setMsg({ type: 'ok', text: 'Password updated successfully.' }); setCurrentPw(""); setNewPw(""); }
  };

  return (
    <div className="max-w-md space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Account</h3>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
          <input type="email" value={email} readOnly style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} placeholder="Min 8 characters" style={inputStyle} />
          </div>
          {msg && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{
              background: msg.type === 'ok' ? 'rgba(0,230,118,0.08)' : 'rgba(255,71,87,0.08)',
              border: `1px solid ${msg.type === 'ok' ? 'rgba(0,230,118,0.2)' : 'rgba(255,71,87,0.2)'}`,
              color: msg.type === 'ok' ? '#00E676' : '#FF4757',
            }}>{msg.text}</p>
          )}
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(255,71,87,0.15)' }}>
        <h3 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: '#FF4757' }}>Danger Zone</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Deleting your account unlinks your reports. This cannot be undone.</p>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
            Delete Account
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={async () => {
              const { createClient } = await import("@/lib/supabase-browser");
              await createClient().auth.signOut();
              window.location.href = "/";
            }} className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(255,71,87,0.2)', border: '1px solid rgba(255,71,87,0.4)', color: '#FF4757' }}>
              Yes, delete my account
            </button>
            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Help tab ───────────────────────────────────────────────────────────────
function HelpTab() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How does tracing work?", a: "We follow outgoing transactions hop-by-hop from the source address using on-chain APIs. Each hop shows where funds moved, with risk scoring for exchanges, mixers, and sanctioned addresses." },
    { q: "What's a paid report?", a: "Free scans show the first 2 hops. A Quick Scan unlocks the full 10-hop chain with PDF export. A Deep Trace extends to 20 hops with bridge/mixer detection and timing analysis." },
    { q: "Can I get a refund?", a: "Reports are generated instantly using on-chain data. Due to the automated nature of the service, we do not offer refunds once a report is generated. Contact us if there's a technical issue." },
    { q: "Is my data kept private?", a: "Your email and report data are stored securely. Wallet addresses in reports are never shared publicly unless you use the Share button." },
    { q: "What chains do you support?", a: "Ethereum, BNB Chain, Polygon, Arbitrum, Base, Solana, Tron, and Bitcoin." },
  ];
  return (
    <div className="max-w-2xl">
      <div className="space-y-2 mb-8">
        {faqs.map((f, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-5 py-4 flex items-center justify-between"
              style={{ color: 'var(--text-primary)' }} data-no-glow>
              <span className="text-sm font-semibold">{f.q}</span>
              <span style={{ color: 'var(--text-muted)', transform: open === i ? 'rotate(180deg)' : 'none', transition: '200ms' }}>▾</span>
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm" style={{ color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="pt-3">{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-5">
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Need help?</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Our support team typically responds within 24 hours.</p>
        <a href="mailto:support@chaintracing.app"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>
          support@chaintracing.app →
        </a>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardClient({ user, reports, totalSpent, activeTab, tierPrices }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState(activeTab);
  const [signingOut, setSigningOut] = useState(false);

  const navigate = (t: string) => {
    setTab(t);
    router.replace(`/dashboard?tab=${t}`, { scroll: false });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/");
  };

  const initials = user.email.slice(0, 2).toUpperCase();

  const titles: Record<string, string> = {
    traces: "My Traces", "new-scan": "New Scan", billing: "Billing",
    settings: "Account Settings", help: "Help",
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 hidden md:flex flex-col"
        style={{ background: 'rgba(10,22,40,0.8)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'rgba(0,217,255,0.15)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => n.id === "new-scan" ? router.push("/") : navigate(n.id)}
              data-no-glow
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3"
              style={{
                background: tab === n.id ? 'rgba(0,217,255,0.1)' : 'transparent',
                color: tab === n.id ? '#00D9FF' : 'var(--text-secondary)',
                border: tab === n.id ? '1px solid rgba(0,217,255,0.2)' : '1px solid transparent',
              }}>
              <span className="text-base leading-none">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleSignOut} disabled={signingOut} data-no-glow
            className="w-full px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.15)', color: '#FF4757' }}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: 'rgba(10,22,40,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        {NAV.slice(0, 4).map(n => (
          <button key={n.id} onClick={() => n.id === "new-scan" ? router.push("/") : navigate(n.id)}
            data-no-glow
            className="flex-1 py-3 text-xs font-medium flex flex-col items-center gap-0.5"
            style={{ color: tab === n.id ? '#00D9FF' : 'var(--text-muted)' }}>
            <span className="text-base">{n.icon}</span>
            <span>{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="px-6 py-6 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{titles[tab] ?? "Dashboard"}</h1>
            <button onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>
              + New Scan
            </button>
          </div>

          {tab === "traces" && <TracesTab reports={reports} />}
          {tab === "billing" && <BillingTab reports={reports} totalSpent={totalSpent} tierPrices={tierPrices} />}
          {tab === "settings" && <SettingsTab email={user.email} />}
          {tab === "help" && <HelpTab />}
        </div>
      </main>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = { page?: string; status?: string; tier?: string; chain?: string; from?: string; to?: string };

const selectStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-secondary)',
  borderRadius: '0.5rem',
  padding: '6px 12px',
  fontSize: '0.75rem',
  outline: 'none',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: '#00E676', pending: '#FFA500', tracing: '#9B59B6', refunded: '#FF4757', available: '#00D9FF', free: 'rgba(232,244,253,0.4)',
  };
  const color = map[status] ?? 'rgba(232,244,253,0.4)';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {status}
    </span>
  );
}

function AdminActionButton({ reportId, action, currentStatus }: { reportId: string; action: "refund" | "mark_paid"; currentStatus: string }) {
  if (action === "refund" && ["refunded", "pending", "available", "free"].includes(currentStatus)) return null;
  if (action === "mark_paid" && currentStatus === "paid") return null;
  const color = action === "refund" ? '#FF4757' : '#00E676';
  return (
    <form method="POST" action="/api/admin/report-action" style={{ display: "inline" }}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className="text-xs font-bold transition-colors hover:underline" style={{ color }}>
        {action === "refund" ? "Refund" : "Mark Paid"}
      </button>
    </form>
  );
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const db = getAdminClient();

  const sp = await searchParams;
  const page = Math.max(0, parseInt(sp.page ?? "0", 10));
  const offset = page * PAGE_SIZE;

  let query = db
    .from("reports")
    .select("id, created_at, address, chain, tier, status, risk_score, plisio_txn_id, view_token, email, user_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.tier) query = query.eq("tier", sp.tier);
  if (sp.chain) query = query.eq("chain", sp.chain);
  if (sp.from) query = query.gte("created_at", sp.from);
  if (sp.to) query = query.lte("created_at", sp.to + "T23:59:59Z");

  const { data: reports, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function filterUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({ ...(sp as Record<string, string>), ...extra });
    return `/admin/reports?${p}`;
  }

  return (
    <div>
      <h1 className="text-xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Reports</h1>

      <form method="GET" className="flex flex-wrap gap-2 mb-5">
        <select name="status" defaultValue={sp.status ?? ""} style={selectStyle}>
          <option value="">All statuses</option>
          {["pending", "paid", "tracing", "refunded", "available", "free"].map(s => (
            <option key={s} value={s} style={{ background: '#0D1B2A' }}>{s}</option>
          ))}
        </select>
        <select name="tier" defaultValue={sp.tier ?? ""} style={selectStyle}>
          <option value="">All tiers</option>
          {["free", "quick", "deep"].map(t => <option key={t} value={t} style={{ background: '#0D1B2A' }}>{t}</option>)}
        </select>
        <select name="chain" defaultValue={sp.chain ?? ""} style={selectStyle}>
          <option value="">All chains</option>
          {["eth", "bsc", "polygon", "arbitrum", "solana", "tron"].map(c => (
            <option key={c} value={c} style={{ background: '#0D1B2A' }}>{c}</option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={sp.from ?? ""} style={selectStyle} />
        <input type="date" name="to" defaultValue={sp.to ?? ""} style={selectStyle} />
        <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>Filter</button>
        <a href="/admin/reports" className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>Reset</a>
      </form>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {count ?? 0} results · page {page + 1} of {totalPages || 1}
      </p>

      <div className="glass rounded-xl overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {["Date", "Email / User", "Address", "Chain", "Tier", "Status", "Risk", "Txn ID", "Actions"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                </td>
                <td className="px-3 py-2 max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  {r.email ?? (r.user_id ? r.user_id.slice(0, 8) + "…" : "anon")}
                </td>
                <td className="px-3 py-2 font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {r.address.slice(0, 8)}…{r.address.slice(-4)}
                </td>
                <td className="px-3 py-2 uppercase font-bold" style={{ color: 'var(--text-muted)' }}>{r.chain}</td>
                <td className="px-3 py-2 capitalize" style={{ color: 'var(--text-secondary)' }}>{r.tier}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2 font-mono font-bold" style={{ color: r.risk_score && r.risk_score >= 50 ? '#FF4757' : 'var(--text-secondary)' }}>
                  {r.risk_score ?? '—'}
                </td>
                <td className="px-3 py-2 font-mono max-w-[100px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {r.plisio_txn_id ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-3 flex-wrap items-center">
                    <a href={`/report/${r.id}?admin=1`} target="_blank"
                      className="font-bold hover:underline" style={{ color: '#00D9FF' }}>View</a>
                    <a href={`/api/report/${r.id}/pdf?admin=1`} target="_blank"
                      className="font-bold hover:underline" style={{ color: 'var(--text-muted)' }}>PDF</a>
                    <AdminActionButton reportId={r.id} action="refund" currentStatus={r.status} />
                    <AdminActionButton reportId={r.id} action="mark_paid" currentStatus={r.status} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        {page > 0 && (
          <a href={filterUrl({ page: String(page - 1) })}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>← Prev</a>
        )}
        {page + 1 < totalPages && (
          <a href={filterUrl({ page: String(page + 1) })}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>Next →</a>
        )}
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = { page?: string; q?: string; category?: string; source?: string };

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-secondary)',
  borderRadius: '0.5rem',
  padding: '6px 12px',
  fontSize: '0.75rem',
  outline: 'none',
};

export default async function AdminScamDbPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const db = getAdminClient();

  const sp = await searchParams;
  const page = Math.max(0, parseInt(sp.page ?? "0", 10));
  const offset = page * PAGE_SIZE;

  let query = db
    .from("scam_addresses")
    .select("id, address, chain, category, source, confidence_score, verified, reported_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (sp.q) query = query.ilike("address", `%${sp.q}%`);
  if (sp.category) query = query.eq("category", sp.category);
  if (sp.source) query = query.eq("source", sp.source);

  const { data: rows, count } = await query;

  const { data: cats } = await db.from("scam_addresses").select("category").order("category");
  const { data: srcs } = await db.from("scam_addresses").select("source").order("source");
  const categories = [...new Set((cats ?? []).map(r => r.category))];
  const sources = [...new Set((srcs ?? []).map(r => r.source))];

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  function filterUrl(extra: Record<string, string>) {
    const p = new URLSearchParams({ ...(sp as Record<string, string>), ...extra });
    return `/admin/scam-db?${p}`;
  }

  return (
    <div>
      <h1 className="text-xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Scam DB</h1>

      <form method="GET" className="flex flex-wrap gap-2 mb-5">
        <input type="text" name="q" defaultValue={sp.q ?? ""} placeholder="Search address…"
          style={{ ...inputStyle, width: '14rem' }} />
        <select name="category" defaultValue={sp.category ?? ""} style={inputStyle}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c} style={{ background: '#0D1B2A' }}>{c}</option>)}
        </select>
        <select name="source" defaultValue={sp.source ?? ""} style={inputStyle}>
          <option value="">All sources</option>
          {sources.map(s => <option key={s} value={s} style={{ background: '#0D1B2A' }}>{s}</option>)}
        </select>
        <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>Search</button>
        <a href="/admin/scam-db" className="px-4 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>Reset</a>
      </form>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {count ?? 0} entries · page {page + 1} of {totalPages || 1}
      </p>

      <div className="glass rounded-xl overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {["Address", "Chain", "Category", "Source", "Confidence", "Verified", "Reported"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-3 py-2 font-mono max-w-[180px] truncate" style={{ color: 'var(--text-secondary)' }}>{r.address}</td>
                <td className="px-3 py-2 uppercase font-bold" style={{ color: 'var(--text-muted)' }}>{r.chain}</td>
                <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{r.category}</td>
                <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{r.source}</td>
                <td className="px-3 py-2 font-mono font-bold"
                  style={{ color: r.confidence_score >= 80 ? '#FF4757' : r.confidence_score >= 50 ? '#FFA500' : 'var(--text-muted)' }}>
                  {r.confidence_score}
                </td>
                <td className="px-3 py-2 font-bold" style={{ color: r.verified ? '#00E676' : 'var(--text-muted)' }}>
                  {r.verified ? '✓' : '—'}
                </td>
                <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {r.reported_at ? new Date(r.reported_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}
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

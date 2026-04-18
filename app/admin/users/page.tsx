import Link from "next/link";
import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";

type SortKey = "email" | "created_at" | "total" | "paid" | "spent" | "last_activity";
type SortDir = "asc" | "desc";

function filterUrl(params: Record<string, string | number>) {
  const sp = new URLSearchParams(params as Record<string, string>);
  return `/admin/users?${sp.toString()}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string; page?: string }>;
}) {
  await requireAdmin();
  const db = getAdminClient();
  const sp = await searchParams;

  const q = sp.q?.trim().toLowerCase() ?? "";
  const sortKey: SortKey = (sp.sort as SortKey) ?? "created_at";
  const sortDir: SortDir = sp.dir === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const PAGE_SIZE = 50;

  const [{ data: { users } }, { data: reportStats }, { count: totalUsers }] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("reports").select("user_id, tier, status, created_at").not("user_id", "is", null),
    db.from("reports").select("*", { count: "exact", head: true }),
  ]);

  const quickPrice = parseFloat(env.TIER_QUICK_PRICE_USD);
  const deepPrice = parseFloat(env.TIER_DEEP_PRICE_USD);

  type UserStats = { total: number; paid: number; quick: number; deep: number; last_activity: string | null };
  const statsByUser: Record<string, UserStats> = {};
  let totalScans = 0;
  let totalPaid = 0;
  let totalRevenue = 0;

  for (const r of reportStats ?? []) {
    if (!r.user_id) continue;
    if (!statsByUser[r.user_id]) statsByUser[r.user_id] = { total: 0, paid: 0, quick: 0, deep: 0, last_activity: null };
    const s = statsByUser[r.user_id];
    s.total++;
    totalScans++;
    if (r.status === "paid") {
      s.paid++;
      totalPaid++;
      if (r.tier === "quick") { s.quick++; totalRevenue += quickPrice; }
      if (r.tier === "deep") { s.deep++; totalRevenue += deepPrice; }
    }
    if (!s.last_activity || r.created_at > s.last_activity) s.last_activity = r.created_at;
  }

  let rows = (users ?? []).map(u => {
    const s = statsByUser[u.id] ?? { total: 0, paid: 0, quick: 0, deep: 0, last_activity: null };
    const spent = s.quick * quickPrice + s.deep * deepPrice;
    return { ...u, ...s, spent };
  });

  if (q) rows = rows.filter(u => u.email?.toLowerCase().includes(q));

  rows.sort((a, b) => {
    let av: string | number, bv: string | number;
    switch (sortKey) {
      case "email": av = a.email ?? ""; bv = b.email ?? ""; break;
      case "created_at": av = a.created_at ?? ""; bv = b.created_at ?? ""; break;
      case "total": av = a.total; bv = b.total; break;
      case "paid": av = a.paid; bv = b.paid; break;
      case "spent": av = a.spent; bv = b.spent; break;
      case "last_activity": av = a.last_activity ?? ""; bv = b.last_activity ?? ""; break;
      default: av = ""; bv = "";
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalFiltered = rows.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  rows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function sortLink(col: SortKey) {
    const newDir = sortKey === col && sortDir === "desc" ? "asc" : "desc";
    return filterUrl({ ...(q && { q }), sort: col, dir: newDir, page: 1 });
  }

  function sortArrow(col: SortKey) {
    if (sortKey !== col) return <span style={{ color: 'rgba(255,255,255,0.2)' }}>⇅</span>;
    return <span style={{ color: '#00D9FF' }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "created_at", label: "Signup Date" },
    { key: "total", label: "Total Scans" },
    { key: "paid", label: "Total Paid" },
    { key: "spent", label: "Total Spent" },
    { key: "last_activity", label: "Last Activity" },
  ];

  return (
    <div>
      <h1 className="text-xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Users</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: (users ?? []).length, color: '#00D9FF' },
          { label: "Total Scans", value: totalScans, color: 'var(--text-secondary)' },
          { label: "Total Paid", value: totalPaid, color: '#00E676' },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: '#00E676' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-2xl font-black" style={{ color, fontFamily: 'var(--font-geist-mono)' }}>{value}</p>
          </div>
        ))}
      </div>

      <form method="GET" className="mb-4 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email…"
          className="text-xs px-3 py-2 rounded-lg flex-1 max-w-xs"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <input type="hidden" name="sort" value={sortKey} />
        <input type="hidden" name="dir" value={sortDir} />
        <button type="submit" className="text-xs px-4 py-2 rounded-lg font-bold"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
          Search
        </button>
        {q && (
          <Link href={filterUrl({ sort: sortKey, dir: sortDir })}
            className="text-xs px-4 py-2 rounded-lg font-bold"
            style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
            Clear
          </Link>
        )}
      </form>

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {totalFiltered} user{totalFiltered !== 1 ? "s" : ""}{q ? ` matching "${q}"` : ""} · page {page} of {Math.max(1, totalPages)}
      </p>

      <div className="glass rounded-xl overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {cols.map(({ key, label }) => (
                <th key={key} className="text-left px-4 py-2.5 font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}>
                  <Link href={sortLink(key)} className="flex items-center gap-1 hover:text-white transition-colors">
                    {label} {sortArrow(key)}
                  </Link>
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{u.email ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{u.total}</td>
                <td className="px-4 py-2.5 font-mono" style={{ color: u.paid > 0 ? '#00E676' : 'var(--text-muted)' }}>{u.paid}</td>
                <td className="px-4 py-2.5 font-mono font-bold" style={{ color: u.spent > 0 ? '#00D9FF' : 'var(--text-muted)' }}>
                  ${u.spent.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {u.last_activity ? new Date(u.last_activity).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${u.id}/reports`}
                    className="text-xs px-2.5 py-1 rounded-lg font-bold transition-colors hover:opacity-80"
                    style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>
                    View Reports
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {page > 1 ? (
            <Link href={filterUrl({ ...(q && { q }), sort: sortKey, dir: sortDir, page: page - 1 })}
              className="px-3 py-1.5 rounded-lg font-bold transition-colors hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Prev
            </Link>
          ) : <span />}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={filterUrl({ ...(q && { q }), sort: sortKey, dir: sortDir, page: page + 1 })}
              className="px-3 py-1.5 rounded-lg font-bold transition-colors hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

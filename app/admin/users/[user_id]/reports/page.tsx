import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function filterUrl(userId: string, params: Record<string, string | number>) {
  const sp = new URLSearchParams(params as Record<string, string>);
  return `/admin/users/${userId}/reports?${sp.toString()}`;
}

export default async function UserReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ user_id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const db = getAdminClient();
  const { user_id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const { data: userRes } = await db.auth.admin.getUserById(user_id);
  if (!userRes?.user) notFound();
  const user = userRes.user;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: reports, count } = await db
    .from("reports")
    .select("id, address, chain, created_at, status, tier, risk_score, risk_level", { count: "exact" })
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const statusColor: Record<string, string> = {
    paid: '#00E676', pending: '#FFA500', tracing: '#00D9FF',
    failed: '#FF4757', available: 'var(--text-secondary)', free: 'var(--text-muted)',
  };
  const riskColor: Record<string, string> = {
    high: '#FF4757', medium: '#FFA500', low: '#00E676',
  };

  return (
    <div>
      <div className="mb-5">
        <Link href="/admin/users" className="text-xs hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
          ← All Users
        </Link>
        <h1 className="text-xl font-black mt-2" style={{ color: 'var(--text-primary)' }}>
          Reports for {user.email ?? user_id}
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {count ?? 0} scan{count !== 1 ? "s" : ""} · page {page} of {Math.max(1, totalPages)}
        </p>
      </div>

      <div className="glass rounded-xl overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {["Address", "Chain", "Date", "Status", "Tier", "Risk"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(reports ?? []).map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.address}
                </td>
                <td className="px-4 py-2.5 font-mono uppercase" style={{ color: 'var(--text-muted)' }}>{r.chain}</td>
                <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-2.5">
                  <span className="font-bold uppercase" style={{ color: statusColor[r.status] ?? 'var(--text-muted)' }}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-muted)' }}>{r.tier}</td>
                <td className="px-4 py-2.5">
                  <span className="font-bold uppercase" style={{ color: riskColor[r.risk_level] ?? 'var(--text-muted)' }}>
                    {r.risk_level} ({r.risk_score})
                  </span>
                </td>
              </tr>
            ))}
            {(reports ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>No reports found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {page > 1 && (
            <Link href={filterUrl(user_id, { page: page - 1 })}
              className="px-3 py-1.5 rounded-lg font-bold hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Prev
            </Link>
          )}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={filterUrl(user_id, { page: page + 1 })}
              className="px-3 py-1.5 rounded-lg font-bold hover:text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

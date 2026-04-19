import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

type UserReport = {
  id: string;
  address: string;
  chain: string;
  category: string;
  description: string;
  amount_lost_usd: number | null;
  tx_hash: string | null;
  evidence_urls: string[];
  submitted_by: string | null;
  anon_email: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  promoted_to_scam_id: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA500',
  verified: '#00E676',
  rejected: '#FF4757',
  info_requested: '#9B59B6',
};

const CATEGORY_LABELS: Record<string, string> = {
  rugpull: 'Rug Pull', phishing: 'Phishing', fake_exchange: 'Fake Exchange',
  drainer: 'Drainer', impersonation: 'Impersonation', exploit: 'Exploit', other: 'Other',
};

const selectStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-secondary)',
  borderRadius: '0.5rem',
  padding: '6px 12px',
  fontSize: '0.75rem',
  outline: 'none',
};

export default async function AdminCommunityReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const db = getAdminClient();
  const sp = await searchParams;
  const statusFilter = sp.status ?? "pending";

  const { data: reports } = await db
    .from("user_reports")
    .select("*")
    .eq("status", statusFilter)
    .order("created_at", { ascending: false })
    .limit(100);

  const { count: pendingCount } = await db
    .from("user_reports")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Community Reports</h1>
        {(pendingCount ?? 0) > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,165,0,0.15)', color: '#FFA500', border: '1px solid rgba(255,165,0,0.3)' }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      <form method="GET" className="flex gap-2 mb-5">
        <select name="status" defaultValue={statusFilter} style={selectStyle}>
          {["pending", "verified", "rejected", "info_requested"].map(s => (
            <option key={s} value={s} style={{ background: '#0D1B2A' }}>{s}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)', color: '#00D9FF' }}>
          Filter
        </button>
      </form>

      <div className="space-y-4">
        {(reports ?? []).length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reports with status "{statusFilter}".</p>
        )}
        {((reports ?? []) as UserReport[]).map((r) => (
          <div key={r.id} className="glass rounded-xl p-5">
            <div className="flex flex-wrap items-start gap-4 justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <code className="text-sm font-mono break-all" style={{ color: '#00D9FF' }}>{r.address}</code>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                    {r.chain}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(0,217,255,0.08)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.2)' }}>
                    {CATEGORY_LABELS[r.category] ?? r.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${STATUS_COLORS[r.status] ?? '#888'}18`, color: STATUS_COLORS[r.status] ?? '#888' }}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(r.created_at).toLocaleString()} ·{" "}
                  {r.submitted_by ? `user: ${r.submitted_by.slice(0, 8)}…` : r.anon_email ? `anon: ${r.anon_email}` : "anonymous"}
                  {r.amount_lost_usd != null ? ` · $${Number(r.amount_lost_usd).toLocaleString()} lost` : ""}
                </p>
              </div>
            </div>

            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>

            {r.tx_hash && (
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                TX: {r.tx_hash}
              </p>
            )}

            {r.evidence_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {r.evidence_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline" style={{ color: '#00D9FF' }}>
                    Evidence {i + 1} →
                  </a>
                ))}
              </div>
            )}

            {r.admin_note && (
              <p className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}>
                Note: {r.admin_note}
              </p>
            )}

            {r.status === "pending" && (
              <div className="flex flex-wrap gap-2 mt-3">
                <form method="POST" action="/api/admin/community-report-action">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value="verify" />
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                    ✓ Verify &amp; Add to DB
                  </button>
                </form>
                <form method="POST" action="/api/admin/community-report-action">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
                    ✕ Reject
                  </button>
                </form>
                <form method="POST" action="/api/admin/community-report-action">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="action" value="info_requested" />
                  <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.3)', color: '#9B59B6' }}>
                    ? Request Info
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

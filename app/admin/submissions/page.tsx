import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  await requireAdmin();
  const db = getAdminClient();

  const { data: submissions } = await db
    .from("scam_addresses")
    .select("id, address, chain, category, confidence_score, duplicate_count, verified, submission_notes, tx_evidence, submitted_by, created_at")
    .eq("source", "community")
    .order("created_at", { ascending: false })
    .limit(100);

  // Fetch submitter emails via admin auth API
  const userIds = [...new Set((submissions ?? []).map(s => s.submitted_by).filter(Boolean))];
  const emailMap: Record<string, string> = {};
  for (const uid of userIds) {
    try {
      const { data } = await db.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap[uid] = data.user.email;
    } catch {}
  }

  return (
    <div>
      <h1 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Community Submissions</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        {submissions?.length ?? 0} submissions shown. Confidence ≥50 or verified=true appears in public flags.
      </p>

      <div className="space-y-3">
        {(submissions ?? []).map((row) => (
          <div key={row.id} className="glass rounded-xl p-4">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <code className="text-xs font-mono truncate" style={{ color: '#00D9FF' }}>{row.address}</code>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                    {row.chain}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: row.verified ? 'rgba(0,230,118,0.12)' : 'rgba(255,165,0,0.12)',
                      color: row.verified ? '#00E676' : '#FFA500',
                    }}>
                    {row.verified ? "Verified" : "Unverified"}
                  </span>
                </div>
                {row.submission_notes && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{row.submission_notes}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Confidence: <strong style={{ color: 'var(--text-primary)' }}>{row.confidence_score}</strong>/100</span>
                  <span>Duplicates: <strong style={{ color: 'var(--text-primary)' }}>{row.duplicate_count}</strong></span>
                  {row.tx_evidence && <span style={{ color: '#00E676' }}>Has TX Evidence</span>}
                  {row.submitted_by && <span>By: {emailMap[row.submitted_by] ?? row.submitted_by.slice(0, 8) + "…"}</span>}
                  <span>{new Date(row.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <AdminActions id={row.id} />
            </div>
          </div>
        ))}
        {(!submissions || submissions.length === 0) && (
          <div className="glass rounded-xl p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            No community submissions yet.
          </div>
        )}
      </div>
    </div>
  );
}

function AdminActions({ id }: { id: string }) {
  return (
    <form className="flex gap-2 shrink-0">
      <VerifyButton id={id} />
      <RejectButton id={id} />
    </form>
  );
}

function VerifyButton({ id }: { id: string }) {
  return (
    <form action={`/api/admin/submission-action`} method="POST" style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value="verify" />
      <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
        Verify
      </button>
    </form>
  );
}

function RejectButton({ id }: { id: string }) {
  return (
    <form action={`/api/admin/submission-action`} method="POST" style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value="reject" />
      <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
        Reject
      </button>
    </form>
  );
}

import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Submission = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  user_id: string | null;
  created_at: string;
  resolved: boolean;
};

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string }>;
}) {
  await requireAdmin();
  const db = getAdminClient();
  const sp = await searchParams;
  const showResolved = sp.resolved === "1";

  const { data: submissions } = await db
    .from("contact_submissions")
    .select("*")
    .eq("resolved", showResolved)
    .order("created_at", { ascending: false })
    .limit(100);

  const { count: unresolvedCount } = await db
    .from("contact_submissions")
    .select("*", { count: "exact", head: true })
    .eq("resolved", false);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Contact Submissions</h1>
        {(unresolvedCount ?? 0) > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: "rgba(0,217,255,0.12)", color: "#00D9FF", border: "1px solid rgba(0,217,255,0.3)" }}>
            {unresolvedCount} unresolved
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { label: "Unresolved", value: "0" },
          { label: "Resolved", value: "1" },
        ].map(({ label, value }) => (
          <a key={value} href={`/admin/contact${value === "1" ? "?resolved=1" : ""}`}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            style={{
              background: (showResolved ? value === "1" : value === "0") ? "rgba(0,217,255,0.15)" : "rgba(255,255,255,0.05)",
              color: (showResolved ? value === "1" : value === "0") ? "#00D9FF" : "var(--text-muted)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
            {label}
          </a>
        ))}
      </div>

      {!submissions?.length ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No {showResolved ? "resolved" : "unresolved"} submissions.</p>
      ) : (
        <div className="space-y-4">
          {(submissions as Submission[]).map(s => (
            <div key={s.id} className="glass rounded-2xl p-5"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  <a href={`mailto:${s.email}`} className="text-xs" style={{ color: "#00D9FF" }}>{s.email}</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  <form action={`/api/admin/contact-resolve`} method="POST">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="resolved" value={s.resolved ? "false" : "true"} />
                    <button type="submit"
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        background: s.resolved ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.12)",
                        color: s.resolved ? "var(--text-muted)" : "#00E676",
                        border: `1px solid ${s.resolved ? "rgba(255,255,255,0.1)" : "rgba(0,230,118,0.3)"}`,
                      }}>
                      {s.resolved ? "Unresolve" : "Mark Resolved"}
                    </button>
                  </form>
                </div>
              </div>
              {s.subject && (
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                  Subject: <span style={{ color: "var(--text-secondary)" }}>{s.subject}</span>
                </p>
              )}
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{s.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

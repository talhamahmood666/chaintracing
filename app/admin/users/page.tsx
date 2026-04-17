import { requireAdmin } from "@/lib/auth-admin";
import { getAdminClient } from "@/lib/supabase";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const db = getAdminClient();

  const { data: { users }, error: usersError } = await db.auth.admin.listUsers({ perPage: 1000 });

  const { data: reportStats } = await db.from("reports").select("user_id, tier, status");

  const statsByUser: Record<string, { total: number; paid: number; quick: number; deep: number }> = {};
  for (const r of reportStats ?? []) {
    if (!r.user_id) continue;
    if (!statsByUser[r.user_id]) statsByUser[r.user_id] = { total: 0, paid: 0, quick: 0, deep: 0 };
    statsByUser[r.user_id].total++;
    if (r.status === "paid") {
      statsByUser[r.user_id].paid++;
      if (r.tier === "quick") statsByUser[r.user_id].quick++;
      if (r.tier === "deep") statsByUser[r.user_id].deep++;
    }
  }

  const quickPrice = parseFloat(env.TIER_QUICK_PRICE_USD);
  const deepPrice = parseFloat(env.TIER_DEEP_PRICE_USD);

  return (
    <div>
      <h1 className="text-xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>Users</h1>
      {usersError && (
        <p className="text-sm mb-4 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
          Error loading users: {usersError.message}
        </p>
      )}
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{users?.length ?? 0} users</p>

      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {["Email", "Signed Up", "Reports", "Paid", "Spent (USD)"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map(u => {
              const s = statsByUser[u.id] ?? { total: 0, paid: 0, quick: 0, deep: 0 };
              const spent = (s.quick * quickPrice + s.deep * deepPrice).toFixed(2);
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{u.email ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-secondary)' }}>{s.total}</td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: s.paid > 0 ? '#00E676' : 'var(--text-muted)' }}>{s.paid}</td>
                  <td className="px-4 py-2.5 font-mono font-bold" style={{ color: parseFloat(spent) > 0 ? '#00D9FF' : 'var(--text-muted)' }}>
                    ${spent}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

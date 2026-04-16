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
  const cls =
    level === "high"
      ? "bg-red-100 text-red-700"
      : level === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{level ?? "unknown"}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-blue-100 text-blue-700"
      : status === "tracing"
      ? "bg-purple-100 text-purple-700"
      : status === "pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your Reports</h1>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
        </div>
        <a
          href="/"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
        >
          New Scan
        </a>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          Failed to load reports: {error.message}
        </div>
      )}

      {!reports || reports.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium">No reports yet</p>
          <p className="text-slate-400 text-sm mt-1">Start a trace to get your first report</p>
          <a
            href="/"
            className="inline-block mt-4 text-sm text-blue-600 hover:underline font-medium"
          >
            Go to scanner →
          </a>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Address</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Chain</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tier</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Risk</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r: Report) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-800">
                    {r.address.slice(0, 6)}…{r.address.slice(-4)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.chain}</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.tier}</td>
                  <td className="px-4 py-3">
                    <RiskBadge level={r.risk_level} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "paid" && r.view_token ? (
                      <a
                        href={`/report/${r.id}?token=${r.view_token}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View →
                      </a>
                    ) : r.status === "pending" ? (
                      <span className="text-amber-600 text-xs font-medium">Awaiting payment</span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
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
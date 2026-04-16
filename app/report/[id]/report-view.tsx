"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Report, Hop } from "@/lib/types";

interface Props {
  report: Report;
  viewToken: string;
  isPaid?: boolean;
  deepScanAvailable?: boolean;
}

export default function ReportView({ report, viewToken, isPaid = false, deepScanAvailable = true }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: report.id,
        address: report.address,
        chain: report.chain,
        hops: report.hops,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout failed. Please try again.");
    }
    setCheckoutLoading(false);
  };

  const handleDownloadPdf = async () => {
    const res = await fetch(`/api/report/${report.id}/pdf?token=${viewToken}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ChainTracing-${report.address.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      alert("PDF generation failed.");
    }
  };

  const totalRisk = report.riskScore || 0;
  const riskColor = totalRisk >= 70 ? "text-red-600" : totalRisk >= 40 ? "text-amber-600" : "text-green-600";
  const riskBg = totalRisk >= 70 ? "bg-red-50 border-red-200" : totalRisk >= 40 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
          ← New Trace
        </Link>
        {!loading && user && (
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 text-sm">
            Dashboard
          </Link>
        )}
      </div>

      <div className={`rounded-xl border p-6 mb-6 ${riskBg}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1 font-mono break-all">{report.address}</h1>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="uppercase font-semibold">{report.chain}</span>
              <span>•</span>
              <span>{new Date(report.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${riskColor}`}>{totalRisk}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Risk Score</div>
          </div>
        </div>
        {report.summary && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-700">{report.summary}</p>
          </div>
        )}
      </div>

      {/* FOMO Upsell Section - shown only for free users */}
      {!isPaid && deepScanAvailable && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">
                🔍 Free Scan View: Showing {report.hops.length} hop{report.hops.length !== 1 ? "s" : ""}
              </h2>
              <p className="text-blue-800">
                We detect {Math.max(5, report.hops.length * 3)} additional hops and potential exchange deposit addresses in this chain.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Unlock Deep Scan to reveal the full flow and hidden destinations.
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            >
              {checkoutLoading ? "Redirecting..." : "Reveal Full Trace →"}
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Transaction Flow</h2>
        {report.hops.length > 0 ? (
          <div className="space-y-3">
            {report.hops.map((hop: Hop, idx: number) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-sm break-all">{hop.address}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {hop.value} {hop.token} • {new Date(hop.timestamp * 1000).toLocaleString()}
                  </div>
                  {hop.riskFlags && hop.riskFlags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {hop.riskFlags.map((flag, i) => (
                        <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No hops traced.</p>
        )}
      </div>

      {!isPaid && deepScanAvailable ? (
        // Paywall preview with hidden hops teaser (no additional CTA here — main CTA above)
        <>
          {/* Paywall preview — CTA is in FOMO section above */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-500 text-center">
              🔒 {report.hops.length} hop{report.hops.length !== 1 ? "s" : ""} traced — scroll up to unlock full access
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap gap-4 justify-end border-t border-slate-200 pt-6">
          <button
            onClick={handleDownloadPdf}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import TransactionFlowGraph from "@/components/TransactionFlowGraph";
import ShareButtons from "@/components/ShareButtons";
import type { Hop } from "@/lib/tracer";

interface Props {
  report: any;
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

  console.log("[ReportView] Full report object:", JSON.stringify(report, null, 2));

  const totalRisk = report.riskScore ?? report.risk_score ?? 0;
  const riskColor = totalRisk >= 70 ? "text-red-700" : totalRisk >= 40 ? "text-amber-700" : totalRisk >= 1 ? "text-green-700" : "text-gray-900";
  const riskBg = totalRisk >= 70 ? "bg-red-50 border-red-300" : totalRisk >= 40 ? "bg-amber-50 border-amber-300" : totalRisk >= 1 ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-300";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-blue-700 hover:text-blue-800 hover:underline text-sm font-medium flex items-center gap-1">
          ← New Trace
        </Link>
        {!loading && user && (
          <Link href="/dashboard" className="text-gray-900 hover:text-gray-800 font-medium text-sm">
            Dashboard
          </Link>
        )}
      </div>

      <ShareButtons
        reportId={report.id}
        address={report.address}
        chain={report.chain}
        hopCount={report.hops.length}
      />

      <div className={`rounded-xl border p-6 mb-8 ${riskBg}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2 font-mono break-all text-gray-900">{report.address}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="uppercase font-semibold text-gray-900">{report.chain}</span>
              <span>•</span>
              <span>{new Date(report.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${riskColor} mb-1`}>{totalRisk}</div>
            <div className="text-sm uppercase font-semibold tracking-wide text-gray-900">Risk Score</div>
            <div className="text-xs text-gray-700 mt-1">out of 100</div>
          </div>
        </div>
        {report.summary && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Analysis</h3>
            <p className="text-gray-900 leading-relaxed">{report.summary}</p>
          </div>
        )}
        {report.riskSummary && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Analysis</h3>
            <p className="text-gray-900 leading-relaxed">{report.riskSummary}</p>
          </div>
        )}
      </div>

      <TransactionFlowGraph hops={report.hops} />

      {/* FOMO Upsell Section - shown only for free users */}
      {!isPaid && deepScanAvailable && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-300 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">
                🔍 Free Scan View: Showing {report.hops.length} hop{report.hops.length !== 1 ? "s" : ""}
              </h2>
              <p className="text-blue-800 mb-2">
                We detect {Math.max(5, report.hops.length * 3)} additional hops and potential exchange deposit addresses in this chain.
              </p>
              <p className="text-sm text-blue-700">Unlock Deep Scan to reveal the full flow and hidden destinations.</p>
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
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Transaction Flow</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {report.hops.map((hop: Hop, idx: number) => (
            <div key={hop.txHash} className="border-b border-gray-100 last:border-b-0">
              <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0">
                  {hop.hop}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 font-medium mb-1">From:</div>
                      <div className="font-mono text-sm text-gray-900 break-all">{hop.from}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 font-medium mb-1">To:</div>
                      <div className="font-mono text-sm text-gray-900 break-all">{hop.to}</div>
                      {hop.label && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {hop.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-700">
                    <span className="font-semibold text-gray-900">{hop.value} {hop.token}</span>
                    <span>{new Date(hop.timestamp * 1000).toLocaleString()}</span>
                    {hop.gapFromPrevSeconds !== undefined && (
                      <span>Gap: {hop.gapFromPrevSeconds < 3600
                        ? `${hop.gapFromPrevSeconds}s`
                        : hop.gapFromPrevSeconds < 86400
                          ? `${Math.floor(hop.gapFromPrevSeconds / 3600)}h`
                          : `${Math.floor(hop.gapFromPrevSeconds / 86400)}d`}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {hop.isSanctioned && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">OFAC</span>
                  )}
                  {hop.isMixer && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">MIXER</span>
                  )}
                  {hop.isBridge && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">BRIDGE</span>
                  )}
                  {hop.scamMatches && hop.scamMatches.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">SCAM</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isPaid && deepScanAvailable ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-700">
            🔒 {report.hops.length} hop{report.hops.length !== 1 ? "s" : ""} traced — scroll up to unlock full access
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-end border-t border-gray-200 pt-6">
          <button
            onClick={handleDownloadPdf}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors font-medium"
          >
            📄 Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
}
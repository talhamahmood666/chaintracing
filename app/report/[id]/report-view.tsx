"use client";

import { useState } from "react";
import Link from "next/link";
import type { Hop, Chain } from "@/lib/tracer";
import type { RiskFlag } from "@/lib/risk";
import { getExplorerAddressUrl, shortAddr } from "@/lib/chain-utils";

interface ReportData {
  id: string;
  address: string;
  chain: string;
  hops: Hop[];
  riskScore: number;
  riskSummary: string;
  riskFlags: RiskFlag[];
  createdAt: string;
  paid: boolean;
  tier: "quick" | "deep";
  viewToken: string;
}

function riskColor(score: number): string {
  if (score >= 75) return "text-red-600";
  if (score >= 50) return "text-orange-500";
  if (score >= 25) return "text-yellow-500";
  return "text-green-600";
}

function riskBg(score: number): string {
  if (score >= 75) return "bg-red-50 border-red-200";
  if (score >= 50) return "bg-orange-50 border-orange-200";
  if (score >= 25) return "bg-yellow-50 border-yellow-200";
  return "bg-green-50 border-green-200";
}

function riskLabel(score: number): string {
  if (score >= 75) return "CRITICAL RISK";
  if (score >= 50) return "HIGH RISK";
  if (score >= 25) return "MEDIUM RISK";
  return "LOW RISK";
}

function flagBorder(severity: RiskFlag["severity"]): string {
  switch (severity) {
    case "critical": return "border-l-red-500";
    case "high": return "border-l-orange-500";
    case "medium": return "border-l-yellow-500";
    default: return "border-l-blue-400";
  }
}

function flagBadge(severity: RiskFlag["severity"]): string {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700";
    case "high": return "bg-orange-100 text-orange-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    default: return "bg-blue-100 text-blue-700";
  }
}



export function ReportView({ report }: { report: ReportData }) {
  const [downloading, setDownloading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const cexHop = report.hops.find((h) => h.label);
  const score = report.riskScore;
  const chain = report.chain as Chain;
  const tier = report.tier ?? "quick";
  const bridgeHops = report.hops.filter((h) => (h as Hop & { isBridge?: boolean }).isBridge);
  const mixerHops = report.hops.filter((h) => h.isMixer);

  async function handleUnlock() {
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: report.address,
          chain: report.chain,
          tier,
          hops: report.hops,
          riskScore: report.riskScore,
          riskLevel: riskLabel(report.riskScore).toLowerCase().replace(" risk", ""),
          riskFlags: report.riskFlags,
          riskSummary: report.riskSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUnlockError(data.error ?? "Checkout failed.");
        return;
      }
      if (data.invoice_url) window.location.href = data.invoice_url;
    } catch {
      setUnlockError("Network error. Please try again.");
    } finally {
      setUnlocking(false);
    }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/report/${report.id}/pdf?token=${report.viewToken}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chaintracing-${report.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-700 tracking-tight">
            ChainTracing
          </Link>
          <span className="text-sm text-slate-500">
            Report #{report.id.slice(0, 8)}
          </span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">
              Trace Report
            </h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tier === "deep" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
              {tier === "deep" ? "Deep Trace" : "Quick Scan"}
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Generated {new Date(report.createdAt).toLocaleString()} · Chain:{" "}
            <span className="font-medium uppercase">{chain}</span>
          </p>
        </div>

        {/* Address card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Traced Address
          </p>
          <a
            href={getExplorerAddressUrl(report.address, chain)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-blue-700 break-all hover:underline"
          >
            {report.address}
          </a>
        </div>

        {/* Risk score */}
        <div className={`rounded-xl border p-6 mb-6 ${riskBg(score)}`}>
          <div className="flex items-center gap-5 mb-3">
            <div>
              <span className={`text-5xl font-black ${riskColor(score)}`}>
                {score}
              </span>
              <span className="text-slate-400 text-lg">/100</span>
            </div>
            <div>
              <p className={`text-xl font-bold ${riskColor(score)}`}>
                {riskLabel(score)}
              </p>
              <p className="text-slate-500 text-sm">Risk Score</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">
            {report.riskSummary}
          </p>
        </div>

        {/* Flags */}
        {report.riskFlags.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-slate-700 mb-3">Risk Flags</h2>
            <div className="space-y-3">
              {report.riskFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`bg-white rounded-lg border-l-4 border border-slate-100 p-4 ${flagBorder(flag.severity)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${flagBadge(flag.severity)}`}
                    >
                      {flag.severity.toUpperCase()}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {flag.label}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{flag.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Methodology warning — single-path BFS disclosure, visible on all paid reports */}
        {report.paid && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
              Trace Methodology
            </p>
            <p className="text-sm text-amber-800">
              TRACE METHODOLOGY: This report follows the largest outgoing transaction at each hop. Scammers often split funds (peel chains) — if the total stolen amount is over $10,000, consult a professional investigator for multi-path analysis.
            </p>
            {tier === "deep" && (
              <p className="text-sm text-amber-800 mt-2">
                Deep Trace includes bridge + mixer + clustering detection, but still follows single dominant path.
              </p>
            )}
          </div>
        )}

        {/* CEX destination */}
        {cexHop && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
              Exchange Destination Found
            </p>
            <p className="font-bold text-green-800 text-lg mb-1">
              {cexHop.label}
            </p>
            <p className="font-mono text-sm text-green-700 break-all mb-2">
              {cexHop.to}
            </p>
            <p className="text-sm text-green-700">
              Funds reached this exchange at hop #{cexHop.hop}. You may be able
              to file an abuse report with{" "}
              <strong>{cexHop.label?.split(" ")[0]}</strong> with this evidence
              to freeze the funds.
            </p>
          </div>
        )}

        {/* Hop table — gated on payment */}
        <section className="mb-6">
          <h2 className="font-semibold text-slate-700 mb-3">
            Transaction Hops{" "}
            <span className="text-slate-400 font-normal">
              ({report.hops.length} hop{report.hops.length !== 1 ? "s" : ""})
            </span>
          </h2>

          {report.paid ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-left">To</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {report.hops.map((hop, i) => (
                    <tr
                      key={hop.txHash}
                      className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {hop.hop}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={getExplorerAddressUrl(hop.from, chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:underline text-xs"
                        >
                          {shortAddr(hop.from)}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={getExplorerAddressUrl(hop.to, chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-mono text-xs hover:underline ${hop.label ? "text-green-700 font-semibold" : "text-blue-600"}`}
                        >
                          {hop.label ? hop.label : shortAddr(hop.to)}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">
                        {hop.value} {hop.token}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(hop.timestamp * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={hop.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                        >
                          View ↗
                        </a>
                        {hop.isMixer && (
                          <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                            Mixer
                          </span>
                        )}
                        {hop.isSanctioned && (
                          <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                            OFAC
                          </span>
                        )}
                        {(hop as Hop & { isBridge?: boolean; bridgeName?: string }).isBridge && (
                          <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded">
                            {(hop as Hop & { bridgeName?: string }).bridgeName ?? "Bridge"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Paywall */
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">
                Full Trace Locked
              </h3>
              <p className="text-slate-500 text-sm mb-1">
                {report.hops.length} hop{report.hops.length !== 1 ? "s" : ""}{" "}
                traced. Unlock to see every wallet address, exchange
                destination, and timestamped evidence links.
              </p>
              <p className="text-slate-400 text-xs mb-6">
                Your report is ready — payment just unlocks it.
              </p>
              {unlockError && (
                <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {unlockError}
                </p>
              )}
              <button
                onClick={handleUnlock}
                disabled={unlocking}
                className="w-full bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {unlocking
                  ? "Redirecting to checkout…"
                  : tier === "deep"
                  ? "Unlock Deep Trace — $29.99"
                  : "Unlock Quick Scan — $9.99"}
              </button>
              <p className="text-slate-400 text-xs mt-3">
                One-time payment · Instant PDF download included
              </p>
            </div>
          )}
        </section>

        {/* Deep-tier sections — only shown when paid and deep tier */}
        {report.paid && tier === "deep" && (
          <>
            {bridgeHops.length > 0 && (
              <section className="mb-6">
                <h2 className="font-semibold text-slate-700 mb-3">Bridge Activity</h2>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {bridgeHops.map((hop) => (
                    <div key={hop.txHash} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded mr-2">
                          {(hop as Hop & { bridgeName?: string }).bridgeName ?? "Bridge"}
                        </span>
                        <span className="text-sm text-slate-700">Hop #{hop.hop}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {hop.value} {hop.token} · {new Date(hop.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mixerHops.length > 0 && (
              <section className="mb-6">
                <h2 className="font-semibold text-slate-700 mb-3">Mixer / Obfuscation Activity</h2>
                <div className="bg-red-50 border border-red-200 rounded-xl divide-y divide-red-100">
                  {mixerHops.map((hop) => (
                    <div key={hop.txHash} className="px-4 py-3">
                      <p className="text-sm font-medium text-red-800">
                        Hop #{hop.hop} — funds passed through a known mixer
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {new Date(hop.timestamp * 1000).toLocaleString()} · {hop.value} {hop.token}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* PDF download — only for paid */}
        {report.paid && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">Download PDF Report</p>
              <p className="text-sm text-blue-700">
                Timestamped evidence report with all hops and explorer links
              </p>
            </div>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {downloading ? "Generating…" : "Download PDF"}
            </button>
          </div>
        )}

        {/* Law enforcement note */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-semibold text-amber-900 mb-1">
            What to do with this report
          </p>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li>
              File a police report with this document as evidence — it shows the
              money trail
            </li>
            <li>
              If funds reached an exchange, contact that exchange&apos;s fraud/abuse
              team to request a freeze
            </li>
            <li>
              Report to IC3.gov (USA), Action Fraud (UK), or your national
              cyber-crime unit
            </li>
            <li>
              Consult a lawyer specialising in crypto asset recovery if the
              amounts are significant
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}

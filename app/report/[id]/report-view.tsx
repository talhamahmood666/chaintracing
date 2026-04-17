"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import TransactionFlowGraph from "@/components/TransactionFlowGraph";
import ShareButtons from "@/components/ShareButtons";
import RiskMeter from "@/components/RiskMeter";
import type { Hop } from "@/lib/tracer";

interface Props {
  report: any;
  viewToken: string;
  isPaid?: boolean;
  deepScanAvailable?: boolean;
}

const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  isSanctioned: { bg: 'rgba(255,71,87,0.15)', color: '#FF4757', label: 'OFAC' },
  isMixer:      { bg: 'rgba(255,165,0,0.15)',  color: '#FFA500', label: 'MIXER' },
  isBridge:     { bg: 'rgba(138,43,226,0.15)', color: '#9B59B6', label: 'BRIDGE' },
};

function HopTag({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: bg, color }}>{label}</span>
  );
}

export default function ReportView({ report, viewToken, isPaid = false, deepScanAvailable = true }: Props) {
  const [user, setUser] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id, address: report.address, chain: report.chain, hops: report.hops }),
    });
    const data = await res.json();
    if (data.reportId && data.viewToken) {
      window.location.href = `/pay/${data.reportId}?token=${data.viewToken}`;
    } else { alert("Checkout failed. Please try again."); setCheckoutLoading(false); }
  };

  const handleDownloadPdf = async () => {
    const res = await fetch(`/api/report/${report.id}/pdf?token=${viewToken}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `ChainTracing-${report.address.slice(0, 8)}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } else { alert("PDF generation failed."); }
  };

  const totalRisk = report.riskScore ?? report.risk_score ?? 0;
  const riskLevel = totalRisk >= 75 ? 'CRITICAL' : totalRisk >= 50 ? 'HIGH' : totalRisk >= 25 ? 'MEDIUM' : 'LOW';
  const riskColor = totalRisk >= 75 ? '#FF4757' : totalRisk >= 50 ? '#FFA500' : totalRisk >= 25 ? '#FFD700' : '#00E676';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium flex items-center gap-1 transition-colors"
          style={{ color: '#00D9FF' }}>
          ← New Trace
        </Link>
        {user && (
          <Link href="/dashboard" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Dashboard
          </Link>
        )}
      </div>

      <ShareButtons reportId={report.id} address={report.address} chain={report.chain} hopCount={report.hops.length} />

      {/* Risk header */}
      <div className="glass rounded-2xl p-6 mb-6" style={{ border: `1px solid ${riskColor}33` }}>
        <div className="flex flex-wrap items-center gap-8">
          <RiskMeter score={totalRisk} size={140} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}>
                {riskLevel} RISK
              </span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {report.chain.toUpperCase()} · {report.hops.length} hop{report.hops.length !== 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="font-mono text-sm break-all mb-3" style={{ color: 'var(--text-primary)' }}>{report.address}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(report.created_at).toLocaleString()}
            </p>
            {(report.summary || report.riskSummary) && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {report.summary || report.riskSummary}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <TransactionFlowGraph hops={report.hops} />
      </div>

      {/* Upsell */}
      {!isPaid && deepScanAvailable && (
        <div className="glass rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(0,217,255,0.25)', background: 'rgba(0,217,255,0.04)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Showing {report.hops.length} of ~{Math.max(5, report.hops.length * 3)} detected hops
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Unlock Deep Scan to reveal exchange deposits, mixer outputs, and full destination chain.
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628', cursor: checkoutLoading ? 'wait' : 'pointer' }}
            >
              {checkoutLoading ? 'Redirecting…' : 'Reveal Full Trace →'}
            </button>
          </div>
        </div>
      )}

      {/* Hop timeline */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>
          Transaction Timeline
        </h2>
        <div className="space-y-0">
          {report.hops.map((hop: Hop, idx: number) => {
            const hopRisk = (hop.isMixer ? 35 : 0) + (hop.isSanctioned ? 40 : 0) + (hop.isBridge ? 20 : 0) + (hop.scamMatches?.length ? 25 : 0);
            const hopColor = hopRisk >= 40 ? '#FF4757' : hopRisk >= 20 ? '#FFA500' : '#00D9FF';
            return (
              <div key={hop.txHash} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${hopColor}20`, border: `1px solid ${hopColor}60`, color: hopColor }}>
                    {hop.hop}
                  </div>
                  {idx < report.hops.length - 1 && (
                    <div className="w-px flex-1 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="glass rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap gap-1">
                        {hop.isSanctioned && <HopTag {...TAG_STYLES.isSanctioned} />}
                        {hop.isMixer && <HopTag {...TAG_STYLES.isMixer} />}
                        {hop.isBridge && <HopTag {...TAG_STYLES.isBridge} />}
                        {hop.scamMatches && hop.scamMatches.length > 0 && (
                          <HopTag bg="rgba(255,71,87,0.15)" color="#FF4757" label="SCAM" />
                        )}
                        {hop.label && (
                          <HopTag bg="rgba(0,230,118,0.12)" color="#00E676" label={hop.label} />
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: hopColor }}>
                        {hop.value} {hop.token}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block mb-0.5" style={{ color: 'var(--text-muted)' }}>FROM</span>
                        <span className="font-mono break-all" style={{ color: 'var(--text-secondary)' }}>{hop.from}</span>
                      </div>
                      <div>
                        <span className="block mb-0.5" style={{ color: 'var(--text-muted)' }}>TO</span>
                        <span className="font-mono break-all" style={{ color: 'var(--text-secondary)' }}>{hop.to}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      {isPaid || !deepScanAvailable ? (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleDownloadPdf}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
          >
            Download PDF Report
          </button>
        </div>
      ) : (
        <div className="glass rounded-xl p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {report.hops.length} hop{report.hops.length !== 1 ? 's' : ''} traced — scroll up to unlock full access
        </div>
      )}
    </div>
  );
}

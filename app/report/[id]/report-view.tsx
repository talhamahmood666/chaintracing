"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import TransactionFlowGraph from "@/components/TransactionFlowGraph";
import ShareButtons from "@/components/ShareButtons";
import RiskMeter from "@/components/RiskMeter";
import type { Hop } from "@/lib/tracer";
import PricingTiers from "@/components/PricingTiers";

interface Props {
  report: any;
  viewToken: string;
  isPaid?: boolean;
  deepScanAvailable?: boolean;
  allHops?: Hop[];       // full hop list for checkout (server strips visible hops)
  totalHopCount?: number; // actual detected hops for teaser display
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

export default function ReportView({ report, viewToken, isPaid = false, deepScanAvailable = true, allHops, totalHopCount }: Props) {
  const searchParams = useSearchParams();
  const utxoMode = searchParams.get("utxo") === "1";
  const [user, setUser] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<"quick" | "deep" | null>(null);
  const [firstReportDiscount, setFirstReportDiscount] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; discount_type?: string; discount_value?: number; reason?: string } | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetch("/api/stats/discount-eligible").then(r => r.json()).then(d => setFirstReportDiscount(!!d.eligible)).catch(() => {});
      }
    });
  }, []);

  const handleCouponBlur = async () => {
    const code = couponInput.trim();
    if (!code) { setCouponStatus(null); return; }
    const params = new URLSearchParams({ code: code.toUpperCase() });
    if (report.email) params.set("email", report.email);
    const res = await fetch(`/api/validate-coupon?${params}`);
    setCouponStatus(await res.json());
  };

  const handleCheckout = async (tier: "quick" | "deep" = "quick") => {
    setCheckoutLoading(tier);
    // Use allHops (full detected hops) — not the truncated visible subset
    const hopsForCheckout = allHops ?? report.hops;
    const body: Record<string, unknown> = { reportId: report.id, address: report.address, chain: report.chain, hops: hopsForCheckout, tier };
    if (couponInput.trim()) body.coupon_code = couponInput.trim();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.adminBypass && data.reportId && data.viewToken) {
      window.location.href = `/report/${data.reportId}?token=${data.viewToken}&admin=1`;
    } else if (data.reportId && data.viewToken) {
      window.location.href = `/pay/${data.reportId}?token=${data.viewToken}`;
    } else { alert("Checkout failed. Please try again."); setCheckoutLoading(null); }
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

  // Detect terminal CEX hop — last hop that has a label (exchange name)
  const allVisibleHops: Hop[] = report.hops;
  const terminalCexHop = [...allVisibleHops].reverse().find((h: Hop) => h.label);
  const terminalExchange = terminalCexHop
    ? { name: terminalCexHop.label!.split(' Hot Wallet')[0].split(' Cold Wallet')[0].split(':')[0].trim(), label: terminalCexHop.label!, address: terminalCexHop.to }
    : null;

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

      <div style={{ position: 'relative', zIndex: 0 }}>
        <ShareButtons reportId={report.id} address={report.address} chain={report.chain} hopCount={report.hops.length} riskScore={totalRisk} />
      </div>

      {/* L3: post-payment discount confirmation */}
      {isPaid && report.discount_applied && (
        <div className="rounded-xl px-4 py-2.5 mb-3 text-xs font-semibold text-center"
          style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.25)", color: "#00E676" }}>
          🎁 First-report discount applied — you saved 50%
        </div>
      )}

      {/* M7 / partial trace: only warn when BFS was cut short, not when it reached a CEX */}
      {isPaid && !terminalExchange && !utxoMode && report.hops.some((h: Hop) => h.partial_trace) && (
        <div className="rounded-xl px-4 py-2.5 mb-3 text-xs font-semibold text-center"
          style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.25)", color: "#FFA500" }}>
          ⚠️ Trace may be incomplete — the API window was exhausted before reaching a known destination. Some hops may be missing.
        </div>
      )}
      {isPaid && !terminalExchange && report.hops.some((h: Hop) => !h.partial_trace && h.likely_truncated) && (
        <div className="rounded-xl px-4 py-2.5 mb-3 text-xs font-semibold text-center"
          style={{ background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.18)", color: "#FFA500" }}>
          ℹ️ High-volume address — more transactions may exist beyond the visible trace window.
        </div>
      )}

      {/* Evidence-only notice */}
      <div className="rounded-xl px-4 py-2.5 mb-4 text-xs font-medium text-center"
        style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "rgba(245,158,11,0.9)" }}>
        ⚠️ This report is evidence only. ChainTracing is not a recovery service.
      </div>

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
              {utxoMode && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(0,217,255,0.12)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.3)' }}>
                  UTXO Trace
                </span>
              )}
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

      {/* CEX destination success banner */}
      {terminalExchange && (
        <div className="glass rounded-2xl p-5 mb-6" style={{ border: '1px solid rgba(0,230,118,0.3)', background: 'rgba(0,230,118,0.04)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✓</span>
                <h2 className="text-base font-black" style={{ color: '#00E676' }}>
                  Funds traced to {terminalExchange.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase"
                  style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}>
                  CEX
                </span>
              </div>
              <p className="text-xs font-mono break-all" style={{ color: 'var(--text-muted)' }}>
                {terminalExchange.address}
              </p>
            </div>
            {isPaid && (
              <button onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
                style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                Download Evidence PDF
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        <TransactionFlowGraph hops={report.hops} isPaid={isPaid} />
      </div>

      {/* Upsell — post-scan tier cards */}
      {!isPaid && deepScanAvailable && (
        <div className="mb-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Showing {report.hops.length} of {totalHopCount ?? report.hops.length} detected hops
              </h2>
              {firstReportDiscount && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}>
                  🎁 50% OFF — first report
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Unlock full trace to reveal exchange deposits, mixer outputs, and destination.
            </p>
          </div>
          <PricingTiers
            postScan
            onSelectTier={handleCheckout}
            loadingTier={checkoutLoading}
            firstReportDiscount={firstReportDiscount}
          />
          {/* Coupon code input */}
          <div className="mt-5">
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Have a discount code?</p>
            <input
              type="text"
              value={couponInput}
              onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponStatus(null); }}
              onBlur={handleCouponBlur}
              placeholder="Enter coupon code (optional)"
              className="w-full rounded-xl px-4 py-2.5 text-sm font-mono"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-primary)', outline: 'none' }}
            />
            {couponStatus && (
              <p className="mt-1.5 text-xs font-semibold" style={{ color: couponStatus.valid ? '#00E676' : '#FF4757' }}>
                {couponStatus.valid
                  ? `✓ ${couponStatus.discount_type === 'percent' ? `${couponStatus.discount_value}% off` : `$${couponStatus.discount_value} off`} applied`
                  : `✗ ${couponStatus.reason}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Analyst Summary (AI narrative) */}
      {isPaid && report.ai_narrative && (
        <div className="glass rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(0,217,255,0.2)', background: 'rgba(0,217,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00D9FF' }}>Analyst Summary</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0,217,255,0.12)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.25)' }}>AI-Generated</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
            {report.ai_narrative}
          </p>
        </div>
      )}

      {/* Analyst Summary teaser (free tier) */}
      {!isPaid && report.ai_narrative && (
        <div className="glass rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ border: '1px solid rgba(0,217,255,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00D9FF' }}>Analyst Summary</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(0,217,255,0.12)', color: '#00D9FF', border: '1px solid rgba(0,217,255,0.25)' }}>AI-Generated</span>
          </div>
          <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
            {report.ai_narrative.split('. ')[0]}.
          </p>
          <div className="relative">
            <p className="text-sm leading-relaxed blur-sm select-none" style={{ color: 'var(--text-secondary)' }}>
              {report.ai_narrative.split('. ').slice(1).join('. ')}
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={() => handleCheckout("quick")} disabled={!!checkoutLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628' }}>
                {checkoutLoading ? 'Redirecting…' : 'Unlock full analysis →'}
              </button>
            </div>
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
                  <div className="glass rounded-xl p-4" style={hop.beyondCex ? { opacity: 0.5 } : undefined}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap gap-1">
                        {hop.beyondCex && <HopTag bg="rgba(255,165,0,0.15)" color="#FFA500" label="BEYOND CEX — UNRELIABLE" />}
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

      {/* Next Steps — shown when CEX destination identified */}
      {terminalExchange && isPaid && (
        <div className="glass rounded-2xl p-6 mb-6" style={{ border: '1px solid rgba(0,217,255,0.15)' }}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            Next Steps
          </h2>
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex gap-3">
              <span className="font-black text-base" style={{ color: '#00D9FF', flexShrink: 0 }}>1.</span>
              <div>
                <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Download your PDF evidence report</p>
                <p>Contains all hop data, timestamps, block explorer links, and the {terminalExchange.name} destination address.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-black text-base" style={{ color: '#00D9FF', flexShrink: 0 }}>2.</span>
              <div>
                <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Contact {terminalExchange.name} compliance</p>
                <p>Submit a law enforcement or compliance request to {terminalExchange.name} citing their KYC obligations. Reference address: <span className="font-mono text-xs break-all" style={{ color: '#00D9FF' }}>{terminalExchange.address}</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-black text-base" style={{ color: '#00D9FF', flexShrink: 0 }}>3.</span>
              <div>
                <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>File a police report</p>
                <p>Provide the PDF to local law enforcement or cybercrime units (FBI IC3, Action Fraud UK, etc.) — exchanges respond faster to official requests.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="font-black text-base" style={{ color: '#00D9FF', flexShrink: 0 }}>4.</span>
              <div>
                <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Share this report</p>
                <p>Use the share link at the top of this page to send the evidence to investigators or legal counsel.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer actions — PDF only available on paid reports (H5) */}
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

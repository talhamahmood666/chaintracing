"use client";

interface PricingTiersProps {
  /** When true: FREE tier shown as "completed", QUICK+DEEP as clickable upgrade cards */
  postScan?: boolean;
  onSelectTier?: (tier: "quick" | "deep") => void;
  loadingTier?: "quick" | "deep" | null;
  firstReportDiscount?: boolean;
}

const QUICK_FEATURES = [
  "10 hops traced",
  "Exchange identification",
  "PDF evidence report",
  "Risk scoring + flags",
  "Shareable link",
];

const DEEP_FEATURES = [
  "20 hops traced (2× more)",
  "Bridge + mixer detection",
  "Wallet clustering analysis",
  "Timing pattern analysis",
  "AI analyst narrative",
  "OFAC screening",
];

const FREE_FEATURES = [
  "2 hops (anonymous) · 5 hops (logged in)",
  "Live risk score + flags",
  "Scam database check",
  "No credit card needed",
];

export default function PricingTiers({
  postScan = false,
  onSelectTier,
  loadingTier,
  firstReportDiscount = false,
}: PricingTiersProps) {
  const quickPrice = firstReportDiscount ? "$4.99" : "$9.99";
  const deepPrice = firstReportDiscount ? "$14.99" : "$29.99";

  if (postScan) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* FREE — completed */}
        <div className="glass rounded-2xl p-6 relative opacity-70" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,230,118,0.2)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}>
              ✓ Completed
            </span>
          </div>
          <div className="flex items-center justify-between mb-5 mt-2">
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Free Scan</h3>
            <div className="text-right">
              <span className="text-3xl font-black font-mono" style={{ color: 'var(--text-muted)' }}>FREE</span>
              <p className="text-xs font-bold mt-0.5" style={{ color: '#00E676' }}>✓ Included</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span style={{ color: '#00E676', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* QUICK SCAN */}
        <div className="glass rounded-2xl p-6 relative" style={{ border: '2px solid #00D9FF', boxShadow: '0 0 24px rgba(0,217,255,0.12)' }}>
          {firstReportDiscount && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: '#00D9FF', color: '#0A1628' }}>50% OFF</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-5 mt-2">
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: '#00D9FF' }}>Quick Scan</h3>
            <div className="text-right">
              <span className="text-3xl font-black font-mono" style={{ color: '#00D9FF' }}>{quickPrice}</span>
              {firstReportDiscount && <p className="text-xs line-through mt-0.5" style={{ color: 'var(--text-muted)' }}>$9.99</p>}
            </div>
          </div>
          <ul className="space-y-2 mb-6 text-sm">
            {QUICK_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span style={{ color: '#00D9FF', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSelectTier?.("quick")}
            disabled={!!loadingTier}
            className="block w-full py-3 rounded-xl font-black text-sm text-center transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628', cursor: loadingTier ? 'wait' : 'pointer', opacity: loadingTier === 'deep' ? 0.5 : 1 }}
          >
            {loadingTier === 'quick' ? 'Redirecting…' : `Unlock Quick Scan — ${quickPrice}`}
          </button>
        </div>

        {/* DEEP TRACE */}
        <div className="glass rounded-2xl p-6 relative" style={{ border: '2px solid #FFA500', boxShadow: '0 0 24px rgba(255,165,0,0.12)' }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
              style={{ background: 'linear-gradient(135deg, #FFA500, #CC8800)', color: '#0A1628' }}>
              {firstReportDiscount ? '50% OFF' : '⭐ Recommended'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-5 mt-2">
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: '#FFA500' }}>Deep Trace</h3>
            <div className="text-right">
              <span className="text-3xl font-black font-mono" style={{ color: '#FFA500' }}>{deepPrice}</span>
              {firstReportDiscount && <p className="text-xs line-through mt-0.5" style={{ color: 'var(--text-muted)' }}>$29.99</p>}
            </div>
          </div>
          <ul className="space-y-2 mb-6 text-sm">
            {DEEP_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span style={{ color: '#FFA500', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSelectTier?.("deep")}
            disabled={!!loadingTier}
            className="block w-full py-3 rounded-xl font-black text-sm text-center transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #FFA500, #CC8800)', color: '#0A1628', cursor: loadingTier ? 'wait' : 'pointer', opacity: loadingTier === 'quick' ? 0.5 : 1 }}
          >
            {loadingTier === 'deep' ? 'Redirecting…' : `Unlock Deep Trace — ${deepPrice}`}
          </button>
        </div>
      </div>
    );
  }

  // Default: landing page pricing table
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* FREE */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(0,217,255,0.15)' }}>
        <div className="mb-5">
          <h3 className="text-xl font-black mb-1" style={{ color: '#00D9FF' }}>Free Scan</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono" style={{ color: '#00D9FF' }}>$0</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/trace</span>
          </div>
        </div>
        <ul className="space-y-2 mb-6 text-sm">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span style={{ color: '#00E676', flexShrink: 0 }}>✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>
        <a href="#trace-form"
          className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
          style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
          Start Free Trace
        </a>
      </div>

      {/* QUICK SCAN */}
      <div className="glass rounded-2xl p-6 relative" style={{ border: '2px solid #00D9FF', boxShadow: '0 0 30px rgba(0,217,255,0.15)' }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ background: '#00D9FF', color: '#0A1628' }}>Most Popular</span>
        </div>
        <div className="mb-5">
          <h3 className="text-xl font-black mb-1" style={{ color: '#00D9FF' }}>Quick Scan</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono" style={{ color: '#00D9FF' }}>$9.99</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/report</span>
          </div>
        </div>
        <ul className="space-y-2 mb-6 text-sm">
          {QUICK_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span style={{ color: '#00E676', flexShrink: 0 }}>✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>
        <a href="#trace-form"
          className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628' }}>
          Get Started
        </a>
      </div>

      {/* DEEP TRACE */}
      <div className="glass rounded-2xl p-6 relative" style={{ border: '2px solid rgba(255,165,0,0.6)', boxShadow: '0 0 24px rgba(255,165,0,0.1)' }}>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
            style={{ background: 'linear-gradient(135deg, #FFA500, #CC8800)', color: '#0A1628' }}>⭐ Recommended</span>
        </div>
        <div className="mb-5">
          <h3 className="text-xl font-black mb-1" style={{ color: '#FFA500' }}>Deep Trace</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono" style={{ color: '#FFA500' }}>$29.99</span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/report</span>
          </div>
        </div>
        <ul className="space-y-2 mb-6 text-sm">
          {DEEP_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span style={{ color: '#FFA500', flexShrink: 0 }}>✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
            </li>
          ))}
        </ul>
        <a href="#trace-form"
          className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #FFA500, #CC8800)', color: '#0A1628' }}>
          Get Started
        </a>
      </div>
    </div>
  );
}

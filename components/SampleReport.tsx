"use client";

// Mock PDF page chrome used across all three sample slides
function ReportPage({ children, page, total = 8 }: { children: React.ReactNode; page: number; total?: number }) {
  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{ background: '#ffffff', fontFamily: 'Georgia, serif', minHeight: 420 }}>
      {/* PDF header bar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ background: '#0A1628', borderBottom: '3px solid #00D9FF' }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-widest" style={{ color: '#00D9FF', fontFamily: 'monospace' }}>CHAINTRACING</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>FORENSIC INTELLIGENCE REPORT</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>Page {page} of {total}</span>
      </div>
      <div className="px-6 py-5">{children}</div>
      {/* PDF footer */}
      <div className="px-6 py-2 flex items-center justify-between" style={{ background: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
        <span className="text-xs" style={{ color: '#999', fontFamily: 'monospace' }}>CONFIDENTIAL — Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span className="text-xs" style={{ color: '#999', fontFamily: 'monospace' }}>chaintracing.com</span>
      </div>
    </div>
  );
}

// ── Slide 1: Risk Score Page ──────────────────────────────────────────────────
function RiskScorePage() {
  const score = 87;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <ReportPage page={2}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#888', fontFamily: 'monospace' }}>RISK ASSESSMENT SUMMARY</p>
          <h3 className="text-xl font-black" style={{ color: '#0A1628' }}>Address: 0xSAMPLE…a4f2</h3>
          <p className="text-xs mt-1" style={{ color: '#888', fontFamily: 'monospace' }}>Chain: Ethereum (ETH) · Scan type: Deep Trace · Depth: 8 hops</p>
        </div>
        {/* Donut score */}
        <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
          <svg width="100" height="100" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" strokeWidth="12" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke="#FF3B30" strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="900" fill="#FF3B30">{score}</text>
            <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#888">/100</text>
          </svg>
          <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: '#FF3B30', color: '#fff', fontFamily: 'monospace' }}>CRITICAL</span>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-2 mb-4">
        {[
          { icon: '🔴', label: 'OFAC Sanctioned Address in Hop Chain', sev: '#FF3B30' },
          { icon: '🔴', label: 'Mixer / Tumbler Interaction (Tornado Cash)', sev: '#FF3B30' },
          { icon: '🟠', label: 'Scam Database Match — 3 sources (confidence: 100)', sev: '#FF9500' },
          { icon: '🟠', label: 'Rapid Fund Movement — 6 hops in under 4 minutes', sev: '#FF9500' },
          { icon: '🟡', label: 'Funds Reached Binance (exchange attribution confirmed)', sev: '#FFCC00' },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 rounded px-3 py-2" style={{ background: '#f8f9fa', border: `1px solid ${f.sev}22` }}>
            <span className="text-sm">{f.icon}</span>
            <span className="text-xs font-medium" style={{ color: '#333', fontFamily: 'monospace' }}>{f.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: '#555' }}>
        This address shows strong indicators of involvement in financial fraud or money laundering (risk score: 87/100). Funds were traced to Binance, which means a formal legal request to that exchange may help identify the perpetrator. Critical flags: OFAC Sanctioned Address, Mixer / Tumbler Interaction.
      </p>
    </ReportPage>
  );
}

// ── Slide 2: Hop Chain ────────────────────────────────────────────────────────
function HopChainPage() {
  const hops = [
    { from: '0xSAMPLE…a4f2', to: '0xSAMPLE…c91b', value: '2.4 ETH', time: '14:02:11', flag: null },
    { from: '0xSAMPLE…c91b', to: '0xSAMPLE…3de7', value: '2.39 ETH', time: '14:03:44', flag: '⚠ Scam DB match' },
    { from: '0xSAMPLE…3de7', to: 'Tornado Cash 100 ETH Pool', value: '2.38 ETH', time: '14:05:09', flag: '🔴 Mixer' },
    { from: 'Tornado Cash', to: '0xSAMPLE…88f0', value: '2.35 ETH', time: '14:06:31', flag: null },
    { from: '0xSAMPLE…88f0', to: '0xSAMPLE…b14c', value: '2.35 ETH', time: '14:06:58', flag: '🔴 OFAC sanctioned' },
    { from: '0xSAMPLE…b14c', to: 'Binance Hot Wallet', value: '2.33 ETH', time: '14:08:22', flag: '✅ Exchange identified' },
  ];

  return (
    <ReportPage page={4}>
      <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#888', fontFamily: 'monospace' }}>HOP CHAIN VISUALIZATION — FULL TRANSACTION PATH</p>
      <div className="space-y-0">
        {hops.map((hop, i) => (
          <div key={i} className="flex items-stretch gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center" style={{ width: 28 }}>
              <div className="rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ width: 22, height: 22, background: hop.flag?.includes('🔴') ? '#FF3B30' : hop.flag?.includes('⚠') ? '#FF9500' : hop.flag?.includes('✅') ? '#00C853' : '#0A1628', flexShrink: 0 }}>
                {i + 1}
              </div>
              {i < hops.length - 1 && <div style={{ width: 2, flex: 1, background: '#e0e0e0', minHeight: 16 }} />}
            </div>
            {/* Hop detail */}
            <div className="pb-3 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold" style={{ color: '#0A1628', fontFamily: 'monospace' }}>{hop.to}</span>
                <span className="text-xs" style={{ color: '#888', fontFamily: 'monospace' }}>{hop.time} UTC</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: '#555', fontFamily: 'monospace' }}>← {hop.value} from {hop.from}</span>
                {hop.flag && <span className="text-xs font-semibold" style={{ color: hop.flag.includes('🔴') ? '#FF3B30' : hop.flag.includes('⚠') ? '#FF9500' : '#00C853', fontFamily: 'monospace' }}>{hop.flag}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ReportPage>
  );
}

// ── Slide 3: Exchange Attribution ─────────────────────────────────────────────
function ExchangePage() {
  return (
    <ReportPage page={7}>
      <p className="text-xs font-bold tracking-widest mb-3" style={{ color: '#888', fontFamily: 'monospace' }}>EXCHANGE ATTRIBUTION & LAW ENFORCEMENT GUIDANCE</p>

      {/* Exchange card */}
      <div className="rounded-lg p-4 mb-4 flex items-center gap-4" style={{ background: '#f0fdf4', border: '2px solid #00C853' }}>
        <div className="text-3xl">🏦</div>
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#00C853', fontFamily: 'monospace' }}>EXCHANGE IDENTIFIED</p>
          <p className="text-lg font-black" style={{ color: '#0A1628' }}>Binance</p>
          <p className="text-xs" style={{ color: '#555', fontFamily: 'monospace' }}>Wallet: 0xSAMPLE…9f3a · Label: Binance Hot Wallet 7</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold" style={{ color: '#00C853', fontFamily: 'monospace' }}>CONFIDENCE</p>
          <p className="text-2xl font-black" style={{ color: '#00C853' }}>100%</p>
        </div>
      </div>

      {/* Action items */}
      <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#888', fontFamily: 'monospace' }}>RECOMMENDED ACTIONS</p>
      <div className="space-y-2 mb-4">
        {[
          { n: '1', t: 'File abuse report with Binance', d: 'Submit to abuse@binance.com with Tx hashes below. Reference wallet 0xSAMPLE…9f3a.' },
          { n: '2', t: 'File police report', d: 'Present this PDF as evidence. Law enforcement can issue formal legal request (subpoena / MLAT) to compel KYC disclosure.' },
          { n: '3', t: 'Submit to IC3 (FBI)', d: 'File at ic3.gov. Include report ID, all transaction hashes, and the exchange wallet address.' },
        ].map((a) => (
          <div key={a.n} className="flex gap-3 rounded px-3 py-2" style={{ background: '#f8f9fa', border: '1px solid #e0e0e0' }}>
            <span className="font-black text-sm" style={{ color: '#00D9FF', minWidth: 16 }}>{a.n}.</span>
            <div>
              <p className="text-xs font-bold" style={{ color: '#0A1628' }}>{a.t}</p>
              <p className="text-xs" style={{ color: '#666' }}>{a.d}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tx hash table */}
      <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#888', fontFamily: 'monospace' }}>KEY TRANSACTION HASHES (include in all reports)</p>
      <div className="rounded overflow-hidden" style={{ border: '1px solid #e0e0e0' }}>
        {['0xSAMPLEtxhash1a2b3c4d5e6f…', '0xSAMPLEtxhash9f8e7d6c5b4a…', '0xSAMPLEtxhash3c4d5e6f7a8b…'].map((tx, i) => (
          <div key={tx} className="flex items-center justify-between px-3 py-2" style={{ background: i % 2 === 0 ? '#ffffff' : '#f8f9fa', borderBottom: i < 2 ? '1px solid #e0e0e0' : undefined }}>
            <span className="text-xs" style={{ color: '#333', fontFamily: 'monospace' }}>{tx}</span>
            <span className="text-xs" style={{ color: '#888', fontFamily: 'monospace' }}>Hop {i + 1}</span>
          </div>
        ))}
      </div>
    </ReportPage>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SampleReport() {
  return (
    <section className="py-24 px-4" style={{ background: 'rgba(10,22,40,0.6)' }}>
      <div className="max-w-6xl mx-auto">
        <p className="text-xs font-bold tracking-widest text-center mb-3" style={{ color: '#00D9FF', fontFamily: 'monospace' }}>SAMPLE REPORT</p>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-3" style={{ color: 'var(--text-primary)' }}>
          What You Get in a Deep Trace Report
        </h2>
        <p className="text-center max-w-xl mx-auto mb-2" style={{ color: 'var(--text-secondary)' }}>
          An 8–12 page forensic PDF built for law enforcement, lawyers, and exchange abuse teams.
        </p>
        <p className="text-center text-sm font-semibold mb-12" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Actual report format — every paid scan delivers this. Addresses redacted for illustration.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Slide labels */}
          <div>
            <p className="text-xs font-bold tracking-widest mb-3 text-center" style={{ color: '#00D9FF', fontFamily: 'monospace' }}>PAGE 2 — RISK SCORE</p>
            <RiskScorePage />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest mb-3 text-center" style={{ color: '#00D9FF', fontFamily: 'monospace' }}>PAGE 4 — HOP CHAIN</p>
            <HopChainPage />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest mb-3 text-center" style={{ color: '#00D9FF', fontFamily: 'monospace' }}>PAGE 7 — EXCHANGE ATTRIBUTION</p>
            <ExchangePage />
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          Actual report format — every paid scan delivers this.
        </p>
      </div>
    </section>
  );
}

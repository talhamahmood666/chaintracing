"use client";

import Link from "next/link";

export default function KhawarReport() {
  const handlePrint = () => window.print();

  const shortAddr = (a: string) => `${a.slice(0, 10)}…${a.slice(-8)}`;

  const downstream = [
    { address: "TGWiaShuy7925H5WQyqDF53aJzKB13URRL", note: "Frequent recipient" },
    { address: "TEqrBz3YxfP3rvPsLJgcokMfJnCoLb454Y", note: "Repeat destination" },
    { address: "TDR4QCNdCAdUycxagBSUSreHa2A2QLxASu", note: "Repeat destination" },
    { address: "TSTZvHEpx1mNVEz2CthhqQaNFNuUabsGuT", note: "$12,000 single tx" },
  ];

  const upstreamFunnels = [
    "TPAN5KoY…",
    "TUEiUaqj…",
    "TRFNtHVW…",
    "TFZbJH3H…",
  ];

  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Link href="/" style={{ color: "#00D9FF", fontSize: 14, fontWeight: 600 }}>← ChainTracing</Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)", color: "#00D9FF" }}>
              ✓ Verified on-chain via Tronscan
            </span>
            <button onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "rgba(0,217,255,0.15)", border: "1px solid rgba(0,217,255,0.4)", color: "#00D9FF", cursor: "pointer" }}>
              Download PDF
            </button>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="rounded-2xl p-8 mb-8"
          style={{ background: "linear-gradient(135deg, rgba(255,71,87,0.07) 0%, rgba(15,20,40,0.9) 60%)", border: "1px solid rgba(255,71,87,0.25)" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,71,87,0.2)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.4)" }}>
                  Confirmed Scam
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(0,217,255,0.15)", color: "#00D9FF", border: "1px solid rgba(0,217,255,0.3)" }}>
                  Tron · TRC20
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,165,0,0.15)", color: "#FFA500", border: "1px solid rgba(255,165,0,0.3)" }}>
                  USDT
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                Forensic Analysis Report
              </p>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#f8fafc", lineHeight: 1.2 }}>
                Khawar Bhatti —<br />
                <span style={{ color: "#FF4757" }}>TRC20 USDT Scam Investigation</span>
              </h1>
              <p className="text-sm mt-3 mb-1" style={{ color: "#94a3b8" }}>Prepared for</p>
              <p className="text-base font-semibold" style={{ color: "#e2e8f0" }}>Khawar Bhatti · CCP Community</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>April 25, 2026 · ChainTracing Deep Trace · Report #CT-KHAWAR-001</p>
            </div>
            <div className="rounded-xl p-4"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 240 }}>
              <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>Entry Scammer Wallet</p>
              <p className="font-mono text-sm break-all" style={{ color: "#FF4757" }}>TLh8UmtzGZHe…kaoMpWg</p>
              <a href="https://tronscan.org/#/address/TLh8UmtzGZHeJuh6uY4zbxVFMBYkaoMpWg"
                target="_blank" rel="noopener noreferrer"
                className="text-xs mt-2 inline-block" style={{ color: "#64748b", textDecoration: "underline" }}>
                View on Tronscan ↗
              </a>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>Consolidator Wallet</p>
                <p className="font-mono text-sm break-all" style={{ color: "#FFA500" }}>TCCGrrofm6fh…APdkFv</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,71,87,0.05)", border: "1px solid rgba(255,71,87,0.22)" }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#FF4757" }}>
            <span>⚡</span> Executive Summary
          </h2>
          <div className="grid sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Total stolen", value: "$2,071.37", sub: "USDT (TRC20)", color: "#FF4757" },
              { label: "Wallet age", value: "3+ years", sub: "Active since Sep 2022", color: "#FFA500" },
              { label: "Scam ring", value: "Multi-victim", sub: "4 upstream funnels", color: "#9B59B6" },
              { label: "Funds status", value: "DRAINED", sub: "2.49 USDT remaining", color: "#64748b" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="rounded-lg p-3"
                style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${color}33` }}>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{sub}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#cbd5e1" }}>
            This investigation traces <strong style={{ color: "#f8fafc" }}>$2,071.37 USDT</strong> stolen from two victims — including Khawar Bhatti ($1,626.96) — via a TRC20 USDT scam on the Tron network. Funds were routed through an entry wallet (<span className="font-mono text-xs" style={{ color: "#FF4757" }}>TLh8Umtz…MpWg</span>) before being consolidated into a <strong style={{ color: "#f8fafc" }}>professional 3+ year-old laundering wallet</strong> with 660 transactions.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
            The consolidator address has been fully drained. The scammer broadcast their Telegram handle (<strong style={{ color: "#f8fafc" }}>hb369369</strong>) via junk token airdrops — a known operational signature. At least 4 upstream feeder wallets confirm this is a <strong style={{ color: "#f8fafc" }}>coordinated multi-victim scam ring</strong>, not an isolated incident.
          </p>
        </div>

        {/* ── Animated SVG Flow Diagram ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Fund Flow: Victim → Scammer → Laundering Chain</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#cbd5e1" }}>
            Victim funds were deposited into a single entry wallet, then forwarded in bulk (98.7%) to a high-volume consolidator wallet, which distributed funds to multiple downstream recipients in $200–$12,000 chunks.
          </p>
          <div className="rounded-lg overflow-hidden"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,71,87,0.2)" }}>
            <style>{`
              @keyframes kFlowDash {
                from { stroke-dashoffset: 48; }
                to   { stroke-dashoffset: 0; }
              }
              @keyframes kPulse {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.7; }
              }
              @keyframes kFadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .k-flow { stroke-dasharray: 6 6; animation: kFlowDash 2.5s linear infinite; }
              .k-pulse { animation: kPulse 2s ease-in-out infinite; }
              .k-d0 { animation: kFadeIn 0.5s ease 0.1s both; }
              .k-d1 { animation: kFadeIn 0.5s ease 0.25s both; }
              .k-d2 { animation: kFadeIn 0.5s ease 0.4s both; }
              .k-d3 { animation: kFadeIn 0.5s ease 0.55s both; }
              .k-d4 { animation: kFadeIn 0.5s ease 0.7s both; }
              .k-d5 { animation: kFadeIn 0.5s ease 0.85s both; }
              .k-d6 { animation: kFadeIn 0.5s ease 1.0s both; }
            `}</style>
            <svg viewBox="0 0 820 480" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="kGlowRed" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="kGlowBlue" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="kGlowOrange" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <linearGradient id="kVictimGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3"/>
                </linearGradient>
                <linearGradient id="kRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4757" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#FF4757" stopOpacity="0.3"/>
                </linearGradient>
                <linearGradient id="kOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFA500" stopOpacity="0.9"/>
                  <stop offset="100%" stopColor="#FFA500" stopOpacity="0.3"/>
                </linearGradient>
              </defs>

              {/* ── Victim 1 (Khawar) ── */}
              <g className="k-d0" filter="url(#kGlowBlue)">
                <rect x="20" y="60" width="160" height="56" rx="10" fill="rgba(59,130,246,0.14)" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="30" y="68" width="46" height="14" rx="3" fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.5)" strokeWidth="0.7"/>
                <text x="53" y="79" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="700">VICTIM 1</text>
                <text x="100" y="88" textAnchor="middle" fontSize="9" fill="#93c5fd" fontFamily="'Courier New',monospace" fontWeight="600">TCz47XgC…s1tG7</text>
                <text x="100" y="103" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="700">Khawar Bhatti</text>
                <text x="100" y="113" textAnchor="middle" fontSize="8.5" fill="#94a3b8">$1,626.96 USDT</text>
              </g>

              {/* ── Victim 2 ── */}
              <g className="k-d1" filter="url(#kGlowBlue)">
                <rect x="20" y="150" width="160" height="50" rx="10" fill="rgba(59,130,246,0.08)" stroke="#3b82f650" strokeWidth="1.2"/>
                <rect x="30" y="158" width="46" height="14" rx="3" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.7"/>
                <text x="53" y="169" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="700">VICTIM 2</text>
                <text x="100" y="183" textAnchor="middle" fontSize="9" fill="#93c5fd" fontFamily="'Courier New',monospace">TM1zzNDZ…fwx9R</text>
                <text x="100" y="196" textAnchor="middle" fontSize="8.5" fill="#94a3b8">$444.41 USDT</text>
              </g>

              {/* ── Flow lines: victims → entry ── */}
              <path d="M 180 88 C 260 88, 280 158, 330 158" fill="none" stroke="url(#kVictimGrad)" strokeWidth="1.5" className="k-flow" style={{ animationDelay: "0s" }}/>
              <path d="M 180 175 C 260 175, 280 165, 330 165" fill="none" stroke="url(#kVictimGrad)" strokeWidth="1.2" className="k-flow" style={{ animationDelay: "0.4s" }}/>
              {/* Labels */}
              <text x="238" y="84" fontSize="8" fill="#3b82f6" textAnchor="middle">$1,626.96</text>
              <text x="238" y="195" fontSize="8" fill="#3b82f660" textAnchor="middle">$444.41</text>

              {/* ── Entry scammer wallet ── */}
              <g className="k-d2 k-pulse" filter="url(#kGlowRed)">
                <rect x="308" y="128" width="168" height="64" rx="12" fill="rgba(255,71,87,0.14)" stroke="#FF4757" strokeWidth="1.8"/>
                <rect x="318" y="136" width="60" height="15" rx="4" fill="rgba(255,71,87,0.22)" stroke="rgba(255,71,87,0.5)" strokeWidth="0.8"/>
                <text x="348" y="148" textAnchor="middle" fontSize="8.5" fill="#FF4757" fontWeight="700">SCAMMER ENTRY</text>
                <text x="392" y="163" textAnchor="middle" fontSize="9.5" fill="#fca5a5" fontFamily="'Courier New',monospace" fontWeight="600">TLh8Umtz…MpWg</text>
                <text x="392" y="178" textAnchor="middle" fontSize="8.5" fill="#94a3b8">Active Sep 2023 · $2,071.37 in</text>
              </g>

              {/* ── Flow line: entry → consolidator ── */}
              <path d="M 476 160 C 540 160, 540 220, 560 220" fill="none" stroke="url(#kRedGrad)" strokeWidth="2" className="k-flow" style={{ animationDelay: "0.2s" }}/>
              <text x="518" y="188" fontSize="8.5" fill="#FF4757" textAnchor="middle" fontWeight="600">98.7% →</text>
              <text x="518" y="200" fontSize="8" fill="#FF4757" textAnchor="middle">$2,045.59</text>

              {/* ── Consolidator ── */}
              <g className="k-d3 k-pulse" filter="url(#kGlowOrange)">
                <rect x="538" y="188" width="180" height="68" rx="12" fill="rgba(255,165,0,0.12)" stroke="#FFA500" strokeWidth="1.8"/>
                <rect x="548" y="196" width="68" height="15" rx="4" fill="rgba(255,165,0,0.2)" stroke="rgba(255,165,0,0.45)" strokeWidth="0.8"/>
                <text x="582" y="208" textAnchor="middle" fontSize="8.5" fill="#FFA500" fontWeight="700">CONSOLIDATOR</text>
                <text x="628" y="222" textAnchor="middle" fontSize="9" fill="#fcd34d" fontFamily="'Courier New',monospace" fontWeight="600">TCCGrro…dkFv</text>
                <text x="628" y="237" textAnchor="middle" fontSize="8" fill="#94a3b8">Sep 2022 · 660 txs · DRAINED</text>
                <text x="628" y="250" textAnchor="middle" fontSize="8" fill="#475569">Telegram: hb369369</text>
              </g>

              {/* ── Downstream destinations ── */}
              {[
                { cy: 340, label: "TGWiaShu…URRL", note: "Frequent", delay: "0.3s" },
                { cy: 385, label: "TEqrBz3Y…b454Y", note: "Repeat",   delay: "0.5s" },
                { cy: 430, label: "TDR4QCNd…xASu",  note: "Repeat",   delay: "0.7s" },
                { cy: 475, label: "TSTZvHEp…sGuT",  note: "$12k tx",  delay: "0.9s" },
              ].map((d, i) => (
                <g key={d.label} className={`k-d${i + 3}`}>
                  <path
                    d={`M 628 256 C 628 ${256 + (d.cy - 256) / 2}, 628 ${d.cy - 10}, 628 ${d.cy}`}
                    fill="none" stroke="url(#kOrangeGrad)" strokeWidth="1.3"
                    className="k-flow" style={{ animationDelay: d.delay }}
                  />
                  <rect x="530" y={d.cy - 14} width="196" height="26" rx="7"
                    fill="rgba(255,165,0,0.07)" stroke="rgba(255,165,0,0.25)" strokeWidth="1"/>
                  <text x="628" y={d.cy + 1} textAnchor="middle" fontSize="9" fill="#fcd34d"
                    fontFamily="'Courier New',monospace">{d.label}</text>
                  <text x="628" y={d.cy + 12} textAnchor="middle" fontSize="8" fill="#64748b">{d.note}</text>
                </g>
              ))}

              {/* ── Legend ── */}
              {[
                { x: 30,  col: "#3b82f6", label: "Victim wallet" },
                { x: 140, col: "#FF4757", label: "Scammer entry" },
                { x: 255, col: "#FFA500", label: "Consolidator / downstream" },
              ].map(({ x, col, label }) => (
                <g key={label}>
                  <rect x={x} y={430} width={10} height={10} rx={2} fill={col} opacity={0.7}/>
                  <text x={x + 14} y={439} fontSize="9" fill="#64748b" fontFamily="Inter,system-ui,sans-serif">{label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* ── Key Findings ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Key Findings</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            { icon: "🕸️", title: "Multi-victim scam ring confirmed", body: "4 upstream feeder wallets identified feeding the same consolidator. This is not an isolated scam — it is an organised operation with multiple victims across the Tron network.", color: "#FF4757" },
            { icon: "👤", title: "Professional operation (3+ year wallet age)", body: "The consolidator wallet TCCGrro…dkFv has been active since September 2022 with 660 transactions and 625 USDT transfers — indicative of a long-running criminal enterprise.", color: "#FFA500" },
            { icon: "🔄", title: "98.7% forwarded — funds laundered", body: "$2,045.59 of $2,071.37 was forwarded to the consolidator in structured chunks ($200–$3,000 USDT). Only $25.78 was retained at the entry wallet.", color: "#9B59B6" },
            { icon: "📱", title: "Scammer identifier: Telegram hb369369", body: "The scammer broadcast their Telegram handle via airdropped junk tokens ('Telegram：hb369369'). Additional junk tokens include ED, arpanetwork.online, overai.pro — fingerprints of this specific actor.", color: "#00D9FF" },
          ].map(({ icon, title, body, color }) => (
            <div key={title} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${color}25` }}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{icon}</span>
                <div>
                  <p className="font-bold mb-1.5 text-sm" style={{ color: "#f8fafc" }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Address Intelligence ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Address Intelligence</h2>
        <div className="space-y-4 mb-8">
          {/* Entry wallet */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,71,87,0.05)", border: "1px solid rgba(255,71,87,0.2)" }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,71,87,0.2)", color: "#FF4757" }}>Entry Wallet</span>
                <a href="https://tronscan.org/#/address/TLh8UmtzGZHeJuh6uY4zbxVFMBYkaoMpWg"
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-xs" style={{ color: "#FF4757" }}>TLh8UmtzGZHeJuh6uY4zbxVFMBYkaoMpWg</a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Active since", value: "Sep 2023" },
                { label: "Total in", value: "$2,071.37 USDT" },
                { label: "Forwarded", value: "98.7%" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consolidator */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,165,0,0.04)", border: "1px solid rgba(255,165,0,0.2)" }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,165,0,0.2)", color: "#FFA500" }}>Consolidator</span>
                <a href="https://tronscan.org/#/address/TCCGrrofm6fhEYuKNus2P4HYtUiGAPdkFv"
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-xs" style={{ color: "#FFA500" }}>TCCGrrofm6fhEYuKNus2P4HYtUiGAPdkFv</a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "Wallet age", value: "3+ years" },
                { label: "Transactions", value: "660 total" },
                { label: "Remaining", value: "2.49 USDT" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: "#475569" }}>
              Junk airdrop tokens: <span style={{ color: "#64748b" }}>ED, arpanetwork.online, overai.pro, &quot;Telegram：hb369369&quot;</span>
            </p>
          </div>

          {/* Top downstream */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-4 py-2.5"
              style={{ background: "rgba(0,217,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>Top Downstream Destinations</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {downstream.map(({ address, note }, i) => (
                  <tr key={address} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                    <td className="px-4 py-3">
                      <a href={`https://tronscan.org/#/address/${address}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-xs" style={{ color: "#00D9FF" }}>{shortAddr(address)}</a>
                    </td>
                    <td className="px-4 py-3 text-right text-xs" style={{ color: "#64748b" }}>{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upstream funnels */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(155,89,182,0.05)", border: "1px solid rgba(155,89,182,0.2)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#9B59B6" }}>
              Upstream Feeder Wallets (Multi-Victim Ring)
            </p>
            <div className="flex flex-wrap gap-2">
              {upstreamFunnels.map(addr => (
                <span key={addr} className="px-3 py-1 rounded-lg font-mono text-xs"
                  style={{ background: "rgba(155,89,182,0.1)", border: "1px solid rgba(155,89,182,0.25)", color: "#c084fc" }}>
                  {addr}
                </span>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "#64748b" }}>
              All feed into the same consolidator — confirming this is a coordinated multi-victim operation.
            </p>
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.2)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#00E676" }}>Recommendations</h2>
          <ol className="space-y-3">
            {[
              { n: "1", text: "Report Telegram handle hb369369 to Telegram abuse (abuse@telegram.org). Include this report as evidence. Telegram will investigate and suspend coordinated scam accounts on request from law enforcement.", color: "#00E676" },
              { n: "2", text: "File a cybercrime report with FIA Cyber Crime Wing Pakistan (helpdesk@fia.gov.pk or NR3C). Attach this forensic report, your transaction ID, and all scammer communications. Case ID: CT-KHAWAR-001.", color: "#00E676" },
              { n: "3", text: "Report consolidator address TCCGrrofm6fhEYuKNus2P4HYtUiGAPdkFv to Tether (stablecoin@tether.to) for USDT blacklisting. Tether Ltd has the on-chain power to freeze USDT at specific addresses. Requires a formal law enforcement request.", color: "#00E676" },
              { n: "4", text: "All addresses in this report have been flagged in ChainTracing's scam database. Any future victim tracing these wallets will see them marked as confirmed scam infrastructure.", color: "#00D9FF" },
              { n: "5", text: "Future safety: never approve unknown TRC20 token contracts in your wallet, verify recipient addresses independently before any transfer, and never interact with wallets that airdrop unsolicited tokens.", color: "#FFA500" },
            ].map(({ n, text, color }) => (
              <li key={n} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                  {n}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Footer ── */}
        <div className="rounded-xl p-6 text-center"
          style={{ background: "rgba(0,217,255,0.04)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <p className="text-base font-bold mb-1" style={{ color: "#00D9FF" }}>ChainTracing</p>
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>
            Generated by ChainTracing Deep Trace · April 25, 2026
          </p>
          <p className="text-xs mb-2" style={{ color: "#475569" }}>
            Prepared for Khawar Bhatti and the CCP Community
          </p>
          <a href="https://chaintracing.org" target="_blank" rel="noopener noreferrer"
            className="text-xs" style={{ color: "#00D9FF", textDecoration: "underline" }}>
            chaintracing.org
          </a>
          <p className="text-xs mt-3" style={{ color: "#334155" }}>
            This report is provided for investigative and educational purposes. On-chain data sourced from Tronscan. ChainTracing does not guarantee recovery of funds.
          </p>
        </div>

      </div>
      <style>{`
        @media print { button { display: none !important; } }
      `}</style>
    </div>
  );
}

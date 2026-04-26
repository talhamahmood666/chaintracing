"use client";

export default function FaisarReport() {
  const handlePrint = () => window.print();
  const shortAddr = (a: string) => `${a.slice(0, 10)}…${a.slice(-8)}`;

  const fqlexAddr = "TTeyHgbuk8bvmbEeqGzFJ8NNSGFsRAxbnE";
  const txoinAddr = "TPgQrryn6ayfw4tZZcjDdBbhDTVfwazwSa";

  const telegramGroups = [
    "VG Team Administrator",
    "PAK-Team Core members",
    "Team 5923 Investment Group",
    "VG Team New Study",
    "@VG-Team Learning Meet",
    "AD_PAK VG TEAM",
    "Server Operator: winwin",
  ];

  const lockedItems = [
    "Complete fund flow mapping across all hops",
    "All downstream consolidator wallets identified",
    "Cross-platform correlation between fqlex.com and txoin.com flows",
    "Tether blacklist request package (lawyer-ready)",
    "FIA NR3C cybercrime complaint draft",
    "Individual victim transaction-to-trace correlation",
    "Real-time fund movement monitoring",
  ];

  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <a href="/" style={{ color: "#00D9FF", fontSize: 14, fontWeight: 600 }}>← ChainTracing</a>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(255,71,87,0.12)", border: "1px solid rgba(255,71,87,0.4)", color: "#FF4757" }}>
              ⚠ Active threat — public advisory
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
          style={{ background: "linear-gradient(135deg, rgba(255,71,87,0.09) 0%, rgba(15,20,40,0.9) 60%)", border: "1px solid rgba(255,71,87,0.3)" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,71,87,0.25)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.5)" }}>
                  Active Threat
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(0,217,255,0.15)", color: "#00D9FF", border: "1px solid rgba(0,217,255,0.3)" }}>
                  Tron · TRC20
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,165,0,0.15)", color: "#FFA500", border: "1px solid rgba(255,165,0,0.3)" }}>
                  Multi-Victim
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                Preliminary Forensic Assessment
              </p>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#f8fafc", lineHeight: 1.2 }}>
                fqlex.com & txoin.com —<br />
                <span style={{ color: "#FF4757" }}>Coordinated Crypto Investment Scam</span>
              </h1>
              <p className="text-sm mt-3 mb-1" style={{ color: "#94a3b8" }}>Lahore Community Investigation</p>
              <p className="text-base font-semibold" style={{ color: "#e2e8f0" }}>Public Advisory</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>April 26, 2026 · Report #CT-PUBLIC-001</p>
              <p className="text-xs mt-3 italic" style={{ color: "#94a3b8" }}>
                This is a shallow public advisory. Full forensic investigation reserved for coordinated victim case.
              </p>
            </div>
            <div className="rounded-xl p-4"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 240 }}>
              <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>fqlex.com deposit</p>
              <p className="font-mono text-xs break-all" style={{ color: "#FF4757" }}>{shortAddr(fqlexAddr)}</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>Currently dormant on-chain</p>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>txoin.com deposit</p>
                <p className="font-mono text-xs break-all" style={{ color: "#FFA500" }}>{shortAddr(txoinAddr)}</p>
                <p className="text-xs mt-1" style={{ color: "#FFA500" }}>● ACTIVE fund movement</p>
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
              { label: "Active scam platforms", value: "2", sub: "fqlex.com · txoin.com", color: "#FF4757" },
              { label: "Operational status", value: "ONGOING", sub: "Not yet drained", color: "#FFA500" },
              { label: "Estimated victims", value: "15,000+", sub: "Community-reported", color: "#9B59B6" },
              { label: "Withdrawals halted", value: "6–7 days ago", sub: "Exit scam pattern", color: "#FF4757" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="rounded-lg p-3"
                style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${color}33` }}>
                <p className="text-xs mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color: "#475569" }}>{sub}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
            Two domains — <strong style={{ color: "#f8fafc" }}>fqlex.com</strong> and <strong style={{ color: "#f8fafc" }}>txoin.com</strong> — operate a coordinated copy-trading and signal-trading Ponzi targeting the Lahore, Pakistan crypto community. Overlapping deposit infrastructure, identical membership tiers, and a shared Telegram operator confirm both platforms are run by the <strong style={{ color: "#f8fafc" }}>same ring</strong>. Withdrawals were disabled approximately April 19–20, 2026 while front-end sites remain online and continue to onboard new victims.
          </p>
        </div>

        {/* ── Threat Status Banner ── */}
        <div className="rounded-xl p-5 mb-8"
          style={{ background: "rgba(255,71,87,0.12)", border: "2px solid rgba(255,71,87,0.5)" }}>
          <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "#FF4757" }}>⚠ Live Threat Status</p>
          <p className="text-sm leading-relaxed" style={{ color: "#fecaca" }}>
            Both platforms remain online and accepting deposits as of <strong style={{ color: "#fff" }}>April 26, 2026</strong>. Active fund movement detected on the confirmed deposit address within the last <strong style={{ color: "#fff" }}>4 days</strong>. New victims continue to be onboarded. <strong style={{ color: "#fff" }}>Immediate action recommended.</strong>
          </p>
        </div>

        {/* ── The Two Platforms ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>The Two Platforms</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Card A: fqlex */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,71,87,0.05)", border: "1px solid rgba(255,71,87,0.25)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,71,87,0.2)", color: "#FF4757" }}>Platform A</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(0,230,118,0.15)", color: "#00E676" }}>● LIVE</span>
            </div>
            <p className="text-base font-bold mb-1" style={{ color: "#f8fafc" }}>fqlex.com</p>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>Cloudflare-hosted · last-modified April 20, 2026</p>
            <p className="text-xs mb-1" style={{ color: "#64748b" }}>Deposit address</p>
            <a href={`https://tronscan.org/#/address/${fqlexAddr}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs break-all block mb-2" style={{ color: "#FF4757" }}>{shortAddr(fqlexAddr)}</a>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>Inactive on-chain — per-victim address pattern suspected.</p>
            <a href={`https://tronscan.org/#/address/${fqlexAddr}`} target="_blank" rel="noopener noreferrer"
              className="text-xs" style={{ color: "#00D9FF", textDecoration: "underline" }}>View on Tronscan ↗</a>
          </div>

          {/* Card B: txoin */}
          <div className="rounded-xl p-5"
            style={{ background: "rgba(255,165,0,0.05)", border: "1px solid rgba(255,165,0,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,165,0,0.2)", color: "#FFA500" }}>Platform B</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(0,230,118,0.15)", color: "#00E676" }}>● LIVE</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,71,87,0.2)", color: "#FF4757" }}>● ACTIVE FUNDS</span>
            </div>
            <p className="text-base font-bold mb-1" style={{ color: "#f8fafc" }}>txoin.com</p>
            <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>Xcdn-hosted · last-modified March 18, 2026</p>
            <p className="text-xs mb-1" style={{ color: "#64748b" }}>Deposit address</p>
            <a href={`https://tronscan.org/#/address/${txoinAddr}`} target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs break-all block mb-2" style={{ color: "#FFA500" }}>{shortAddr(txoinAddr)}</a>
            <p className="text-xs mb-3" style={{ color: "#FFA500" }}>Large-volume fund movements detected.</p>
            <a href={`https://tronscan.org/#/address/${txoinAddr}`} target="_blank" rel="noopener noreferrer"
              className="text-xs" style={{ color: "#00D9FF", textDecoration: "underline" }}>View on Tronscan ↗</a>
            <p className="text-xs mt-3 italic" style={{ color: "#64748b" }}>🔒 Full chain trace available in deep investigation.</p>
          </div>
        </div>

        {/* ── Two-domain operation visual ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "#f8fafc" }}>Coordinated Two-Domain Operation</h2>
          <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>Same operators · same Telegram ring · shared deposit infrastructure · interchangeable front-ends.</p>
          <div className="rounded-lg p-6"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,71,87,0.2)" }}>
            <svg viewBox="0 0 600 220" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="fGlowRed" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* fqlex box */}
              <g filter="url(#fGlowRed)">
                <rect x="20" y="40" width="180" height="60" rx="10" fill="rgba(255,71,87,0.12)" stroke="#FF4757" strokeWidth="1.5"/>
                <text x="110" y="62" textAnchor="middle" fontSize="13" fill="#fca5a5" fontWeight="700">fqlex.com</text>
                <text x="110" y="80" textAnchor="middle" fontSize="9" fill="#94a3b8">Cloudflare · per-victim addrs</text>
                <text x="110" y="93" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="'Courier New',monospace">TTeyHgbu…AxbnE</text>
              </g>
              {/* txoin box */}
              <g filter="url(#fGlowRed)">
                <rect x="20" y="120" width="180" height="60" rx="10" fill="rgba(255,165,0,0.12)" stroke="#FFA500" strokeWidth="1.5"/>
                <text x="110" y="142" textAnchor="middle" fontSize="13" fill="#fcd34d" fontWeight="700">txoin.com</text>
                <text x="110" y="160" textAnchor="middle" fontSize="9" fill="#94a3b8">Xcdn · active deposit</text>
                <text x="110" y="173" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="'Courier New',monospace">TPgQrryn…wazwSa</text>
              </g>
              {/* Lines converging to ring */}
              <path d="M 200 70 C 280 70, 320 100, 380 110" fill="none" stroke="#FF4757" strokeWidth="1.5" strokeDasharray="6 6"/>
              <path d="M 200 150 C 280 150, 320 120, 380 110" fill="none" stroke="#FFA500" strokeWidth="1.5" strokeDasharray="6 6"/>
              {/* Operator ring */}
              <g>
                <rect x="380" y="60" width="200" height="100" rx="12" fill="rgba(155,89,182,0.12)" stroke="#9B59B6" strokeWidth="1.8"/>
                <text x="480" y="86" textAnchor="middle" fontSize="11" fill="#c084fc" fontWeight="700">SAME OPERATOR RING</text>
                <text x="480" y="106" textAnchor="middle" fontSize="9" fill="#e2e8f0">&quot;Richard Soros&quot; · Telegram</text>
                <text x="480" y="122" textAnchor="middle" fontSize="9" fill="#94a3b8">VG Team · 7 affiliated groups</text>
                <text x="480" y="138" textAnchor="middle" fontSize="9" fill="#94a3b8">Tiers: $100 · $200 · $500 USDT</text>
                <text x="480" y="154" textAnchor="middle" fontSize="9" fill="#FF4757">Withdrawals disabled Apr 19–20</text>
              </g>
            </svg>
          </div>
        </div>

        {/* ── Operational Fingerprint ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Operational Fingerprint</h2>
        <div className="rounded-xl p-5 mb-8"
          style={{ background: "rgba(155,89,182,0.04)", border: "1px solid rgba(155,89,182,0.2)" }}>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Operator identity</p>
              <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>&quot;Richard Soros&quot; (Telegram)</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Identity stolen from George Soros for legitimacy theater.</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Communication channels</p>
              <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>Telegram + Bonchat</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Multi-platform pattern — complicates takedown.</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Membership tier system</p>
              <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>$100 · $200 · $500 USDT</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Classic Ponzi tier structure.</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Minimum deposit</p>
              <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>$500 USDT</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Filters out low-stakes targets.</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>Exit indicator</p>
              <p className="text-sm font-semibold" style={{ color: "#FF4757" }}>Withdrawal system disabled approximately April 19–20, 2026</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#9B59B6" }}>Affiliated Telegram groups (7 identified)</p>
            <div className="flex flex-wrap gap-2">
              {telegramGroups.map(g => (
                <span key={g} className="px-3 py-1 rounded-lg text-xs"
                  style={{ background: "rgba(155,89,182,0.1)", border: "1px solid rgba(155,89,182,0.25)", color: "#c084fc" }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Why this is an exit scam in progress ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Why This Is an Exit Scam in Progress</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "🚪", title: "Withdrawals stopped, site stays online", body: "Common exit scam tactic to delay panic and maximize last-minute deposits before disappearing.", color: "#FF4757" },
            { icon: "💸", title: "Active deposit address moving funds", body: "Operators are visibly consolidating funds on-chain — preparation for the disappearance.", color: "#FFA500" },
            { icon: "🌐", title: "Multiple front-ends, same backend", body: "Two domains running the same operation allows quick rotation if one is taken down.", color: "#9B59B6" },
          ].map(({ icon, title, body, color }) => (
            <div key={title} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${color}25` }}>
              <span className="text-xl">{icon}</span>
              <p className="font-bold mt-2 mb-1.5 text-sm" style={{ color: "#f8fafc" }}>{title}</p>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{body}</p>
            </div>
          ))}
        </div>

        {/* ── Locked / Deep Investigation ── */}
        <div className="rounded-xl p-6 mb-4"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">🔒</span>
            <h2 className="text-lg font-bold" style={{ color: "#f8fafc" }}>Deep Investigation Available</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Preliminary scan complete. Full forensic investigation includes:</p>
          <div className="space-y-2">
            {lockedItems.map(item => (
              <div key={item} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#475569" }}>🔒</span>
                <p className="text-sm flex-1" style={{ color: "#64748b" }}>{item}</p>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#475569" }}>Locked</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-xl p-6 mb-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(0,217,255,0.1) 0%, rgba(155,89,182,0.1) 100%)", border: "1px solid rgba(0,217,255,0.4)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#00D9FF" }}>Coordinated Victim Investigation</p>
          <h3 className="text-xl font-bold mb-2" style={{ color: "#f8fafc" }}>Group Forensic Investigation</h3>
          <p className="text-sm mb-4 max-w-2xl mx-auto" style={{ color: "#cbd5e1" }}>
            Designed for groups of 10+ victims of the same scam ring. Joint forensic report, coordinated legal filing, and lawyer engagement included. Pricing scales per victim.
          </p>
          <a href="/services"
            className="inline-block px-6 py-3 rounded-lg text-sm font-bold"
            style={{ background: "#00D9FF", color: "#0a0e1a" }}>
            Request Group Investigation →
          </a>
          <p className="text-xs mt-3" style={{ color: "#64748b" }}>chaintracing.org/services</p>
        </div>

        {/* ── Public Recommendations ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.2)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#00E676" }}>Public Recommendations</h2>
          <ol className="space-y-3">
            {[
              "Do NOT make additional deposits to either platform under any circumstances. Both are active scams.",
              "Do NOT respond to any \"support\" outreach from \"Richard Soros\" or VG Team channels. They will attempt to extract more funds via fake recovery offers.",
              "Document everything. Take screenshots of all chats, deposit confirmations, account dashboards, and Telegram messages. Save TX hashes.",
              "File a preliminary report with FIA Cyber Crime Wing Pakistan (helpdesk@fia.gov.pk or NR3C portal). Mention this as part of a multi-victim case.",
              "If you are a victim, join the coordinated investigation effort at chaintracing.org/services. Group action significantly increases the likelihood of any recovery action by Tether or law enforcement.",
              "Warn others. Do not let this spread further in your community.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "rgba(0,230,118,0.18)", color: "#00E676", border: "1px solid rgba(0,230,118,0.4)" }}>
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{text}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Disclaimer ── */}
        <div className="rounded-xl p-5 mb-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
            This is a public advisory based on preliminary on-chain analysis and victim community reporting. ChainTracing has not verified individual victim claims for this advisory. Recovery of stolen funds is not guaranteed. ChainTracing provides forensic evidence and investigative support, not legal counsel or recovery services.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="rounded-xl p-6 text-center"
          style={{ background: "rgba(0,217,255,0.04)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <p className="text-base font-bold mb-1" style={{ color: "#00D9FF" }}>ChainTracing</p>
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>Generated by ChainTracing · April 26, 2026</p>
          <p className="text-xs mb-2" style={{ color: "#475569" }}>Public advisory for the Lahore Crypto Community</p>
          <a href="https://chaintracing.org" target="_blank" rel="noopener noreferrer"
            className="text-xs" style={{ color: "#00D9FF", textDecoration: "underline" }}>
            chaintracing.org
          </a>
        </div>

      </div>
      <style>{`
        @media print { button { display: none !important; } }
      `}</style>
    </div>
  );
}

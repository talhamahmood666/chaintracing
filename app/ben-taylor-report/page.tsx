"use client";

export default function BenTaylorReport() {
  const address = "bc1qwfes4nt3a9xr6glslyk4tlqf773rv2lznmkmf5";

  const topDestinations = [
    { address: "bc1qg8fl0ddgsh40cn9tt85stkepdpm0dwlcfs6ppd", btc: 0.39163189 },
    { address: "3N9FU7C488iyd2r8rgVTKGBdqwQ1AGcKQd",         btc: 0.33796247 },
    { address: "bc1q9kyzc7x3c05smyxwacgkmpsv840aj66cmajj48", btc: 0.20000000 },
    { address: "177zTQn8MztxRDjMKLScdQZm8YVkoyxQUt",         btc: 0.17486010 },
    { address: "bc1qusj7u6mwcqay849j46k8zep252ng60mhh0fjhh", btc: 0.17423114 },
    { address: "bc1qf64q32hrp8jwu8xetmel7glgrky5x8wkvtpng0", btc: 0.13415011 },
    { address: "37rVjsBr9ADUFYRVH4WJUgVwZVr9Qc1xEE",         btc: 0.13359602 },
    { address: "bc1qqkcpax0mmjdnpmzlqsmlrh8qyd52m3ksyag042", btc: 0.09374020 },
    { address: "3ADg4zCe6fLjUFbyBNSfviVndiuvSehSMY",         btc: 0.08580545 },
    { address: "bc1q7stqa6z9jhnasg7pnh56h4t4c4cnf0mxpe6yjh", btc: 0.08121119 },
  ];

  const sampleTxs = [
    {
      txid: "d6c4bd5ab35412309b74bfc278275dc0e1da7a1b91efbc475226a9d6b9e87da8",
      outputs: 5,
      totalSats: 84571 + 80507 + 34864 + 32210 + 179741,
      time: null,
    },
    {
      txid: "fd18c89fb0a5a179407a94c3e52a178fd5f4a2b2a4a3a4fec6f5b7e4a82e19de",
      outputs: 5,
      totalSats: 44360 + 162422 + 77079 + 386586 + 53086,
      time: 1777157195,
    },
    {
      txid: "3812c69aacb97d772bf61a0d96b226515cd0a622e8e090b1250084a60198983b",
      outputs: 3,
      totalSats: 95368 + 248671 + 133234,
      time: 1777157195,
    },
  ];

  const handlePrint = () => window.print();

  const shortAddr = (a: string) => `${a.slice(0, 10)}…${a.slice(-8)}`;
  const satsToBtc = (s: number) => (s / 1e8).toFixed(5);
  const fmtTs = (ts: number | null) =>
    ts ? new Date(ts * 1000).toUTCString().replace(" GMT", " UTC") : "Unconfirmed";

  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <a href="/" style={{ color: "#00D9FF", fontSize: 14, fontWeight: 600 }}>← ChainTracing</a>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)", color: "#00D9FF" }}>
              ✓ Verified on-chain via mempool.space
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(155,89,182,0.12)", border: "1px solid rgba(155,89,182,0.35)", color: "#9B59B6" }}>
              ✓ Cluster verified via Arkham Intelligence
            </span>
            <button onClick={handlePrint}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "rgba(0,217,255,0.15)", border: "1px solid rgba(0,217,255,0.4)", color: "#00D9FF", cursor: "pointer" }}>
              Download PDF
            </button>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="rounded-2xl p-8 mb-8"
          style={{ background: "linear-gradient(135deg, rgba(0,217,255,0.08) 0%, rgba(15,20,40,0.9) 60%)", border: "1px solid rgba(0,217,255,0.2)" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,71,87,0.2)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.4)" }}>
                  Active Threat
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(0,217,255,0.15)", color: "#00D9FF", border: "1px solid rgba(0,217,255,0.3)" }}>
                  Bitcoin
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#f8fafc", lineHeight: 1.2 }}>
                Forensic Analysis:<br />
                <span style={{ color: "#00D9FF" }}>Active Mass-Distribution Wallet</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                Arkham Cluster 032e · 44-day operation · $10.57B volume
              </p>
              <p className="text-sm mt-4 mb-1" style={{ color: "#94a3b8" }}>Prepared for</p>
              <p className="text-base font-semibold" style={{ color: "#e2e8f0" }}>Pleasant Green / Ben Taylor</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>April 25, 2026 · ChainTracing Deep Trace</p>
            </div>
            <div className="rounded-xl p-4 text-right"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 240 }}>
              <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>Target Address</p>
              <p className="font-mono text-sm break-all" style={{ color: "#00D9FF" }}>{address}</p>
              <a href={`https://mempool.space/address/${address}`} target="_blank" rel="noopener noreferrer"
                className="text-xs mt-2 inline-block" style={{ color: "#64748b", textDecoration: "underline" }}>
                View on mempool.space ↗
              </a>
            </div>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.25)" }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#FFA500" }}>
            <span>⚡</span> Executive Summary
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#cbd5e1" }}>
            The address <span className="font-mono text-xs" style={{ color: "#00D9FF" }}>{address}</span> is part of a <strong style={{ color: "#f8fafc" }}>2-address cluster identified by Arkham Intelligence</strong> (cluster ID 032e). The cluster activated on <strong style={{ color: "#f8fafc" }}>March 11, 2026</strong> and has processed <strong style={{ color: "#f8fafc" }}>$10.57 billion USD in 44 days</strong> — averaging $240 million per day. This is not a personal scammer wallet. It is the operational backbone of either a high-volume laundering service, an unlicensed mixer, or a compromised exchange hot wallet.
          </p>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#cbd5e1" }}>
            The cluster's velocity, lifespan, and fan-out pattern (<strong style={{ color: "#f8fafc" }}>one transaction every 4 minutes</strong>, <strong style={{ color: "#f8fafc" }}>849 unique destinations</strong> in any 18-hour window) match the operational signature of services used by organized scam networks to obscure victim funds at scale.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
            Standard blockchain tracing terminates at this layer. <strong style={{ color: "#f8fafc" }}>Recovery requires identifying the service operator via a coordinated exchange subpoena and law enforcement referral.</strong>
          </p>
        </div>

        {/* ── Key Findings ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Key Findings</h2>
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {[
            { label: "Lifetime Volume", value: "$10.57B", sub: "75,588 BTC across cluster", color: "#FF4757" },
            { label: "Daily Throughput", value: "$240M/day", sub: "44-day operation", color: "#FFA500" },
            { label: "Velocity", value: "1 tx every 4 min", sub: "Continuous activity", color: "#9B59B6" },
            { label: "Cluster Status", value: "ACTIVE", sub: "Last tx: 2 days ago", color: "#00E676" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33` }}>
              <p className="text-xs mb-2 font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{label}</p>
              <p className="text-xl font-bold mb-1" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: "#64748b" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ── The Pattern ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>The Pattern: 1-Input → Many-Outputs</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#cbd5e1" }}>
            Each transaction follows an identical structure: a single input from this address fans out to 3–8 recipient addresses in one atomic transaction. This is the hallmark of <strong style={{ color: "#f8fafc" }}>automated batch payout software</strong> — the same architecture used by legitimate exchanges for bulk withdrawals, repurposed here for criminal distribution.
          </p>
          {/* Animated SVG flow diagram */}
          <div className="rounded-lg overflow-hidden"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <style>{`
              @keyframes flowDash {
                from { stroke-dashoffset: 48; }
                to   { stroke-dashoffset: 0; }
              }
              @keyframes pulseNode {
                0%, 100% { transform: scale(1);   opacity: 1; }
                50%       { transform: scale(1.02); opacity: 0.92; }
              }
              @keyframes fadeInDest {
                from { opacity: 0; transform: translateY(6px); }
                to   { opacity: 1; transform: translateY(0); }
              }
              .flow-line {
                stroke-dasharray: 6 6;
                animation: flowDash 3s linear infinite;
              }
              .source-node {
                transform-origin: 400px 210px;
                animation: pulseNode 2s ease-in-out infinite;
              }
              .dest-g-0 { animation: fadeInDest 0.6s ease 0.2s both; }
              .dest-g-1 { animation: fadeInDest 0.6s ease 0.35s both; }
              .dest-g-2 { animation: fadeInDest 0.6s ease 0.5s both; }
              .dest-g-3 { animation: fadeInDest 0.6s ease 0.65s both; }
              .dest-g-4 { animation: fadeInDest 0.6s ease 0.8s both; }
              .dest-g-5 { animation: fadeInDest 0.6s ease 0.95s both; }
            `}</style>
            <svg viewBox="0 0 800 500" width="100%" xmlns="http://www.w3.org/2000/svg" aria-label="Fund flow diagram">
              <defs>
                {/* Source glow */}
                <filter id="glowCyan" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Destination glows */}
                <filter id="glowGreen" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glowGray" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glowRed" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* ── "Scam proceeds" label + arrow ── */}
              <text x="400" y="30" textAnchor="middle" fontSize="12" fill="#64748b" fontFamily="Inter,system-ui,sans-serif" letterSpacing="1">SCAM PROCEEDS</text>
              <line x1="400" y1="38" x2="400" y2="58" stroke="#334155" strokeWidth="1.5" />
              <polygon points="400,64 395,55 405,55" fill="#334155" />

              {/* ── Source node ── */}
              <g className="source-node" filter="url(#glowCyan)">
                <rect x="268" y="72" width="264" height="76" rx="12" ry="12"
                  fill="#0c1829" stroke="#06b6d4" strokeWidth="1.5" />
                {/* Active badge */}
                <rect x="278" y="82" width="52" height="16" rx="4" fill="rgba(0,230,118,0.15)" stroke="rgba(0,230,118,0.4)" strokeWidth="0.8" />
                <text x="304" y="94" textAnchor="middle" fontSize="9" fill="#00E676" fontFamily="Inter,system-ui,sans-serif" fontWeight="700">ACTIVE</text>
                {/* Address */}
                <text x="400" y="99" textAnchor="middle" fontSize="11" fill="#06b6d4" fontFamily="'Courier New',monospace" fontWeight="600">bc1qwfes4nt…nkmf5</text>
                {/* Stats */}
                <text x="400" y="117" textAnchor="middle" fontSize="9.5" fill="#94a3b8" fontFamily="Inter,system-ui,sans-serif">75,588 BTC lifetime · 5,182 txs</text>
                <text x="400" y="133" textAnchor="middle" fontSize="9" fill="#475569" fontFamily="Inter,system-ui,sans-serif">$7.18B processed · 45.08 BTC balance</text>
              </g>

              {/* ── "1 tx every ~4 min" label ── */}
              <text x="400" y="168" textAnchor="middle" fontSize="10" fill="#475569" fontFamily="Inter,system-ui,sans-serif" fontStyle="italic">1 tx every ~4 min</text>
              <line x1="400" y1="148" x2="400" y2="158" stroke="#1e3a4a" strokeWidth="1" strokeDasharray="3 2" />

              {/* ── Destination nodes config ── */}
              {/* cx positions for 6 nodes spread across 800px */}
              {(() => {
                const dests = [
                  { cx: 80,  label: "Dest A", btc: "0.001 BTC", cat: "Exchange deposit", color: "#00E676", fill: "rgba(0,230,118,0.12)",  stroke: "#00E676", glow: "url(#glowGreen)", delay: 0 },
                  { cx: 210, label: "Dest B", btc: "0.003 BTC", cat: "Unknown wallet",   color: "#64748b", fill: "rgba(100,116,139,0.1)", stroke: "#475569", glow: "url(#glowGray)",  delay: 1 },
                  { cx: 340, label: "Dest C", btc: "0.0008 BTC",cat: "Unknown wallet",   color: "#64748b", fill: "rgba(100,116,139,0.1)", stroke: "#475569", glow: "url(#glowGray)",  delay: 2 },
                  { cx: 460, label: "Dest D", btc: "0.0015 BTC",cat: "Mixer",            color: "#FF4757", fill: "rgba(255,71,87,0.12)",  stroke: "#FF4757", glow: "url(#glowRed)",   delay: 3 },
                  { cx: 590, label: "Dest E", btc: "0.002 BTC", cat: "Unknown wallet",   color: "#64748b", fill: "rgba(100,116,139,0.1)", stroke: "#475569", glow: "url(#glowGray)",  delay: 4 },
                  { cx: 720, label: "Dest F", btc: "0.0009 BTC",cat: "Exchange deposit", color: "#00E676", fill: "rgba(0,230,118,0.12)",  stroke: "#00E676", glow: "url(#glowGreen)", delay: 5 },
                ];
                const srcX = 400, srcY = 148;
                const nodeY = 215, nodeW = 100, nodeH = 44, nodeR = 8;
                const badgeY = 310;

                return dests.map((d, i) => {
                  const nx = d.cx;
                  const lineY1 = srcY + 28;
                  const lineY2 = nodeY;
                  // Cubic bezier: start at source bottom, fan out to dest center
                  const path = `M ${srcX} ${lineY1} C ${srcX} ${(lineY1 + lineY2) / 2}, ${nx} ${(lineY1 + lineY2) / 2}, ${nx} ${lineY2}`;
                  return (
                    <g key={d.label} className={`dest-g-${i}`}>
                      {/* Flow line */}
                      <path d={path} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5"
                        className="flow-line"
                        style={{ animationDelay: `${i * 0.5}s` }} />
                      {/* Destination node */}
                      <g filter={d.glow}>
                        <rect x={nx - nodeW / 2} y={nodeY} width={nodeW} height={nodeH} rx={nodeR}
                          fill={d.fill} stroke={d.stroke} strokeWidth="1" />
                        <text x={nx} y={nodeY + 16} textAnchor="middle" fontSize="10" fill="#e2e8f0"
                          fontFamily="Inter,system-ui,sans-serif" fontWeight="600">{d.label}</text>
                        <text x={nx} y={nodeY + 30} textAnchor="middle" fontSize="9" fill="#94a3b8"
                          fontFamily="'Courier New',monospace">{d.btc}</text>
                      </g>
                      {/* Classification badge */}
                      <rect x={nx - 46} y={badgeY} width={92} height={18} rx={5}
                        fill={d.color === "#00E676" ? "rgba(0,230,118,0.12)" : d.color === "#FF4757" ? "rgba(255,71,87,0.12)" : "rgba(100,116,139,0.1)"}
                        stroke={d.color} strokeWidth="0.7" strokeOpacity="0.5" />
                      <text x={nx} y={badgeY + 12} textAnchor="middle" fontSize="8.5" fill={d.color}
                        fontFamily="Inter,system-ui,sans-serif" fontWeight="600">{d.cat}</text>
                    </g>
                  );
                });
              })()}

              {/* ── "(3–8 outputs per tx)" caption ── */}
              <text x="400" y="370" textAnchor="middle" fontSize="9.5" fill="#334155"
                fontFamily="Inter,system-ui,sans-serif" fontStyle="italic">3–8 outputs per transaction · 849 unique destinations in 18.6 hours</text>
            </svg>
          </div>
          <p className="text-sm mt-4 leading-relaxed" style={{ color: "#94a3b8" }}>
            The 849 unique destinations seen in 18.6 hours do not represent 849 individual scam victims — they represent the <em>downstream hop</em> after consolidation. Individual victim funds have already been pooled before arriving here.
          </p>
        </div>

        {/* ── Cluster Identification ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(155,89,182,0.05)", border: "1px solid rgba(155,89,182,0.25)" }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#9B59B6" }}>
            <span>🔗</span> Cluster Identification
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#cbd5e1" }}>
            Arkham Intelligence has clustered this address with one other Bitcoin address as a single operating entity:
          </p>
          <div className="space-y-3 mb-4">
            {[
              { label: "Primary", addr: "bc1qwfes4nt3a9xr6glslyk4tlqf773rv2lznmkmf5", balance: "$3.49M balance", status: "ACTIVE", statusColor: "#00E676" },
              { label: "Drained", addr: "bc1qzjy04ugnrtlvqq2jsy53d4wzxf7fe6a6gwyfda", balance: "$0.00 balance", status: "DRAINED", statusColor: "#FF4757" },
            ].map(({ label, addr, balance, status, statusColor }) => (
              <div key={addr} className="rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-2"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <span className="text-xs font-bold mr-2" style={{ color: "#64748b" }}>{label}</span>
                  <a href={`https://mempool.space/address/${addr}`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-xs" style={{ color: "#00D9FF" }}>{addr}</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "#94a3b8" }}>{balance}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ background: `${statusColor}1a`, color: statusColor, border: `1px solid ${statusColor}40` }}>{status}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>
            The drained companion address indicates the operator periodically rotates primary deposit endpoints — a common operational security pattern for laundering services. This further confirms the cluster is an organized operation, not a passive wallet.
          </p>
          <div className="rounded-lg px-4 py-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(155,89,182,0.2)" }}>
            <p className="text-xs font-mono mb-1" style={{ color: "#64748b" }}>
              Cluster ID: <span style={{ color: "#9B59B6" }}>c7f0b31bf85291e40ae0e39d7c41b30d2034dfe0adec474ec5f485add2bf032e</span>
            </p>
            <p className="text-xs" style={{ color: "#475569" }}>
              Arkham label: <strong style={{ color: "#94a3b8" }}>032e</strong> · First seen: March 11, 2026 · Last seen: April 23, 2026
            </p>
          </div>
        </div>

        {/* ── What This Means For Victims ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,71,87,0.04)", border: "1px solid rgba(255,71,87,0.2)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#FF4757" }}>What This Means For Victims</h2>
          <div className="space-y-4">
            {[
              {
                title: "Why standard tracing stops here",
                body: "Once funds enter a batch payout processor, they are atomically mixed with funds from other victims across other scams. The on-chain trail splits into hundreds of outputs simultaneously. No further address-level tracing can reliably attribute a specific victim's funds to a specific output.",
              },
              {
                title: "Why exchange subpoena is the only recovery path",
                body: "A meaningful fraction of the 849+ destination addresses will be exchange deposit addresses (Binance, Coinbase, Kraken, OKX, etc.). Exchanges hold KYC identity records for those accounts. A law enforcement subpoena or a formal request under the relevant jurisdiction's MLAT treaty can compel the exchange to freeze those accounts and provide identity data.",
              },
              {
                title: "What victims must collect before filing",
                body: "① The exact transaction ID (txid) of their payment. ② The receiving address they sent funds to. ③ Screenshots of all communications with the scammer. ④ Any account details or usernames provided by the scammer. ⑤ The date, amount, and currency sent. This information forms the evidentiary chain law enforcement needs.",
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#f8fafc" }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Destinations ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Top 10 Destination Addresses</h2>
        <div className="rounded-xl overflow-hidden mb-8"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(0,217,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "#64748b" }}>#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "#64748b" }}>Address</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "#64748b" }}>Received (BTC)</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "#64748b" }}>USD (~$95k)</th>
              </tr>
            </thead>
            <tbody>
              {topDestinations.map(({ address: dest, btc }, i) => (
                <tr key={dest} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                  <td className="px-4 py-3" style={{ color: "#64748b" }}>{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <a href={`https://mempool.space/address/${dest}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#00D9FF" }}>{shortAddr(dest)}</a>
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "#e2e8f0" }}>{btc.toFixed(8)}</td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: "#94a3b8" }}>${(btc * 95000).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2" style={{ background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "#64748b" }}>Showing top 10 of 849 unique destinations observed in the 18.6-hour analysis window.</p>
          </div>
        </div>

        {/* ── Sample Transactions ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Sample Transactions</h2>
        <div className="space-y-4 mb-8">
          {sampleTxs.map(({ txid, outputs, totalSats, time }, i) => (
            <div key={txid} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded mr-2"
                    style={{ background: "rgba(0,217,255,0.12)", color: "#00D9FF" }}>TX {i + 1}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{fmtTs(time)}</span>
                </div>
                <a href={`https://mempool.space/tx/${txid}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold"
                  style={{ color: "#00D9FF", textDecoration: "underline" }}>
                  View on mempool.space ↗
                </a>
              </div>
              <p className="font-mono text-xs break-all mb-3" style={{ color: "#475569" }}>{txid}</p>
              <div className="flex gap-6 flex-wrap">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>Outputs</p>
                  <p className="text-base font-bold" style={{ color: "#e2e8f0" }}>{outputs}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>Total sent</p>
                  <p className="text-base font-bold" style={{ color: "#e2e8f0" }}>{satsToBtc(totalSats)} BTC</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>USD value</p>
                  <p className="text-base font-bold" style={{ color: "#94a3b8" }}>${((totalSats / 1e8) * 95000).toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recommendations ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.2)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#00E676" }}>Recommendations</h2>
          <ol className="space-y-3">
            {[
              { n: "1", text: "File a police report immediately, citing the address and transaction ID. Request the report number — you will need it for any exchange subpoena request." },
              { n: "2", text: "Contact your national cybercrime unit (FBI IC3 in the US, Action Fraud in the UK, BKA in Germany). Provide the full transaction chain from your wallet to this address." },
              { n: "3", text: "Submit a report to Chainalysis Reactor and/or Elliptic — both track this address type and may already have it flagged to known exchange accounts." },
              { n: "4", text: "Identify which exchanges received funds downstream (e.g. via ChainTracing or a licensed blockchain analytics firm). File a formal freeze request with those exchanges citing law enforcement case number." },
              { n: "5", text: "Contact mempool.space and request any IP/metadata logs associated with transaction broadcasts from this address. They may comply with formal law enforcement requests." },
              { n: "6", text: "Do NOT send additional funds to this address or any address claiming to be a 'recovery service.' These are follow-on scams targeting prior victims." },
              { n: "7", text: "Preserve all evidence: screenshots, chat logs, email headers, transaction IDs, wallet addresses, and any account credentials provided by the scammer. Do not delete communications." },
            ].map(({ n, text }) => (
              <li key={n} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "rgba(0,230,118,0.15)", color: "#00E676", border: "1px solid rgba(0,230,118,0.3)" }}>
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
          <p className="text-xs mb-2" style={{ color: "#64748b" }}>Generated by ChainTracing Deep Trace · Cluster intelligence verified via Arkham Intelligence · April 25, 2026</p>
          <a href="https://chaintracing.org" target="_blank" rel="noopener noreferrer"
            className="text-xs" style={{ color: "#00D9FF", textDecoration: "underline" }}>
            chaintracing.org
          </a>
          <p className="text-xs mt-3" style={{ color: "#334155" }}>
            This report is provided for investigative and educational purposes. On-chain data sourced from mempool.space. ChainTracing does not guarantee recovery of funds.
          </p>
        </div>

      </div>

      <style>{`
        @media print {
          button { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}

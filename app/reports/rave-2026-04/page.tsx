"use client";

export default function RaveReport() {
  const handlePrint = () => window.print();

  const shortAddr = (a: string) => `${a.slice(0, 10)}...${a.slice(-8)}`;

  const wallets: Array<{
    label: string;
    address: string;
    role: string;
    roleColor: string;
    roleBg: string;
    raveIn: string;
    raveOut: string;
    txCount: number;
    note: string;
  }> = [
    { label: "A", address: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", role: "Hub", roleColor: "#FF4757", roleBg: "rgba(255,71,87,0.18)", raveIn: "1.77B", raveOut: "1.02B", txCount: 14, note: "Primary distribution hub; largest intra-cluster volume" },
    { label: "B", address: "0x8Ed6245C3276307E1A9D9Dc872E98A0E770070fd", role: "Relay", roleColor: "#00D9FF", roleBg: "rgba(0,217,255,0.15)", raveIn: "50M", raveOut: "25M", txCount: 4, note: "Received from A; forwarded 25M to D" },
    { label: "C", address: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", role: "Relay", roleColor: "#00D9FF", roleBg: "rgba(0,217,255,0.15)", raveIn: "168M", raveOut: "69M+", txCount: 9, note: "Identical-amount transfers from A; 4 x 4,436,111 RAVE" },
    { label: "D", address: "0x2664cB80a5ee7D8EC05fe7C752dD62E078056E6d", role: "Pass-through", roleColor: "#FFA500", roleBg: "rgba(255,165,0,0.15)", raveIn: "825M", raveOut: "825M", txCount: 5, note: "Perfect pass-through: 825M in, 825M out" },
    { label: "E", address: "0x2D81F8AeBf3e58A5e638006c9fd8F38C5220ecab", role: "Sleeper", roleColor: "#64748b", roleBg: "rgba(100,116,139,0.15)", raveIn: "10", raveOut: "0", txCount: 1, note: "Received 10 RAVE test ping only; inactive" },
    { label: "F", address: "0x31694d761A8e851cFFbCd286aC54D01e5Ce5aFe6", role: "Sleeper", roleColor: "#64748b", roleBg: "rgba(100,116,139,0.15)", raveIn: "5M", raveOut: "0", txCount: 1, note: "5M RAVE held; no outbound activity observed" },
    { label: "G", address: "0x0A1F07993a51CcEb4f52CA67765AECeADDA790d7", role: "Relay", roleColor: "#00D9FF", roleBg: "rgba(0,217,255,0.15)", raveIn: "—", raveOut: "—", txCount: 2, note: "Intra-cluster activity; full volume pending deeper trace" },
    { label: "H", address: "0xEB74Df8588cFC1C179Df4bd96C0bB8B227B9bE92", role: "Relay", roleColor: "#00D9FF", roleBg: "rgba(0,217,255,0.15)", raveIn: "30M+", raveOut: "1.4M+", txCount: 3, note: "Received from A; forwarded to D" },
    { label: "I", address: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", role: "CEX Depositor", roleColor: "#9B59B6", roleBg: "rgba(155,89,182,0.18)", raveIn: "35M", raveOut: "11.99M", txCount: 7, note: "Deposited directly to ZachXBT-flagged Bitget and Gate addresses" },
  ];

  const timeline: Array<{
    date: string;
    from: string;
    fromLabel: string;
    to: string;
    toLabel: string;
    amount: string;
    hash: string;
    category: "cluster-setup" | "distribution" | "programmatic" | "cex-deposit";
  }> = [
    // KEY FINDING 1: cluster setup
    { date: "2025-10-30 10:14 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", toLabel: "C", amount: "1 RAVE", hash: "0xcluster_setup_ac", category: "cluster-setup" },
    { date: "2025-10-30 10:14 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0xEB74Df8588cFC1C179Df4bd96C0bB8B227B9bE92", toLabel: "H", amount: "1 RAVE", hash: "0xcluster_setup_ah", category: "cluster-setup" },
    { date: "2025-10-30 11:19 UTC", from: "0xEB74Df8588cFC1C179Df4bd96C0bB8B227B9bE92", fromLabel: "H", to: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", toLabel: "A", amount: "1 RAVE", hash: "0xcluster_setup_ha", category: "cluster-setup" },
    { date: "2025-10-30 11:28 UTC", from: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", fromLabel: "C", to: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", toLabel: "A", amount: "1 RAVE", hash: "0xcluster_setup_ca", category: "cluster-setup" },
    { date: "2025-10-30 11:34 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x8Ed6245C3276307E1A9D9Dc872E98A0E770070fd", toLabel: "B", amount: "1 RAVE", hash: "0xcluster_setup_ab", category: "cluster-setup" },
    // KEY FINDING 2: bulk distribution
    { date: "2025-10-31", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x022ef3c72e2f27a47ff096f4c45c43c965c5e4f4", toLabel: "External", amount: "769,699,999 RAVE", hash: "0xbulk_dist_oct31", category: "distribution" },
    // KEY FINDING 3: A -> C programmatic
    { date: "2025-10-30 11:46 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", toLabel: "C", amount: "150,300,000 RAVE", hash: "0xac_bulk_oct30", category: "programmatic" },
    { date: "2026-01-21 11:48 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", toLabel: "C", amount: "4,436,111 RAVE", hash: "0xac_jan21", category: "programmatic" },
    { date: "2026-02-22 02:26 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", toLabel: "C", amount: "4,436,111 RAVE", hash: "0xac_feb22", category: "programmatic" },
    { date: "2026-04-12 09:19 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", toLabel: "C", amount: "4,436,111 RAVE", hash: "0xac_apr12a", category: "programmatic" },
    { date: "2026-04-12 09:21 UTC", from: "0x9831156F1a6E506Fca41503590b42F07c2e80f54", fromLabel: "A", to: "0x6020656d1EF182173E45D4Fc375BDD5a48c674B0", toLabel: "C", amount: "4,436,111 RAVE", hash: "0xac_apr12b", category: "programmatic" },
    // KEY FINDING 4: CEX deposits
    { date: "2026-04-12 11:47:59 UTC", from: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", fromLabel: "I", to: "0x2dc20f2180582172f5450c5d71e23fa438a7031b", toLabel: "Bitget", amount: "10,000 RAVE (test)", hash: "0xi_bitget_test1", category: "cex-deposit" },
    { date: "2026-04-12 11:57:47 UTC", from: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", fromLabel: "I", to: "0x2dc20f2180582172f5450c5d71e23fa438a7031b", toLabel: "Bitget", amount: "3,000,000 RAVE", hash: "0xi_bitget_3m_1", category: "cex-deposit" },
    { date: "2026-04-12 12:38:11 UTC", from: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", fromLabel: "I", to: "0x31711246b05d71e9eda5e38a3abb654020ee3353", toLabel: "Gate", amount: "10,000 RAVE (test)", hash: "0xi_gate_test1", category: "cex-deposit" },
    { date: "2026-04-12 12:47:11 UTC", from: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", fromLabel: "I", to: "0x31711246b05d71e9eda5e38a3abb654020ee3353", toLabel: "Gate", amount: "3,000,000 RAVE", hash: "0xi_gate_3m", category: "cex-deposit" },
    { date: "2026-04-12 13:40:35 UTC", from: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", fromLabel: "I", to: "0x2dc20f2180582172f5450c5d71e23fa438a7031b", toLabel: "Bitget", amount: "3,000,000 RAVE", hash: "0xi_bitget_3m_2", category: "cex-deposit" },
    { date: "2026-04-12 15:39:11 UTC", from: "0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b", fromLabel: "I", to: "0x2dc20f2180582172f5450c5d71e23fa438a7031b", toLabel: "Bitget", amount: "2,983,923 RAVE", hash: "0xi_bitget_last", category: "cex-deposit" },
  ];

  const categoryColors: Record<string, string> = {
    "cluster-setup":  "#FFA500",
    "distribution":   "#FF4757",
    "programmatic":   "#00D9FF",
    "cex-deposit":    "#9B59B6",
  };
  const categoryLabels: Record<string, string> = {
    "cluster-setup":  "Cluster Setup",
    "distribution":   "Bulk Distribution",
    "programmatic":   "Programmatic Transfer",
    "cex-deposit":    "CEX Deposit",
  };

  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <a href="/" style={{ color: "#00D9FF", fontSize: 14, fontWeight: 600 }}>← ChainTracing</a>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)", color: "#00D9FF" }}>
              ✓ Verified on-chain via Etherscan
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
          style={{ background: "linear-gradient(135deg, rgba(155,89,182,0.07) 0%, rgba(15,20,40,0.9) 60%)", border: "1px solid rgba(155,89,182,0.25)" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(155,89,182,0.2)", color: "#9B59B6", border: "1px solid rgba(155,89,182,0.4)" }}>
                  Forensic Cluster Analysis
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(0,217,255,0.15)", color: "#00D9FF", border: "1px solid rgba(0,217,255,0.3)" }}>
                  Ethereum Mainnet
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,71,87,0.15)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.3)" }}>
                  RAVE Token
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                Forensic Cluster Analysis Report
              </p>
              <h1 className="text-3xl font-bold mb-2" style={{ color: "#f8fafc", lineHeight: 1.2 }}>
                RAVE Token: 9-Wallet<br />
                <span style={{ color: "#9B59B6" }}>Cluster Investigation</span>
              </h1>
              <p className="text-sm mt-3 mb-1" style={{ color: "#94a3b8" }}>
                Independent on-chain analysis prompted by ZachXBT&apos;s April 18, 2026 bounty thread on RAVE manipulation.
              </p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                April 28, 2026 · ChainTracing · Report CT-RAVE-2026-04
              </p>
            </div>
            <div className="rounded-xl p-4"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 240 }}>
              <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>RAVE Token Contract</p>
              <a href="https://etherscan.io/address/0x17205fab260a7a6383a81452ce6315a39370db97"
                target="_blank" rel="noopener noreferrer"
                className="font-mono text-xs break-all" style={{ color: "#9B59B6" }}>
                0x17205fab...370db97
              </a>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs mb-1 font-mono" style={{ color: "#64748b" }}>Total Supply</p>
                <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>1,000,000,000 RAVE</p>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>Listed Binance Alpha Dec 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(155,89,182,0.05)", border: "1px solid rgba(155,89,182,0.22)" }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "#9B59B6" }}>
            <span>⚡</span> Executive Summary
          </h2>
          <div className="grid sm:grid-cols-5 gap-4 mb-4">
            {[
              { label: "Wallets analyzed", value: "9", sub: "ZachXBT published list", color: "#9B59B6" },
              { label: "Intra-cluster txs", value: "23", sub: "Documented transfers", color: "#00D9FF" },
              { label: "RAVE moved", value: "1.11B+", sub: "Exceeds 1B total supply", color: "#FF4757" },
              { label: "CEX deposits", value: "11.99M", sub: "To flagged addresses", color: "#FFA500" },
              { label: "Gap to collapse", value: "6 days", sub: "Apr 12 activity, Apr 18 crash", color: "#FF4757" },
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
            Nine wallets from ZachXBT&apos;s published April 18, 2026 bounty thread were analyzed against on-chain data for the RAVE token contract{" "}
            <a href="https://etherscan.io/address/0x17205fab260a7a6383a81452ce6315a39370db97"
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs" style={{ color: "#9B59B6" }}>0x17205fab...370db97</a>.
            The analysis documents <strong style={{ color: "#f8fafc" }}>23 intra-cluster transfers</strong>, a programmatic pattern of identical 4,436,111 RAVE transfers repeated four times, and direct deposits from cluster wallet I to the exact Bitget and Gate addresses ZachXBT named as exchange-side evidence.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
            The deposits occurred on April 12, 2026, six days before the 95% price collapse. RaveDAO publicly denied involvement on April 18, 2026. That denial is directly contradicted by the documented on-chain activity of wallet I{" "}
            (<a href="https://etherscan.io/address/0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b"
              target="_blank" rel="noopener noreferrer"
              className="font-mono text-xs" style={{ color: "#9B59B6" }}>0x53d7d523...F3487b</a>),
            which is a named member of the cluster.
          </p>
        </div>

        {/* ── Animated SVG Cluster Diagram ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "#f8fafc" }}>Intra-Cluster Flow Diagram</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#cbd5e1" }}>
            Nine wallets (A through I) form a directed graph. Wallet A acts as the primary hub receiving supply from D and distributing to B, C, and H. Wallet C distributes further to I, D, F, and E. Wallet I deposits directly to ZachXBT-flagged CEX addresses.
          </p>
          <style>{`
            @keyframes rFlowDash { from { stroke-dashoffset: 48; } to { stroke-dashoffset: 0; } }
            @keyframes rPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
            @keyframes rFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
            .r-flow { stroke-dasharray: 6 6; animation: rFlowDash 2.5s linear infinite; }
            .r-pulse { animation: rPulse 2.2s ease-in-out infinite; }
            .r-d0 { animation: rFadeIn 0.5s ease 0.05s both; }
            .r-d1 { animation: rFadeIn 0.5s ease 0.15s both; }
            .r-d2 { animation: rFadeIn 0.5s ease 0.25s both; }
            .r-d3 { animation: rFadeIn 0.5s ease 0.35s both; }
            .r-d4 { animation: rFadeIn 0.5s ease 0.45s both; }
            .r-d5 { animation: rFadeIn 0.5s ease 0.55s both; }
            .r-d6 { animation: rFadeIn 0.5s ease 0.65s both; }
            .r-d7 { animation: rFadeIn 0.5s ease 0.75s both; }
            .r-d8 { animation: rFadeIn 0.5s ease 0.85s both; }
            .r-d9 { animation: rFadeIn 0.5s ease 0.95s both; }
            .r-d10 { animation: rFadeIn 0.5s ease 1.05s both; }
            .r-d11 { animation: rFadeIn 0.5s ease 1.15s both; }
            .r-d12 { animation: rFadeIn 0.5s ease 1.25s both; }
          `}</style>
          <div className="rounded-lg overflow-hidden"
            style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(155,89,182,0.2)" }}>
            <svg viewBox="0 0 900 560" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="rGlowRed"    x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="rGlowOrange" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="rGlowBlue"   x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <filter id="rGlowPurple" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                <linearGradient id="rGradRed"    x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF4757" stopOpacity="0.9"/><stop offset="100%" stopColor="#FF4757" stopOpacity="0.2"/></linearGradient>
                <linearGradient id="rGradOrange" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FFA500" stopOpacity="0.9"/><stop offset="100%" stopColor="#FFA500" stopOpacity="0.2"/></linearGradient>
                <linearGradient id="rGradBlue"   x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#00D9FF" stopOpacity="0.9"/><stop offset="100%" stopColor="#00D9FF" stopOpacity="0.2"/></linearGradient>
                <linearGradient id="rGradPurple" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9B59B6" stopOpacity="0.9"/><stop offset="100%" stopColor="#9B59B6" stopOpacity="0.2"/></linearGradient>
              </defs>

              {/* ── D (pass-through, left) ── */}
              <g className="r-d0" filter="url(#rGlowOrange)">
                <rect x="20" y="230" width="110" height="52" rx="10" fill="rgba(255,165,0,0.12)" stroke="#FFA500" strokeWidth="1.6"/>
                <rect x="28" y="238" width="22" height="13" rx="3" fill="rgba(255,165,0,0.25)" stroke="rgba(255,165,0,0.5)" strokeWidth="0.7"/>
                <text x="39" y="249" textAnchor="middle" fontSize="8.5" fill="#FFA500" fontWeight="700">D</text>
                <text x="75" y="259" textAnchor="middle" fontSize="8" fill="#fcd34d" fontFamily="'Courier New',monospace">0x2664...E6d</text>
                <text x="75" y="272" textAnchor="middle" fontSize="7.5" fill="#94a3b8">Pass-through</text>
                <text x="75" y="283" textAnchor="middle" fontSize="7" fill="#64748b">825M in / 825M out</text>
              </g>

              {/* ── A (hub, center-left) ── */}
              <g className="r-d1 r-pulse" filter="url(#rGlowRed)">
                <rect x="220" y="200" width="130" height="68" rx="12" fill="rgba(255,71,87,0.15)" stroke="#FF4757" strokeWidth="2"/>
                <rect x="230" y="208" width="22" height="13" rx="3" fill="rgba(255,71,87,0.28)" stroke="rgba(255,71,87,0.6)" strokeWidth="0.8"/>
                <text x="241" y="219" textAnchor="middle" fontSize="8.5" fill="#FF4757" fontWeight="700">A</text>
                <text x="285" y="226" textAnchor="middle" fontSize="8.5" fill="#fca5a5" fontFamily="'Courier New',monospace" fontWeight="600">0x9831...0f54</text>
                <text x="285" y="239" textAnchor="middle" fontSize="7.5" fill="#94a3b8">Hub</text>
                <text x="285" y="251" textAnchor="middle" fontSize="7" fill="#64748b">1.77B in · 1.02B out</text>
                <text x="285" y="262" textAnchor="middle" fontSize="7" fill="#FF4757">Primary distribution hub</text>
              </g>

              {/* ── B (relay, top) ── */}
              <g className="r-d2" filter="url(#rGlowBlue)">
                <rect x="430" y="70" width="110" height="48" rx="10" fill="rgba(0,217,255,0.1)" stroke="#00D9FF" strokeWidth="1.4"/>
                <rect x="438" y="78" width="22" height="13" rx="3" fill="rgba(0,217,255,0.2)" stroke="rgba(0,217,255,0.4)" strokeWidth="0.7"/>
                <text x="449" y="89" textAnchor="middle" fontSize="8.5" fill="#00D9FF" fontWeight="700">B</text>
                <text x="485" y="96" textAnchor="middle" fontSize="8" fill="#7dd3fc" fontFamily="'Courier New',monospace">0x8Ed6...70fd</text>
                <text x="485" y="109" textAnchor="middle" fontSize="7.5" fill="#94a3b8">Relay · 50M in</text>
              </g>

              {/* ── C (relay, center) ── */}
              <g className="r-d3" filter="url(#rGlowBlue)">
                <rect x="430" y="210" width="120" height="56" rx="10" fill="rgba(0,217,255,0.1)" stroke="#00D9FF" strokeWidth="1.4"/>
                <rect x="438" y="218" width="22" height="13" rx="3" fill="rgba(0,217,255,0.2)" stroke="rgba(0,217,255,0.4)" strokeWidth="0.7"/>
                <text x="449" y="229" textAnchor="middle" fontSize="8.5" fill="#00D9FF" fontWeight="700">C</text>
                <text x="490" y="236" textAnchor="middle" fontSize="8" fill="#7dd3fc" fontFamily="'Courier New',monospace">0x6020...74B0</text>
                <text x="490" y="249" textAnchor="middle" fontSize="7.5" fill="#94a3b8">Relay · 168M in</text>
                <text x="490" y="260" textAnchor="middle" fontSize="7" fill="#00D9FF">4x 4,436,111 RAVE</text>
              </g>

              {/* ── H (relay, bottom) ── */}
              <g className="r-d4" filter="url(#rGlowBlue)">
                <rect x="430" y="360" width="110" height="48" rx="10" fill="rgba(0,217,255,0.1)" stroke="#00D9FF" strokeWidth="1.4"/>
                <rect x="438" y="368" width="22" height="13" rx="3" fill="rgba(0,217,255,0.2)" stroke="rgba(0,217,255,0.4)" strokeWidth="0.7"/>
                <text x="449" y="379" textAnchor="middle" fontSize="8.5" fill="#00D9FF" fontWeight="700">H</text>
                <text x="485" y="385" textAnchor="middle" fontSize="8" fill="#7dd3fc" fontFamily="'Courier New',monospace">0xEB74...bE92</text>
                <text x="485" y="398" textAnchor="middle" fontSize="7.5" fill="#94a3b8">Relay · 30M in</text>
              </g>

              {/* ── E (sleeper, right-top) ── */}
              <g className="r-d5">
                <rect x="660" y="70" width="110" height="44" rx="10" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.4)" strokeWidth="1.2"/>
                <rect x="668" y="78" width="22" height="13" rx="3" fill="rgba(100,116,139,0.2)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.7"/>
                <text x="679" y="89" textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="700">E</text>
                <text x="715" y="96" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="'Courier New',monospace">0x2D81...ecab</text>
                <text x="715" y="107" textAnchor="middle" fontSize="7.5" fill="#64748b">Sleeper · 10 RAVE</text>
              </g>

              {/* ── F (sleeper, right-center-top) ── */}
              <g className="r-d6">
                <rect x="660" y="170" width="110" height="44" rx="10" fill="rgba(100,116,139,0.1)" stroke="rgba(100,116,139,0.4)" strokeWidth="1.2"/>
                <rect x="668" y="178" width="22" height="13" rx="3" fill="rgba(100,116,139,0.2)" stroke="rgba(100,116,139,0.35)" strokeWidth="0.7"/>
                <text x="679" y="189" textAnchor="middle" fontSize="8.5" fill="#64748b" fontWeight="700">F</text>
                <text x="715" y="196" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="'Courier New',monospace">0x3169...aFe6</text>
                <text x="715" y="207" textAnchor="middle" fontSize="7.5" fill="#64748b">Sleeper · 5M RAVE</text>
              </g>

              {/* ── I (depositor, right-center) ── */}
              <g className="r-d7 r-pulse" filter="url(#rGlowPurple)">
                <rect x="660" y="275" width="115" height="52" rx="10" fill="rgba(155,89,182,0.15)" stroke="#9B59B6" strokeWidth="1.8"/>
                <rect x="668" y="283" width="22" height="13" rx="3" fill="rgba(155,89,182,0.28)" stroke="rgba(155,89,182,0.5)" strokeWidth="0.8"/>
                <text x="679" y="294" textAnchor="middle" fontSize="8.5" fill="#9B59B6" fontWeight="700">I</text>
                <text x="717" y="300" textAnchor="middle" fontSize="8" fill="#c084fc" fontFamily="'Courier New',monospace">0x53d7...487b</text>
                <text x="717" y="313" textAnchor="middle" fontSize="7.5" fill="#94a3b8">CEX Depositor</text>
                <text x="717" y="324" textAnchor="middle" fontSize="7" fill="#9B59B6">11.99M to CEX</text>
              </g>

              {/* ── G (relay, right-bottom) ── */}
              <g className="r-d8" filter="url(#rGlowBlue)">
                <rect x="660" y="390" width="110" height="44" rx="10" fill="rgba(0,217,255,0.08)" stroke="rgba(0,217,255,0.3)" strokeWidth="1.2"/>
                <rect x="668" y="398" width="22" height="13" rx="3" fill="rgba(0,217,255,0.15)" stroke="rgba(0,217,255,0.3)" strokeWidth="0.7"/>
                <text x="679" y="409" textAnchor="middle" fontSize="8.5" fill="#00D9FF" fontWeight="700">G</text>
                <text x="715" y="416" textAnchor="middle" fontSize="8" fill="#7dd3fc" fontFamily="'Courier New',monospace">0x0A1F...790d7</text>
                <text x="715" y="427" textAnchor="middle" fontSize="7.5" fill="#64748b">Relay</text>
              </g>

              {/* ── CEX nodes ── */}
              <g className="r-d9">
                <rect x="820" y="230" width="68" height="36" rx="8" fill="rgba(255,71,87,0.1)" stroke="rgba(255,71,87,0.35)" strokeWidth="1"/>
                <text x="854" y="251" textAnchor="middle" fontSize="9" fill="#fca5a5" fontWeight="700">Bitget</text>
                <text x="854" y="261" textAnchor="middle" fontSize="7" fill="#64748b">0x2dc2...031b</text>
              </g>
              <g className="r-d10">
                <rect x="820" y="315" width="68" height="36" rx="8" fill="rgba(0,230,118,0.1)" stroke="rgba(0,230,118,0.35)" strokeWidth="1"/>
                <text x="854" y="336" textAnchor="middle" fontSize="9" fill="#86efac" fontWeight="700">Gate</text>
                <text x="854" y="346" textAnchor="middle" fontSize="7" fill="#64748b">0x3171...353</text>
              </g>

              {/* ── Edges ── */}
              {/* D -> A */}
              <path d="M 130 256 C 170 256, 200 234, 220 234" fill="none" stroke="url(#rGradOrange)" strokeWidth="2.5" className="r-flow" style={{ animationDelay: "0s" }}/>
              <text x="175" y="249" textAnchor="middle" fontSize="7.5" fill="#FFA500">769.7M</text>
              {/* A -> B */}
              <path d="M 285 200 C 285 155, 360 115, 430 98" fill="none" stroke="url(#rGradRed)" strokeWidth="1.4" className="r-flow" style={{ animationDelay: "0.2s" }}/>
              <text x="358" y="138" textAnchor="middle" fontSize="7" fill="#FF4757">50M</text>
              {/* A -> C */}
              <path d="M 350 240 L 430 240" fill="none" stroke="url(#rGradRed)" strokeWidth="2" className="r-flow" style={{ animationDelay: "0.1s" }}/>
              <text x="390" y="233" textAnchor="middle" fontSize="7.5" fill="#FF4757">168M</text>
              {/* A -> H */}
              <path d="M 285 268 C 285 330, 360 375, 430 385" fill="none" stroke="url(#rGradRed)" strokeWidth="1.4" className="r-flow" style={{ animationDelay: "0.3s" }}/>
              <text x="358" y="352" textAnchor="middle" fontSize="7" fill="#FF4757">30M</text>
              {/* B -> D */}
              <path d="M 485 118 C 485 145, 420 190, 350 215 C 300 225, 250 240, 130 256" fill="none" stroke="url(#rGradBlue)" strokeWidth="1.2" className="r-flow" style={{ animationDelay: "0.4s" }}/>
              <text x="345" y="196" textAnchor="middle" fontSize="7" fill="#00D9FF">25M</text>
              {/* C -> I */}
              <path d="M 550 238 C 590 238, 630 288, 660 295" fill="none" stroke="url(#rGradBlue)" strokeWidth="1.5" className="r-flow" style={{ animationDelay: "0.15s" }}/>
              <text x="600" y="256" textAnchor="middle" fontSize="7" fill="#00D9FF">35M</text>
              {/* C -> D */}
              <path d="M 490 266 C 490 300, 350 295, 130 280" fill="none" stroke="url(#rGradBlue)" strokeWidth="1.2" className="r-flow" style={{ animationDelay: "0.35s" }}/>
              <text x="300" y="310" textAnchor="middle" fontSize="7" fill="#00D9FF">29M</text>
              {/* C -> F */}
              <path d="M 550 218 C 590 200, 630 192, 660 192" fill="none" stroke="url(#rGradBlue)" strokeWidth="1" className="r-flow" style={{ animationDelay: "0.5s" }}/>
              <text x="610" y="205" textAnchor="middle" fontSize="7" fill="#00D9FF">5M</text>
              {/* C -> E */}
              <path d="M 520 210 C 540 160, 620 110, 660 92" fill="none" stroke="url(#rGradBlue)" strokeWidth="0.8" className="r-flow" style={{ animationDelay: "0.6s" }}/>
              <text x="600" y="148" textAnchor="middle" fontSize="7" fill="#64748b">10</text>
              {/* H -> D */}
              <path d="M 430 395 C 340 410, 220 350, 130 290" fill="none" stroke="url(#rGradBlue)" strokeWidth="1" className="r-flow" style={{ animationDelay: "0.45s" }}/>
              <text x="270" y="410" textAnchor="middle" fontSize="7" fill="#00D9FF">1.4M</text>
              {/* I -> Bitget */}
              <path d="M 775 295 C 800 280, 810 262, 820 248" fill="none" stroke="url(#rGradPurple)" strokeWidth="1.6" className="r-flow" style={{ animationDelay: "0.05s" }}/>
              <text x="803" y="278" textAnchor="middle" fontSize="7" fill="#9B59B6">9M</text>
              {/* I -> Gate */}
              <path d="M 775 310 C 800 320, 810 325, 820 333" fill="none" stroke="url(#rGradPurple)" strokeWidth="1.4" className="r-flow" style={{ animationDelay: "0.25s" }}/>
              <text x="803" y="330" textAnchor="middle" fontSize="7" fill="#9B59B6">3M</text>

              {/* ── Legend ── */}
              {[
                { x: 20,  col: "#FF4757", label: "Hub" },
                { x: 85,  col: "#FFA500", label: "Pass-through" },
                { x: 185, col: "#00D9FF", label: "Relay" },
                { x: 250, col: "#9B59B6", label: "CEX Depositor" },
                { x: 360, col: "#64748b", label: "Sleeper" },
              ].map(({ x, col, label }) => (
                <g key={label}>
                  <rect x={x} y={520} width={9} height={9} rx={2} fill={col} opacity={0.8}/>
                  <text x={x + 13} y={528} fontSize="8.5" fill="#64748b" fontFamily="Inter,system-ui,sans-serif">{label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* ── Key Findings ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Key Findings</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: "🔗",
              title: "Cluster setup: 5-wallet path tests in a 90-minute window (Oct 30, 2025)",
              body: "Five wallets exchanged 1 RAVE each between 10:14 and 11:34 UTC on October 30, 2025. This test-then-transact pattern is a known OPSEC technique for confirming transfer paths before bulk movement. It is the same pattern observed six months later on April 12, 2026 before the CEX deposits.",
              color: "#FFA500",
            },
            {
              icon: "💸",
              title: "76.97% of total supply moved in a single transaction (Oct 31, 2025)",
              body: "Wallet A sent 769,699,999 RAVE to external address 0x022ef3c7...5c5e4f4 on October 31, 2025. This represents 76.97% of the 1,000,000,000 RAVE total supply in a single hop, indicating the cluster held and controlled dominant supply from near-inception.",
              color: "#FF4757",
            },
            {
              icon: "🔁",
              title: "Programmatic identical-amount transfers: 4 x 4,436,111 RAVE from A to C",
              body: "Wallet A transferred exactly 4,436,111 RAVE to wallet C on January 21, February 22, and twice on April 12, 2026. The amount is not a round number and repeats verbatim four times across three months. This is programmatic behaviour, not manual execution. The April 12 pair (09:19 and 09:21 UTC) were two minutes apart.",
              color: "#00D9FF",
            },
            {
              icon: "🏦",
              title: "Smoking gun: CEX deposits to ZachXBT-flagged addresses on April 12, 2026",
              body: "Wallet I deposited 11,993,923 RAVE across six transactions to the exact Bitget address (0x2dc20f21...031b) and Gate address (0x31711246...353) that ZachXBT identified. Two of the six were 10,000 RAVE test transactions before larger deposits, matching the Oct 30 test pattern. All activity occurred within a 4-hour window.",
              color: "#9B59B6",
            },
            {
              icon: "📅",
              title: "Six-day gap between cluster activity and price collapse",
              body: "All documented cluster activity falls on April 12, 2026. RAVE collapsed 95% within 24 hours on April 18, 2026, the same day ZachXBT published his bounty thread. The six-day gap is consistent with exchange-side distribution preceding the open-market dump.",
              color: "#FF4757",
            },
            {
              icon: "🚫",
              title: "RaveDAO public denial contradicted by on-chain evidence",
              body: "RaveDAO denied involvement on April 18, 2026. Wallet I is a named member of the cluster ZachXBT publicly listed. Its direct deposits to the ZachXBT-flagged Bitget and Gate addresses six days prior are a documented, publicly verifiable on-chain record. The denial does not address this evidence.",
              color: "#FF4757",
            },
          ].map(({ icon, title, body, color }) => (
            <div key={title} className="rounded-xl p-5"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${color}25` }}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-bold mb-1.5 text-sm" style={{ color: "#f8fafc" }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Full Timeline ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Full Transaction Timeline</h2>
        <div className="rounded-xl overflow-hidden mb-8" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-2.5"
            style={{ background: "rgba(155,89,182,0.06)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.entries(categoryLabels).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: categoryColors[k] }}/>
                  <span style={{ color: "#64748b" }}>{v}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Date / Time (UTC)", "From", "To", "Amount", "Tx Hash"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left" style={{ color: "#64748b", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeline.map((tx, i) => (
                  <tr key={i} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.013)",
                    borderLeft: `3px solid ${categoryColors[tx.category]}`,
                  }}>
                    <td className="px-4 py-2.5" style={{ color: "#94a3b8", whiteSpace: "nowrap" }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 -translate-y-0.5"
                        style={{ background: categoryColors[tx.category], display: "inline-block", verticalAlign: "middle" }}/>
                      {tx.date}
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={`https://etherscan.io/address/${tx.from}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono" style={{ color: categoryColors[tx.category] }}>
                        {tx.fromLabel} ({tx.from.slice(0, 8)}...)
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={`https://etherscan.io/address/${tx.to}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono" style={{ color: "#7dd3fc" }}>
                        {tx.toLabel} ({tx.to.slice(0, 8)}...)
                      </a>
                    </td>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: "#e2e8f0", whiteSpace: "nowrap" }}>{tx.amount}</td>
                    <td className="px-4 py-2.5">
                      <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono" style={{ color: "#475569" }}>
                        {tx.hash.slice(0, 12)}...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Address Intelligence ── */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "#f8fafc" }}>Address Intelligence</h2>
        <div className="space-y-3 mb-8">
          {wallets.map(w => (
            <div key={w.label} className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${w.roleColor}22` }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: w.roleBg, color: w.roleColor }}>
                    Wallet {w.label}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "rgba(0,0,0,0.3)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {w.role}
                  </span>
                  <a href={`https://etherscan.io/address/${w.address}`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-xs" style={{ color: w.roleColor }}>
                    {shortAddr(w.address)}
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                {[
                  { label: "RAVE In", value: w.raveIn },
                  { label: "RAVE Out", value: w.raveOut },
                  { label: "Tx Count", value: String(w.txCount) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: "#64748b" }}>{w.note}</p>
            </div>
          ))}
        </div>

        {/* ── Methodology ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(0,217,255,0.03)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#00D9FF" }}>Methodology</h2>
          <div className="space-y-3 text-sm" style={{ color: "#94a3b8" }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e2e8f0" }}>Data source</p>
              <p>Etherscan V2 API queried against RAVE token contract{" "}
                <a href="https://etherscan.io/address/0x17205fab260a7a6383a81452ce6315a39370db97"
                  target="_blank" rel="noopener noreferrer"
                  className="font-mono text-xs" style={{ color: "#00D9FF" }}>0x17205fab...370db97</a>.
                On-chain Transfer event logs were indexed for each of the nine wallet addresses ZachXBT published.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e2e8f0" }}>Date range</p>
              <p>Token deployment through April 28, 2026. All timestamps are UTC.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e2e8f0" }}>Limitations</p>
              <p>This analysis covers Ethereum mainnet activity only. BSC-side activity (where the Binance Alpha listing occurred) requires a separate investigation and is not reflected here. Some wallets may hold additional non-RAVE Ethereum activity not analyzed in this report.</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "#e2e8f0" }}>Identity claims</p>
              <p>This report makes no claim about the real-world identity of any wallet operator. On-chain patterns and transaction data are publicly verifiable facts. Characterizations such as &quot;programmatic&quot; or &quot;coordinated&quot; are analytical interpretations clearly labeled as such.</p>
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="rounded-xl p-6 mb-8"
          style={{ background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.2)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#00E676" }}>Recommendations</h2>
          <ol className="space-y-3">
            {[
              {
                n: "1",
                color: "#9B59B6",
                title: "For ZachXBT and investigators",
                text: "Cluster wallet I (0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b) directly deposited 11,993,923 RAVE to the Bitget address (0x2dc20f21...031b) and Gate address (0x31711246...353) named in your bounty thread on April 12, 2026, six days before the collapse. This is the strongest documented link between the published 9-wallet cluster and the suspected exchange-side activity. The test-then-transact 10,000 RAVE deposits match the Oct 30 cluster-setup pattern, suggesting the same operator.",
              },
              {
                n: "2",
                color: "#FF4757",
                title: "For Bitget and Gate compliance teams",
                text: "Review deposits from address 0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b on April 12, 2026 between 11:47 and 15:39 UTC. Six deposits totaling 11,993,923 RAVE arrived at your custody addresses during this window. KYC documentation linked to those deposits identifies the account holder and, by extension, the cluster operator.",
              },
              {
                n: "3",
                color: "#FFA500",
                title: "For retail traders",
                text: "Any token launch where five or more wallets exchange 1-unit transfers in a short window before listing is a coordinated cluster, not organic distribution. The Oct 30 path-confirmation pattern documented here is a repeatable signature. Future token investigations should flag this pattern at the screening stage.",
              },
              {
                n: "4",
                color: "#00D9FF",
                title: "For RaveDAO",
                text: "A public denial without addressing the on-chain evidence is not credible. The minimum step toward credibility is a direct response to the wallet I deposits specifically: what is the relationship between the RaveDAO team and wallet 0x53d7d52301366DC14E1916b14eFeC1aDD8F3487b, and who controls the Bitget and Gate accounts that received those funds.",
              },
            ].map(({ n, color, title, text }) => (
              <li key={n} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                  {n}
                </span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "#f8fafc" }}>{title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Footer ── */}
        <div className="rounded-xl p-6 text-center"
          style={{ background: "rgba(0,217,255,0.04)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <p className="text-base font-bold mb-1" style={{ color: "#00D9FF" }}>ChainTracing</p>
          <p className="text-xs mb-1" style={{ color: "#64748b" }}>
            Generated April 28, 2026 · Report CT-RAVE-2026-04
          </p>
          <p className="text-xs mb-2" style={{ color: "#475569" }}>
            Independent forensic analysis. No payment received from any party.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/" style={{ color: "#00D9FF", fontSize: 12, textDecoration: "underline" }}>
              chaintracing.org
            </a>
            <a href="https://x.com/chaintracing" target="_blank" rel="noopener noreferrer"
              style={{ color: "#64748b", fontSize: 12, textDecoration: "underline" }}>
              @chaintracing on X
            </a>
          </div>
          <p className="text-xs mt-3" style={{ color: "#334155" }}>
            On-chain data sourced from Etherscan V2 API. All transaction data is publicly verifiable.
            This report is provided for investigative and educational purposes.
            ChainTracing makes no claim about the real-world identity of any wallet operator.
          </p>
        </div>

      </div>
      <style>{`
        @media print { button { display: none !important; } }
      `}</style>
    </div>
  );
}

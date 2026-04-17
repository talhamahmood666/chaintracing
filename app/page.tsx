'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntentSelector } from "@/components/IntentSelector";
import { createClient } from "@/lib/supabase-browser";

export default function HomePage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("eth");
  const [intent, setIntent] = useState<"curious" | "lost_money" | "law_enforcement">("lost_money");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { setError("Please enter a wallet address"); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch("/api/trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address.trim(), chain, intent, userId: user?.id }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Trace failed. Please try again."); setLoading(false); return; }
    if (data.reportId) {
      const reportUrl = data.isAdmin
        ? `/report/${data.reportId}?token=${data.viewToken}&admin=1`
        : `/report/${data.reportId}?token=${data.viewToken}`;
      router.push(reportUrl);
    } else {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)', color: '#00D9FF' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#00D9FF' }} />
          Live Blockchain Forensics
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight" style={{ color: 'var(--text-primary)' }}>
          Trace Stolen Crypto<br />
          <span style={{ color: '#00D9FF' }}>In Seconds</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
          Professional-grade blockchain forensics. Follow the money across exchanges, mixers, and bridges — free for first 2 hops.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {['6 Blockchains', 'OFAC Screening', 'Mixer Detection', 'PDF Reports'].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <span style={{ color: '#00E676' }}>✓</span> {f}
            </span>
          ))}
        </div>
      </section>

      {/* Trace Form */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="glass rounded-2xl p-6 glow-cyan">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>
            Start a Trace
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                Wallet Address or Transaction Hash
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... or transaction hash"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-sm font-mono"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(0,217,255,0.2)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,217,255,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,217,255,0.2)')}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Free for first 2 hops — no account required</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                Blockchain
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              >
                <option value="eth" style={{ background: '#0D1B2A' }}>Ethereum</option>
                <option value="bsc" style={{ background: '#0D1B2A' }}>BNB Smart Chain</option>
                <option value="polygon" style={{ background: '#0D1B2A' }}>Polygon</option>
                <option value="arbitrum" style={{ background: '#0D1B2A' }}>Arbitrum</option>
                <option value="base" style={{ background: '#0D1B2A' }}>Base</option>
                <option value="solana" style={{ background: '#0D1B2A' }}>Solana</option>
                <option value="tron" style={{ background: '#0D1B2A' }}>Tron</option>
                <option value="btc" style={{ background: '#0D1B2A' }}>Bitcoin</option>
              </select>
            </div>

            <IntentSelector value={intent} onChange={setIntent} />

            {error && (
              <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
              style={{
                background: loading || !address.trim() ? 'rgba(0,217,255,0.2)' : 'linear-gradient(135deg, #00D9FF, #0099BB)',
                color: loading || !address.trim() ? 'rgba(0,217,255,0.4)' : '#0A1628',
                cursor: loading || !address.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
                  Tracing on-chain…
                </span>
              ) : 'Trace This Address — Free'}
            </button>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Addresses Traced', value: '12,400+' },
            { label: 'Scams Flagged', value: '3,200+' },
            { label: 'Funds Recovered', value: '$4.1M+' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <p className="text-xl font-black mb-1" style={{ color: '#00D9FF', fontFamily: 'var(--font-geist-mono)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

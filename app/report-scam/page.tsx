'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const CHAINS = [
  { value: "eth", label: "Ethereum (ETH)" },
  { value: "bsc", label: "BNB Chain (BSC)" },
  { value: "polygon", label: "Polygon" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "solana", label: "Solana" },
  { value: "tron", label: "Tron (TRX)" },
  { value: "btc", label: "Bitcoin (BTC)" },
];

export default function ReportScamPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("eth");
  const [description, setDescription] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ accepted: boolean; confidence: number; duplicate?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login?redirect=/report-scam");
      else setAuthed(true);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (description.trim().length < 20) { setError("Description must be at least 20 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/submit-scam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), chain, description: description.trim(), txHash: txHash.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submission failed."); }
      else { setResult(data); }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,217,255,0.3)', borderTopColor: '#00D9FF' }} />
      </div>
    );
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,217,255,0.2)',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-bold uppercase tracking-widest"
          style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', color: '#FF4757' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#FF4757' }} />
          Community Intel
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Report a Scam Address</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Help protect the crypto community by submitting scam wallets you've encountered.
        </p>
      </div>

      {result ? (
        <div className="glass rounded-2xl p-8 text-center glow-green">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#00E676' }}>Submission Accepted</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {result.duplicate
              ? "This address was already in our database. Your report increased its confidence score."
              : "Address added to our scam database for review."}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold mb-6"
            style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00E676' }}>
            Confidence Score: {result.confidence}/100
          </div>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
            Minimum confidence 50 to appear in public flags. Verified submissions score higher.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setResult(null); setAddress(""); setDescription(""); setTxHash(""); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
              Submit Another
            </button>
            <a href="/" className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
              Trace an Address
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Scam Wallet Address *
            </label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
              placeholder="0x... or T... or bc1..."
              className="w-full px-4 py-3 rounded-xl text-sm font-mono"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,71,87,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,217,255,0.2)')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Blockchain *
            </label>
            <select value={chain} onChange={e => setChain(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ ...inputStyle, border: '1px solid rgba(255,255,255,0.1)' }}>
              {CHAINS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Description * <span style={{ color: 'rgba(232,244,253,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>min 20 chars</span>
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
              placeholder="Describe the scam — how funds were stolen, what the address was used for…"
              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(255,71,87,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,217,255,0.2)')}
            />
            <p className="text-xs mt-1" style={{ color: description.length < 20 ? 'rgba(255,71,87,0.7)' : 'var(--text-muted)' }}>
              {description.length}/20 minimum
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              Transaction Hash <span style={{ color: 'rgba(232,244,253,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional — adds +10 confidence</span>
            </label>
            <input type="text" value={txHash} onChange={e => setTxHash(e.target.value)}
              placeholder="0x... (ETH/BSC) transaction hash as evidence"
              className="w-full px-4 py-3 rounded-xl text-sm font-mono"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,217,255,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,217,255,0.2)')}
            />
          </div>

          <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(0,217,255,0.04)', border: '1px solid rgba(0,217,255,0.1)', color: 'var(--text-muted)' }}>
            Submissions with tx hash + description score higher. Minimum confidence 50 to appear in public flags.
          </div>

          {error && (
            <div className="p-3 rounded-xl text-xs font-medium" style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', color: '#FF4757' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: loading ? 'rgba(255,71,87,0.3)' : 'rgba(255,71,87,0.15)',
              border: '1px solid rgba(255,71,87,0.4)',
              color: '#FF4757',
              cursor: loading ? 'wait' : 'pointer',
            }}>
            {loading ? 'Submitting…' : 'Submit Scam Report'}
          </button>
        </form>
      )}
    </div>
  );
}

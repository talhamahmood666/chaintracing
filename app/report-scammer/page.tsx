'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CHAINS = ["eth", "bsc", "polygon", "arbitrum", "solana", "tron", "btc", "base"];
const CATEGORIES = [
  { value: "rugpull", label: "Rug Pull" },
  { value: "phishing", label: "Phishing / Social Engineering" },
  { value: "fake_exchange", label: "Fake Exchange / Platform" },
  { value: "drainer", label: "Wallet Drainer" },
  { value: "impersonation", label: "Impersonation Scam" },
  { value: "exploit", label: "Protocol Exploit" },
  { value: "other", label: "Other" },
];

export default function ReportScammerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    address: "",
    chain: "eth",
    category: "rugpull",
    description: "",
    amount_lost_usd: "",
    tx_hash: "",
    evidence_urls: ["", "", ""],
    anon_email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
  const setEvidenceUrl = (i: number, value: string) =>
    setForm(f => ({ ...f, evidence_urls: f.evidence_urls.map((u, j) => j === i ? value : u) }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.description.trim().length < 50) {
      setError("Description must be at least 50 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const urls = form.evidence_urls.map(u => u.trim()).filter(Boolean);
      const body: Record<string, unknown> = {
        address: form.address.trim(),
        chain: form.chain,
        category: form.category,
        description: form.description.trim(),
        evidence_urls: urls,
      };
      if (form.amount_lost_usd.trim()) body.amount_lost_usd = parseFloat(form.amount_lost_usd);
      if (form.tx_hash.trim()) body.tx_hash = form.tx_hash.trim();
      if (form.anon_email.trim()) body.anon_email = form.anon_email.trim();

      const res = await fetch("/api/report-scammer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submission failed"); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Report Submitted</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your report has been queued for admin review. Once verified, the address will be added to our public scam database.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setForm(f => ({ ...f, address: "", description: "", tx_hash: "", amount_lost_usd: "", evidence_urls: ["","",""], anon_email: "" })); }}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
              Report Another
            </button>
            <Link href="/" className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#00D9FF' }}>Community Intelligence</p>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>Report a Scammer</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Help protect the community. Verified reports are added to our scam address database and flag future traces.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          {/* Address + Chain */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Scammer Address *
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={e => set("address", e.target.value)}
                placeholder="0x... or T... or bc1..."
                className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Chain *</label>
              <select
                value={form.chain}
                onChange={e => set("chain", e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              >
                {CHAINS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Scam Type *</label>
            <select
              value={form.category}
              onChange={e => set("category", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Description * <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(min 50 chars)</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Describe what happened, how the scam worked, and any other relevant context..."
              className="w-full px-3 py-2 rounded-xl text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
            />
            <div className="text-right text-xs mt-1" style={{ color: form.description.length >= 50 ? '#00E676' : 'var(--text-muted)' }}>
              {form.description.length}/50+
            </div>
          </div>

          {/* Amount lost + TX hash */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount Lost (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount_lost_usd}
                onChange={e => set("amount_lost_usd", e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Evidence TX Hash</label>
              <input
                type="text"
                value={form.tx_hash}
                onChange={e => set("tx_hash", e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Evidence Links (up to 3)</label>
            {form.evidence_urls.map((url, i) => (
              <input
                key={i}
                type="url"
                value={url}
                onChange={e => setEvidenceUrl(i, e.target.value)}
                placeholder={`https://... (screenshot, tweet, article)`}
                className="w-full px-3 py-2 rounded-xl text-sm mb-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            ))}
          </div>

          {/* Anonymous email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Your Email (optional — for follow-up only)</label>
            <input
              type="email"
              value={form.anon_email}
              onChange={e => set("anon_email", e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm transition-opacity"
            style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Reports are reviewed by our team before being added to the database. False reports may result in account suspension.
          </p>
        </form>
      </div>
    </div>
  );
}

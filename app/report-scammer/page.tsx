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
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Report Submitted — Thank You</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Your scam report is queued for review. Once verified by our team, the wallet address will be added to the public ChainTracing scam database and flagged on every future trace.
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Want to see where the scammer&apos;s funds went? Run a free trace — no account needed.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setSuccess(false); setForm(f => ({ ...f, address: "", description: "", tx_hash: "", amount_lost_usd: "", evidence_urls: ["","",""], anon_email: "" })); }}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
              Report Another Scammer
            </button>
            <Link href={form.address ? `/?address=${encodeURIComponent(form.address)}` : "/"}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628' }}>
              Trace This Wallet
            </Link>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Report a Crypto Scam Wallet',
            url: 'https://chaintracing.org/report-scammer',
            description: "Submit a scammer's wallet address to the public ChainTracing scam database.",
            isPartOf: { '@id': 'https://chaintracing.org/#website' },
          }),
        }}
      />
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#00D9FF' }}>Community Intelligence</p>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>Report a Crypto Scam Wallet</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Submit a scammer&apos;s wallet address to our public database. Verified reports flag that address on every future trace — helping other victims avoid the same scam.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-black mb-4 text-center" style={{ color: 'var(--text-primary)' }}>Why Report a Scammer&apos;s Wallet</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-bold mb-2" style={{ color: '#00D9FF' }}>Warn Other Victims</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Every verified report adds the address to our scam database. The next person who traces that wallet sees the flag instantly.</p>
            </div>
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-bold mb-2" style={{ color: '#00D9FF' }}>Build On-Chain Evidence</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Multiple independent reports against the same wallet strengthen the case for law enforcement and exchange abuse teams.</p>
            </div>
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-bold mb-2" style={{ color: '#00D9FF' }}>Anonymous by Default</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Email is optional — only used if we need to verify details. No account required.</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
          {/* Address + Chain */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Scammer&apos;s Wallet Address *
              </label>
              <input
                type="text"
                required
                value={form.address}
                onChange={e => set("address", e.target.value)}
                placeholder="Paste the wallet address (0x..., T..., bc1..., or Solana)"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Blockchain *</label>
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
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Type of Scam *</label>
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
              What Happened? *
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Describe the scam: how they contacted you, what they promised, when you sent the crypto, and any other detail that could help others recognise it. Minimum 50 characters."
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
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount Lost (USD, optional)</label>
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
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Transaction Hash (optional)</label>
              <input
                type="text"
                value={form.tx_hash}
                onChange={e => set("tx_hash", e.target.value)}
                placeholder="The tx hash where you sent crypto to the scammer"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Supporting Links (optional, up to 3)</label>
            {form.evidence_urls.map((url, i) => (
              <input
                key={i}
                type="url"
                value={url}
                onChange={e => setEvidenceUrl(i, e.target.value)}
                placeholder="Screenshots, tweets, Telegram messages, news articles"
                className="w-full px-3 py-2 rounded-xl text-sm mb-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}
              />
            ))}
          </div>

          {/* Anonymous email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Your Email (optional)</label>
            <input
              type="email"
              value={form.anon_email}
              onChange={e => set("anon_email", e.target.value)}
              placeholder="Only used if we need to verify your report"
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
            {submitting ? "Submitting report…" : "Submit Scam Report"}
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            All reports are manually reviewed before addresses are added to the public database. False or malicious reports may result in IP bans.
          </p>
        </form>

        <section className="mt-12 glass rounded-2xl p-6">
          <h2 className="text-xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>What to Do After You&apos;ve Been Scammed</h2>
          <ol className="space-y-3 text-sm list-decimal list-inside leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Act fast.</strong> Scammers move funds through mixers and exchanges within hours. Run a free trace on the scammer&apos;s wallet to capture the hop path before the trail goes cold.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>File with the receiving exchange.</strong> If funds reach Binance, Coinbase, Kraken, or another CEX, file an abuse report directly — their compliance teams can freeze accounts.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Report to law enforcement.</strong> File with your local police and, in the US, IC3.gov (FBI). Our Deep Trace PDF is formatted for both.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Warn others.</strong> Submit this report so future victims searching the wallet get an instant red flag.</li>
          </ol>
        </section>

        <section className="mt-8 glass rounded-2xl p-6">
          <h2 className="text-xl font-black mb-6" style={{ color: 'var(--text-primary)' }}>Scam Reporting FAQ</h2>
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#00D9FF' }}>What happens after I submit a report?</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Our team manually reviews every report. Verified scam wallets are added to the public database within 24–72 hours and flagged on every future trace.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#00D9FF' }}>Do I need an account to report a scammer?</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>No. Reports are anonymous by default. Email is optional, only used if we need to verify details.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#00D9FF' }}>Can ChainTracing recover my stolen crypto?</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>No — we&apos;re not a recovery service. We provide on-chain evidence and flag scam wallets. Recovery requires law enforcement, a lawyer, or the receiving exchange.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#00D9FF' }}>What if I&apos;m reporting by mistake or the address isn&apos;t actually a scam?</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>All reports are reviewed before being added to the database. If you submitted in error, contact us and we&apos;ll remove it. Knowingly false reports may result in IP bans.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

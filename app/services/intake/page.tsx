"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze — $299",
  silver: "Silver — $899",
  gold: "Gold — $2,499",
};

const CHAINS = ["BTC", "ETH", "USDT", "SOL", "TRX", "BNB", "MATIC", "ARB", "BASE", "Other"];

const GOALS = [
  { id: "police", label: "Police report evidence" },
  { id: "subpoena", label: "Exchange subpoena prep" },
  { id: "civil", label: "Civil suit prep" },
  { id: "understand", label: "Just want to understand what happened" },
];

function IntakeForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTier = searchParams.get("tier") ?? "bronze";

  const [tier, setTier] = useState(initialTier);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [amountLost, setAmountLost] = useState("");
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [chain, setChain] = useState("BTC");
  const [scammerAddress, setScammerAddress] = useState("");
  const [victimTxid, setVictimTxid] = useState("");
  const [narrative, setNarrative] = useState("");
  const [policeReport, setPoliceReport] = useState<"yes" | "no" | "">("");
  const [goals, setGoals] = useState<string[]>([]);
  const [consentNoRecovery, setConsentNoRecovery] = useState(false);
  const [consentPayAfter, setConsentPayAfter] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const toggleGoal = (id: string) =>
    setGoals(gs => gs.includes(id) ? gs.filter(g => g !== id) : [...gs, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consentNoRecovery || !consentPayAfter) {
      setError("Please confirm both acknowledgements before submitting.");
      return;
    }
    if (goals.length === 0) {
      setError("Please select at least one goal.");
      return;
    }
    if (!policeReport) {
      setError("Please indicate whether you have filed a police report.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier, name, email, country,
          amountLostUsd: parseFloat(amountLost),
          dateOfLoss,
          chain: chain.toLowerCase(),
          scammerAddress,
          victimTxid: victimTxid.trim() || undefined,
          narrative,
          policeReport: policeReport === "yes",
          goals,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Submission failed. Please try again."); setLoading(false); return; }
      setCaseId(data.caseId);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (caseId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl p-10"
          style={{ background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.25)" }}>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-black mb-3" style={{ color: "#00E676" }}>Case submitted</h1>
          <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
            We will review your case within 24 hours and email you with next steps.
          </p>
          <div className="rounded-xl px-6 py-4 mb-6"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs mb-1" style={{ color: "#64748b" }}>Your case ID</p>
            <p className="font-mono text-xl font-bold" style={{ color: "#00D9FF" }}>{caseId}</p>
          </div>
          <p className="text-xs" style={{ color: "#475569" }}>
            Save this case ID. You&apos;ll need it to reference your investigation.
          </p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0,217,255,0.2)",
    color: "#e2e8f0",
    outline: "none",
  };
  const labelClass = "block text-xs font-bold uppercase tracking-widest mb-2";
  const labelStyle = { color: "#64748b" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="mb-8">
        <a href="/services" style={{ color: "#00D9FF", fontSize: 14, fontWeight: 600 }}>← Back to Services</a>
        <h1 className="text-3xl font-black mt-4 mb-2" style={{ color: "#f8fafc" }}>Request an Investigation</h1>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Fill in as much detail as you can. The more context you provide, the more targeted our analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Tier */}
        <div>
          <label className={labelClass} style={labelStyle}>Investigation Tier</label>
          <select value={tier} onChange={e => setTier(e.target.value)} required
            className={inputClass} style={{ ...inputStyle, background: "rgba(255,255,255,0.05)" }}>
            {Object.entries(TIER_LABELS).map(([v, l]) => (
              <option key={v} value={v} style={{ background: "#0a0e1a" }}>{l}</option>
            ))}
          </select>
        </div>

        {/* Name + Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Your name</label>
            <input required value={name} onChange={e => setName(e.target.value)} maxLength={100}
              placeholder="Full name" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Your email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className={inputClass} style={inputStyle} />
          </div>
        </div>

        {/* Country + Amount */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Your country</label>
            <input required value={country} onChange={e => setCountry(e.target.value)}
              placeholder="United Kingdom" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Approximate amount lost (USD)</label>
            <input required type="number" min="1" step="any" value={amountLost} onChange={e => setAmountLost(e.target.value)}
              placeholder="5000" className={inputClass} style={inputStyle} />
          </div>
        </div>

        {/* Date + Chain */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Date of loss</label>
            <input required type="date" value={dateOfLoss} onChange={e => setDateOfLoss(e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Cryptocurrency</label>
            <select required value={chain} onChange={e => setChain(e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: "rgba(255,255,255,0.05)" }}>
              {CHAINS.map(c => (
                <option key={c} value={c} style={{ background: "#0a0e1a" }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Scammer address */}
        <div>
          <label className={labelClass} style={labelStyle}>Scammer&apos;s wallet address</label>
          <input required value={scammerAddress} onChange={e => setScammerAddress(e.target.value)}
            placeholder="bc1q… / 0x… / T…" className={`${inputClass} font-mono text-xs`} style={inputStyle} />
        </div>

        {/* Victim txid */}
        <div>
          <label className={labelClass} style={labelStyle}>
            Your transaction ID / hash <span style={{ color: "#334155", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional but recommended for Silver/Gold)</span>
          </label>
          <input value={victimTxid} onChange={e => setVictimTxid(e.target.value)}
            placeholder="64-character transaction hash"
            className={`${inputClass} font-mono text-xs`} style={inputStyle} />
        </div>

        {/* Narrative */}
        <div>
          <label className={labelClass} style={labelStyle}>How did the scam happen?</label>
          <textarea required value={narrative} onChange={e => setNarrative(e.target.value.slice(0, 1000))}
            rows={5} placeholder="Describe the scam in as much detail as you can…"
            className={`${inputClass} resize-y`} style={{ ...inputStyle, fontFamily: "inherit" }} />
          <p className="text-xs mt-1" style={{ color: "#334155" }}>{narrative.length}/1000</p>
        </div>

        {/* Police report */}
        <div>
          <label className={labelClass} style={labelStyle}>Have you filed a police report?</label>
          <div className="flex gap-4">
            {(["yes", "no"] as const).map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="policeReport" value={v} checked={policeReport === v}
                  onChange={() => setPoliceReport(v)} required
                  style={{ accentColor: "#00D9FF" }} />
                <span className="text-sm capitalize" style={{ color: "#e2e8f0" }}>{v}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <label className={labelClass} style={labelStyle}>What is your goal? (select all that apply)</label>
          <div className="space-y-2">
            {GOALS.map(g => (
              <label key={g.id} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={goals.includes(g.id)} onChange={() => toggleGoal(g.id)}
                  style={{ accentColor: "#00D9FF" }} />
                <span className="text-sm" style={{ color: "#e2e8f0" }}>{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Consent */}
        <div className="rounded-xl p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consentNoRecovery} onChange={e => setConsentNoRecovery(e.target.checked)}
              className="mt-0.5" style={{ accentColor: "#00D9FF" }} />
            <span className="text-sm" style={{ color: "#cbd5e1" }}>
              I understand ChainTracing produces forensic evidence and <strong style={{ color: "#f8fafc" }}>does not guarantee fund recovery</strong>.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consentPayAfter} onChange={e => setConsentPayAfter(e.target.checked)}
              className="mt-0.5" style={{ accentColor: "#00D9FF" }} />
            <span className="text-sm" style={{ color: "#cbd5e1" }}>
              I understand I will be <strong style={{ color: "#f8fafc" }}>charged after the deliverable is sent</strong>, not before.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.3)", color: "#FF4757" }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading ? "rgba(0,217,255,0.2)" : "linear-gradient(135deg, #00D9FF, #0099BB)",
            color: loading ? "rgba(0,217,255,0.4)" : "#0A1628",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
              Submitting…
            </span>
          ) : "Submit Investigation Request"}
        </button>

      </form>
    </div>
  );
}

export default function IntakePage() {
  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0" }}>
      <Suspense fallback={<div className="py-20 text-center" style={{ color: "#64748b" }}>Loading…</div>}>
        <IntakeForm />
      </Suspense>
    </div>
  );
}

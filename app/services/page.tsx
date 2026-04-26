import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bespoke Forensic Investigations — ChainTracing",
  description:
    "ChainTracing produces forensic evidence to support your police report and exchange recovery requests. Hand-reviewed blockchain forensic reports for crypto scam victims.",
  alternates: { canonical: "/services" },
};

const TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    price: "$299",
    tagline: "Address Profile + Cluster Identification",
    popular: false,
    turnaround: "48 hours",
    bestFor: "Losses under $10,000, documentation for police reports",
    features: [
      "Wallet activity profile (lifetime volume, velocity, balance history)",
      "Arkham / WalletExplorer cluster identification",
      "Top destination addresses analysis",
      "Pattern analysis (mixer / exchange / processor signatures)",
      "Downloadable PDF forensic report",
      "Recommendations for police report and exchange subpoena",
    ],
    cta: "Request Bronze Investigation",
    color: "#cd7f32",
    border: "rgba(205,127,50,0.35)",
    bg: "rgba(205,127,50,0.06)",
  },
  {
    id: "silver",
    name: "Silver",
    price: "$899",
    tagline: "UTXO Trace + Exchange Identification",
    popular: true,
    turnaround: "5 business days",
    bestFor: "Losses $10,000 to $100,000",
    features: [
      "Everything in Bronze",
      "UTXO-level trace from your specific transaction",
      "Downstream exchange identification (which exchange received your funds)",
      "Subpoena-ready legal evidence package",
      "Email-formatted legal request templates",
      "Up to 2 revisions on findings",
    ],
    cta: "Request Silver Investigation",
    color: "#94a3b8",
    border: "rgba(148,163,184,0.4)",
    bg: "rgba(148,163,184,0.06)",
  },
  {
    id: "gold",
    name: "Gold",
    price: "$2,499",
    tagline: "Full Investigation + Liaison Support",
    popular: false,
    turnaround: "3 business days (priority)",
    bestFor: "Losses over $100,000",
    features: [
      "Everything in Silver",
      "Direct correspondence with your local cybercrime unit on your behalf",
      "Formal letter-quality submission to FBI IC3, Action Fraud UK, BKA, etc.",
      "30-day monitoring of identified addresses for new movement",
      "One follow-up investigation if scammer reactivates",
      "Priority turnaround",
    ],
    cta: "Request Gold Investigation",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.4)",
    bg: "rgba(245,158,11,0.06)",
  },
];

const WHY_ITEMS = [
  {
    icon: "💳",
    title: "Charged after delivery",
    body: "We invoice after the deliverable is sent — not before. If we can't produce useful findings we'll tell you before charging.",
  },
  {
    icon: "🚫",
    title: "We never claim to recover funds",
    body: "No legitimate forensics firm can guarantee recovery. We produce the evidence law enforcement and exchanges need. Anyone promising recovery upfront is the scam.",
  },
  {
    icon: "🔬",
    title: "Same intelligence sources",
    body: "We use the same on-chain data sources as Chainalysis and Elliptic — Arkham Intelligence, WalletExplorer, mempool.space — at a fraction of the cost.",
  },
  {
    icon: "👁️",
    title: "Hand-reviewed, every time",
    body: "Every report is reviewed before delivery. We don't auto-generate PDFs and call it forensics.",
  },
  {
    icon: "🏠",
    title: "One operator, no outsourcing",
    body: "No offshore call centers. No third-party contractors. One analyst, based in the UK, who owns the work.",
  },
];

export default function ServicesPage() {
  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0" }}>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
          style={{ background: "rgba(0,217,255,0.08)", border: "1px solid rgba(0,217,255,0.2)", color: "#00D9FF" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "#00D9FF" }} />
          Bespoke Forensic Investigations
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight" style={{ color: "#f8fafc" }}>
          Lost crypto to a scam?<br />
          <span style={{ color: "#00D9FF" }}>We produce the evidence.</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-4" style={{ color: "#94a3b8" }}>
          ChainTracing produces forensic evidence to support your police report and exchange recovery requests.
          We don&apos;t promise to recover your funds — no legitimate firm can.
          We produce the evidence law enforcement needs to do their job.
        </p>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "#64748b" }}>
          Charged after delivery · Hand-reviewed · No upfront payment required
        </p>
      </section>

      {/* ── Tier cards ── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map(tier => (
            <div key={tier.id} className="rounded-2xl p-6 flex flex-col relative"
              style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: tier.color, color: "#0a0e1a" }}>
                  Most popular
                </div>
              )}
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: tier.color }}>{tier.name}</span>
                <div className="text-4xl font-black mt-1 mb-0.5" style={{ color: "#f8fafc" }}>{tier.price}</div>
                <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>{tier.tagline}</p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map(f => (
                  <li key={f} className="flex gap-2 text-sm" style={{ color: "#cbd5e1" }}>
                    <span style={{ color: tier.color, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="rounded-lg px-3 py-2 mb-4"
                style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#64748b" }}>Turnaround</span>
                  <span className="font-semibold" style={{ color: "#e2e8f0" }}>{tier.turnaround}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Best for</span>
                  <span className="font-semibold text-right" style={{ color: "#e2e8f0", maxWidth: "60%" }}>{tier.bestFor}</span>
                </div>
              </div>

              <Link href={`/services/intake?tier=${tier.id}`}
                className="block text-center py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}66`, color: tier.color }}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why ChainTracing ── */}
      <section className="py-20 px-4" style={{ background: "rgba(10,22,40,0.8)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12" style={{ color: "#f8fafc" }}>
            Why ChainTracing?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {WHY_ITEMS.map(item => (
              <div key={item.title} className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-bold mb-1" style={{ color: "#f8fafc" }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signal ── */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto rounded-2xl p-6"
          style={{ background: "rgba(0,217,255,0.04)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <p className="text-sm mb-3" style={{ color: "#94a3b8" }}>
            Featured analysis prepared for{" "}
            <strong style={{ color: "#f8fafc" }}>Pleasant Green (Ben Taylor, 1.4M YouTube subscribers)</strong>
          </p>
          <Link href="/ben-taylor-report"
            className="text-sm font-semibold"
            style={{ color: "#00D9FF", textDecoration: "underline" }}>
            View sample forensic report →
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-2xl font-black mb-4" style={{ color: "#f8fafc" }}>Ready to get started?</h2>
        <p className="mb-8 text-sm" style={{ color: "#64748b" }}>No payment required until your report is delivered.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/services/intake?tier=bronze"
            className="px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: "rgba(205,127,50,0.15)", border: "1px solid rgba(205,127,50,0.4)", color: "#cd7f32" }}>
            Start Bronze — $299
          </Link>
          <Link href="/services/intake?tier=silver"
            className="px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#94a3b8" }}>
            Start Silver — $899
          </Link>
          <Link href="/services/intake?tier=gold"
            className="px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b" }}>
            Start Gold — $2,499
          </Link>
        </div>
      </section>

    </div>
  );
}

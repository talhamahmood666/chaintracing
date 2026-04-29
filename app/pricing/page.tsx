import type { Metadata } from "next";
import Link from "next/link";
import GlassCard from "@/components/GlassCard";

export const metadata: Metadata = {
  title: "Pricing — ChainTracing",
  description: "Simple, transparent pricing for blockchain forensics. Pay once for a PDF evidence report. No subscriptions, no hidden fees.",
  alternates: { canonical: "/pricing" },
};

const CHECK = <span style={{ color: "#00E676", flexShrink: 0 }}>&#10003;</span>;
const CROSS = <span style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>&#10005;</span>;

function FeatureRow({ label, free, quick, deep, pro }: {
  label: string;
  free: boolean | string;
  quick: boolean | string;
  deep: boolean | string;
  pro: boolean | string;
}) {
  const cell = (v: boolean | string) =>
    typeof v === "string" ? (
      <span className="text-xs font-semibold" style={{ color: "#00D9FF" }}>{v}</span>
    ) : v ? CHECK : CROSS;

  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <td className="py-3 pr-4 text-sm" style={{ color: "var(--text-secondary)" }}>{label}</td>
      <td className="py-3 text-center">{cell(free)}</td>
      <td className="py-3 text-center">{cell(quick)}</td>
      <td className="py-3 text-center">{cell(deep)}</td>
      <td className="py-3 text-center">{cell(pro)}</td>
    </tr>
  );
}

const FAQS = [
  {
    q: "Why crypto only?",
    a: "ChainTracing is built from Pakistan, where Stripe and PayPal do not operate. Crypto (USDT, BTC, ETH) is currently the only viable way to accept global payments. It also fits the product. Tracking stolen crypto, paid with crypto. Need a different method? Contact us.",
  },
  {
    q: "Can you recover my stolen funds?",
    a: "No. ChainTracing provides evidence reports. We are not a recovery service. Recovery requires law enforcement or licensed investigators. Our report gives them what they need to act.",
  },
  {
    q: "How accurate is the tracing?",
    a: "Trace results come directly from public blockchain data. Scam flags come from verified databases (OFAC, community reports). Single-path tracing follows the dominant fund flow. Complex scams with split or rotated addresses need manual review.",
  },
  {
    q: "Is this legal advice?",
    a: "No. We provide technical evidence. For legal action, consult a qualified attorney.",
  },
  {
    q: "Do you offer refunds?",
    a: "Paid reports are final once delivered. If the trace fails for technical reasons, contact support@chaintracing.org for a refund.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-6xl mx-auto px-4 py-20">

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
            Simple, Transparent Pricing
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Pay once for evidence. No subscriptions, no hidden fees. Crypto payments only (we are based in Pakistan{" "}
            <Link href="/pricing#faq-crypto" className="underline" style={{ color: "#00D9FF" }}>see FAQ</Link>).
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">

          {/* FREE */}
          <div className="glass rounded-2xl p-6 flex flex-col" style={{ border: "1px solid rgba(0,217,255,0.15)" }}>
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black font-mono" style={{ color: "var(--text-primary)" }}>$0</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Try before you pay</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-sm">
              {["2 hops anonymous", "5 hops with account", "Risk score", "Scam database check", "No PDF"].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span style={{ color: f === "No PDF" ? "rgba(255,255,255,0.25)" : "#00E676", flexShrink: 0 }}>
                    {f === "No PDF" ? "✗" : "✓"}
                  </span>
                  <span style={{ color: f === "No PDF" ? "var(--text-muted)" : "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/"
              className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)", color: "#00D9FF" }}>
              Start Free Trace
            </Link>
          </div>

          {/* QUICK SCAN */}
          <div className="glass rounded-2xl p-6 flex flex-col" style={{ border: "1px solid rgba(0,217,255,0.4)" }}>
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#00D9FF" }}>Quick Scan</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black font-mono" style={{ color: "#00D9FF" }}>$14.99</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>For filing a police report</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-sm">
              {["10-hop trace", "PDF evidence report", "CEX destination flagging", "Scam DB cross-check", "Risk scoring"].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span style={{ color: "#00D9FF", flexShrink: 0 }}>✓</span>
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/"
              className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #00D9FF, #0099BB)", color: "#0A1628" }}>
              Run Quick Scan
            </Link>
          </div>

          {/* DEEP TRACE */}
          <div className="rounded-2xl p-6 flex flex-col relative" style={{ background: "rgba(10,22,40,0.85)", border: "2px solid #FFA500", boxShadow: "0 0 32px rgba(255,165,0,0.15)" }}>
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#FFA500" }}>Deep Trace</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black font-mono" style={{ color: "#FFA500" }}>$29.99</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>For serious recovery cases</p>
            </div>
            <ul className="space-y-2 mb-6 flex-1 text-sm">
              {[
                "Everything in Quick Scan",
                "20-hop trace",
                "Bridge detection",
                "Mixer detection",
                "Wallet clustering",
                "Compliance letter template",
              ].map(f => (
                <li key={f} className="flex items-start gap-2">
                  <span style={{ color: "#FFA500", flexShrink: 0 }}>✓</span>
                  <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/"
              className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #FFA500, #CC8800)", color: "#0A1628" }}>
              Run Deep Trace
            </Link>
          </div>

          {/* FOR LAW FIRMS */}
          <div className="glass rounded-2xl p-6 flex flex-col relative" style={{ border: "1px solid rgba(16,185,129,0.4)" }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap"
                style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.4)" }}>
                B2B
              </span>
            </div>
            <div className="mb-5 mt-2">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#10b981" }}>For Law Firms</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xl font-black font-mono" style={{ color: "#10b981" }}>Volume &amp; Retainer Pricing</span>
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Dedicated seats, SLA guarantees, and case management integration. Contact us for custom pricing.</p>
            </div>
            <div className="flex-1" />
            <Link href="/services"
              className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
              Talk to Sales
            </Link>
          </div>
        </div>

        {/* Comparison table */}
        <GlassCard className="mb-16 overflow-x-auto">
          <h2 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: "var(--text-muted)" }}>
            Feature Comparison
          </h2>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <th className="pb-3 text-left text-xs font-bold" style={{ color: "var(--text-muted)", width: "40%" }}>Feature</th>
                {[
                  { label: "Free",        color: "var(--text-muted)" },
                  { label: "Quick",       color: "#00D9FF"            },
                  { label: "Deep",        color: "#FFA500"            },
                  { label: "Pro",         color: "#9B59B6"            },
                ].map(({ label, color }) => (
                  <th key={label} className="pb-3 text-center text-xs font-black" style={{ color }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <FeatureRow label="Hop depth"                  free="2-5"    quick="10"  deep="20"   pro="20"  />
              <FeatureRow label="Risk score"                 free={true}   quick={true}  deep={true}   pro={true}  />
              <FeatureRow label="Scam DB check"              free={true}   quick={true}  deep={true}   pro={true}  />
              <FeatureRow label="PDF evidence report"        free={false}  quick={true}  deep={true}   pro={true}  />
              <FeatureRow label="CEX destination flagging"   free={false}  quick={true}  deep={true}   pro={true}  />
              <FeatureRow label="Bridge detection"           free={false}  quick={false} deep={true}   pro={true}  />
              <FeatureRow label="Mixer detection"            free={false}  quick={false} deep={true}   pro={true}  />
              <FeatureRow label="Wallet clustering"          free={false}  quick={false} deep={true}   pro={true}  />
              <FeatureRow label="AI narrative summary"       free={false}  quick={false} deep={true}   pro={true}  />
              <FeatureRow label="API access"                 free={false}  quick={false} deep={false}  pro={true}  />
              <FeatureRow label="Bulk address lookups"       free={false}  quick={false} deep={false}  pro={true}  />
              <FeatureRow label="Custom report branding"     free={false}  quick={false} deep={false}  pro={true}  />
            </tbody>
          </table>
        </GlassCard>

        {/* FAQ */}
        <h2 id="faq-crypto" className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
          FAQ
        </h2>
        <div className="space-y-4 mb-14">
          {FAQS.map(({ q, a }) => (
            <GlassCard key={q}>
              <p className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>{q}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{a}</p>
            </GlassCard>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center rounded-2xl px-6 py-10"
          style={{ background: "rgba(0,217,255,0.05)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <p className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Ready to trace?
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Run a free scan first. Pay only when you want the full evidence report.
          </p>
          <Link href="/"
            className="inline-block px-8 py-3 rounded-xl font-black text-sm transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #00D9FF, #0099BB)", color: "#0A1628" }}>
            Start Free Trace
          </Link>
        </div>

      </div>
    </div>
  );
}

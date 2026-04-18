"use client";

const TIERS = [
  {
    title: "Free Preview",
    price: "$0",
    unit: "/trace",
    color: "#00D9FF",
    border: "rgba(0,217,255,0.15)",
    highlight: false,
    features: [
      "2 hops (anonymous) · 5 hops (logged in)",
      "Live risk score + flags",
      "Scam database check",
      "No credit card needed",
    ],
    checkColor: "#00E676",
    cta: "Start Free Trace",
    ctaStyle: { background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)", color: "#00D9FF" } as React.CSSProperties,
  },
  {
    title: "Quick Scan",
    price: "$9.99",
    unit: "/report",
    color: "#00D9FF",
    border: "2px solid #00D9FF",
    highlight: true,
    badge: "Most Popular",
    features: [
      "10 hops traced",
      "Exchange identification",
      "PDF evidence report",
      "Risk scoring + flags",
      "Shareable link",
    ],
    checkColor: "#00E676",
    cta: "Get Started",
    ctaStyle: { background: "linear-gradient(135deg, #00D9FF, #0099BB)", color: "#0A1628" } as React.CSSProperties,
  },
  {
    title: "Deep Trace",
    price: "$29.99",
    unit: "/report",
    color: "#FFA500",
    border: "1px solid rgba(255,165,0,0.3)",
    highlight: false,
    features: [
      "20 hops traced",
      "Bridge + mixer detection",
      "Wallet clustering",
      "Timing analysis",
      "Compliance letter",
      "OFAC screening",
    ],
    checkColor: "#FFA500",
    cta: "Get Started",
    ctaStyle: { background: "linear-gradient(135deg, #FFA500, #CC8800)", color: "#0A1628" } as React.CSSProperties,
  },
];

export default function PricingTiers() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TIERS.map((tier) => (
        <div
          key={tier.title}
          className="glass rounded-2xl p-6 relative"
          style={{ border: tier.border, boxShadow: tier.highlight ? "0 0 30px rgba(0,217,255,0.15)" : undefined }}
        >
          {tier.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: tier.color, color: "#0A1628" }}>{tier.badge}</span>
            </div>
          )}
          <div className="mb-5">
            <h3 className="text-xl font-black mb-1" style={{ color: tier.color }}>{tier.title}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono" style={{ color: tier.color }}>{tier.price}</span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{tier.unit}</span>
            </div>
          </div>
          <ul className="space-y-2 mb-6 text-sm">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span style={{ color: tier.checkColor, flexShrink: 0 }}>✓</span>
                <span style={{ color: "var(--text-secondary)" }}>{f}</span>
              </li>
            ))}
          </ul>
          <a href="#trace-form"
            className="block w-full py-2.5 rounded-xl font-bold text-sm text-center transition-all duration-200"
            style={tier.ctaStyle}>
            {tier.cta}
          </a>
        </div>
      ))}
    </div>
  );
}

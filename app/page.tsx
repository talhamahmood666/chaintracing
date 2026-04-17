import { getAdminClient } from "@/lib/supabase";
import ThreeBackground from "@/components/ThreeBackground";
import TraceForm from "@/components/TraceForm";
import AnimatedStatsCounter from "@/components/AnimatedStatsCounter";
import {
  Search, ArrowRight, Shield, FileText,
  Globe, AlertTriangle, Users, FileCheck, Scale, Zap,
  TrendingUp, Layers, Cpu, Network, Briefcase, ShieldCheck,
  Wallet, Banknote, Clock, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";

async function getReportsCount() {
  try {
    const supabase = getAdminClient();
    const { count, error } = await supabase.from('reports').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  } catch {
    return 4257;
  }
}

export default async function HomePage() {
  const reportsCount = await getReportsCount();
  const formattedCount = new Intl.NumberFormat('en-US').format(reportsCount);

  return (
    <main className="min-h-screen animate-fade-up">
      <ThreeBackground />
      
      {/* a) HERO — split layout */}
      <section id="trace-form" className="relative z-10 min-h-screen flex items-center">
        {/* Mobile: form first (flex-col-reverse stacks form on top) */}
        <div className="w-full max-w-7xl mx-auto px-4 py-32 flex flex-col-reverse md:flex-row md:items-center gap-12 md:gap-8">

          {/* LEFT 60% — wordmark + tagline + stats + CTA */}
          <div className="md:w-[60%] flex flex-col items-center md:items-start text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)', color: '#00D9FF' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#00D9FF' }} />
              Live Blockchain Forensics
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Chain<br />
              <span style={{ color: '#00D9FF' }}>Tracing</span>
            </h1>

            <p className="text-lg md:text-xl max-w-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
              Professional forensic lab — follow stolen crypto hop-by-hop across 8 blockchains. Free risk score, paid evidence reports.
            </p>

            <AnimatedStatsCounter reportsCount={reportsCount} />

            <a
              href="#hero-form-anchor"
              className="mt-10 inline-block px-8 py-4 rounded-xl font-bold text-sm transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #00D9FF, #0099BB)',
                color: '#0A1628',
                cursor: 'pointer',
              }}
            >
              Start Free Trace
            </a>
          </div>

          {/* RIGHT 40% — trace form card */}
          <div id="hero-form-anchor" className="md:w-[40%] md:sticky md:top-24">
            <div style={{
              background: 'rgba(10,22,40,0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,217,255,0.25)',
              borderRadius: '1.25rem',
              boxShadow: '0 0 40px rgba(0,217,255,0.15), 0 0 80px rgba(0,217,255,0.07), 0 20px 60px rgba(0,0,0,0.5)',
            }}>
              <TraceForm />
            </div>
          </div>

        </div>
      </section>

      {/* c) HOW IT WORKS */}
      <section className="py-24 px-4" style={{ background: 'rgba(10,22,40,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            How ChainTracing Works
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Forensic-grade blockchain analysis in four simple steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: "Enter Address", desc: "Paste scammer wallet or transaction hash" },
              { icon: ArrowRight, title: "Cross-Chain Trace", desc: "BFS algorithm follows funds across 8 blockchains" },
              { icon: Shield, title: "Detect Mixers & Exchanges", desc: "Identify Tornado Cash, bridges, and CEX hot wallets" },
              { icon: FileText, title: "Get Evidence Report", desc: "PDF with block explorer links, timestamps, risk flags" },
            ].map((step, idx) => (
              <div key={idx} className="glass rounded-2xl p-6 text-center animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
                  style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)' }}>
                  <step.icon className="w-8 h-8" style={{ color: '#00D9FF' }} />
                </div>
                <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* d) FEATURES GRID */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Forensic Lab Features
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Everything you need for professional crypto investigation
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Multi-Chain Support", desc: "Trace across 8 chains: ETH, BSC, Polygon, Arbitrum, Base, Solana, Tron, Bitcoin" },
              { icon: AlertTriangle, title: "OFAC Sanctions Screening", desc: "Check against 779 OFAC SDN entries, EU sanctions, UK HMT lists" },
              { icon: Cpu, title: "Mixer & Bridge Detection", desc: "Identify Tornado Cash, Blender, cross-chain bridges, money-laundering routes" },
              { icon: Briefcase, title: "Exchange Identification", desc: "Map to known CEX hot wallets: Binance, Coinbase, Kraken, OKX, Bybit" },
              { icon: FileCheck, title: "Professional PDF Reports", desc: "Court-ready evidence packages with block explorer links, timestamps" },
              { icon: ShieldCheck, title: "Law Enforcement Ready", desc: "Compliance letters, wallet clustering, timing analysis, risk scoring" },
            ].map((feat, idx) => (
              <div key={idx} className="glass rounded-2xl p-6 animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)' }}>
                    <feat.icon className="w-6 h-6" style={{ color: '#00D9FF' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* e) FOR WHO */}
      <section className="py-24 px-4" style={{ background: 'rgba(10,22,40,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Who Uses ChainTracing
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Built for victims, investigators, and law enforcement
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Scam Victims", desc: "Got rugged? Trace where your funds went. Free risk score, paid evidence package." },
              { icon: Scale, title: "Investigators", desc: "Professional forensic tools for private investigators, compliance teams, auditors." },
              { icon: Shield, title: "Law Enforcement", desc: "Court-ready documentation, OFAC screening, mixer detection, timing analysis." },
            ].map((audience, idx) => (
              <div key={idx} className="glass rounded-2xl p-6 text-center animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
                  style={{ background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)' }}>
                  <audience.icon className="w-8 h-8" style={{ color: '#00D9FF' }} />
                </div>
                <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>{audience.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{audience.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* f) PRICING */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Forensic Report Tiers
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Pay only after you see the trace results. USDT (TRC-20) payment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Quick Scan", price: "$9.99", features: ["10 hops max", "Exchange identification", "PDF evidence report", "Basic risk scoring", "Free first 2 hops"], color: "#00D9FF", icon: Zap },
              { title: "Deep Trace", price: "$29.99", features: ["20 hops max", "Bridge/mixer detection", "Wallet clustering", "Compliance letter", "Timing analysis", "OFAC screening"], color: "#FFA500", icon: Layers },
            ].map((tier, idx) => (
              <div key={idx} className="glass rounded-2xl p-6 animate-fade-up glow-cyan" style={{ animationDelay: `${idx * 0.1}s`, borderColor: tier.color }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black mb-1" style={{ color: tier.color }}>{tier.title}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black font-mono" style={{ color: tier.color }}>{tier.price}</span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>/report</span>
                    </div>
                  </div>
                  <tier.icon className="w-10 h-10" style={{ color: tier.color }} />
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-sm">
                      <span style={{ color: '#00E676' }}>✓</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href="#trace-form"
                  className="block w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${tier.color}, ${tier.color}BB)`,
                    color: '#0A1628',
                    cursor: 'pointer',
                  }}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* g) TRUST STRIP */}
      <section className="py-16 px-4 border-y" style={{ borderColor: 'rgba(0,217,255,0.1)', background: 'rgba(10,22,40,0.4)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm mb-8">
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Powered by:</span>
            {['OFAC SDN', 'Etherscan V2', 'MEW Darklist', 'ScamSniffer', 'EU Sanctions'].map((source, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full glass" style={{ color: 'var(--text-primary)' }}>{source}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            {[
              { value: '4,728', label: 'known scam addresses' },
              { value: '345,566', label: 'phishing domains' },
              { value: '8', label: 'blockchains supported' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-mono font-bold" style={{ color: '#00D9FF' }}>{stat.value}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* h) FAQ */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Clear answers about how our forensic tracing works
          </p>
          
          <div className="space-y-4">
            {[
              { q: "How does tracing work?", a: "We use BFS across chains, detect exchanges, bridges, mixers, and sanction lists." },
              { q: "Can you recover my stolen funds?", a: "We provide evidence reports — recovery requires law enforcement action." },
              { q: "How accurate is the risk score?", a: "Based on wallet age, mixer use, OFAC matches, exchange proximity." },
              { q: "What happens after I pay?", a: "Instant access to full hop-by-hop report, PDF download, block explorer links." },
              { q: "Do you work with law enforcement?", a: "Yes, we provide court-ready evidence packages and compliance letters." },
              { q: "Is my data private?", a: "Reports are encrypted; only you can access via unique token. No public sharing." },
            ].map((faq, idx) => (
              <div key={idx} className="glass rounded-2xl p-6 animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex items-center justify-between cursor-pointer">
                  <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{faq.q}</h3>
                  <ChevronDown className="w-5 h-5" style={{ color: '#00D9FF' }} />
                </div>
                 <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* i) FINAL CTA */}
      <section className="py-24 px-4 text-center" style={{ background: 'rgba(10,22,40,0.6)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text-primary)' }}>
            Every minute matters.<br />
            <span style={{ color: '#00D9FF' }}>Start your trace now.</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Funds move fast across chains. Get evidence before they reach mixers.
          </p>
          <a 
            href="#trace-form"
            className="inline-block px-12 py-5 rounded-xl font-bold text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #00D9FF, #0099BB)',
              color: '#0A1628',
              cursor: 'pointer',
            }}
          >
            Trace This Address — Free
          </a>
        </div>
      </section>
    </main>
  );
}
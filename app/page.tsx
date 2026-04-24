import type { Metadata } from 'next';
import { getAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: 'Trace Stolen Crypto — Free Wallet Scam Check',
  description: 'Paste a wallet address to trace stolen crypto across Ethereum, Solana, Tron, and Bitcoin. Free scam database lookup. Follow funds to exchange off-ramps in minutes.',
  alternates: { canonical: '/' },
};
import ThreeBackground from "@/components/ThreeBackground";
import TraceForm from "@/components/TraceForm";
import AnimatedStatsCounter from "@/components/AnimatedStatsCounter";
import PricingTiers from "@/components/PricingTiers";
import SampleReport from "@/components/SampleReport";
import {
  Search, ArrowRight, Shield, FileText,
  Globe, AlertTriangle, Users, FileCheck, Scale, Zap,
  TrendingUp, Layers, Cpu, Network, Briefcase, ShieldCheck,
  Wallet, Banknote, Clock, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";

async function getSsrStats(): Promise<{ reportsCount: number; flaggedCount: number; communityReportsCount: number }> {
  try {
    const supabase = getAdminClient();
    const [{ count: reports }, { count: flagged }, { count: community }] = await Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('scam_addresses').select('*', { count: 'exact', head: true }),
      supabase.from('user_reports').select('*', { count: 'exact', head: true }),
    ]);
    const BASE = { scans: 150, flagged: 4700, community: 273 };
    return { reportsCount: (reports ?? 0) + BASE.scans, flaggedCount: (flagged ?? 0) + BASE.flagged, communityReportsCount: (community ?? 0) + BASE.community };
  } catch {
    return { reportsCount: 150, flaggedCount: 4700, communityReportsCount: 273 };
  }
}

export default async function HomePage() {
  const { reportsCount, flaggedCount, communityReportsCount } = await getSsrStats();
  const formattedCount = new Intl.NumberFormat('en-US').format(reportsCount);

  return (
    <main className="min-h-screen animate-fade-up">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://chaintracing.org/#org',
                name: 'ChainTracing',
                url: 'https://chaintracing.org',
                logo: 'https://chaintracing.org/opengraph-image',
                description: 'Blockchain forensics and crypto scam tracing across Ethereum, Solana, Tron, and Bitcoin.',
                founder: { '@type': 'Person', name: 'Talha Mahmood' },
              },
              {
                '@type': 'WebSite',
                '@id': 'https://chaintracing.org/#website',
                url: 'https://chaintracing.org',
                name: 'ChainTracing',
                publisher: { '@id': 'https://chaintracing.org/#org' },
              },
              {
                '@type': 'SoftwareApplication',
                name: 'ChainTracing',
                applicationCategory: 'SecurityApplication',
                operatingSystem: 'Web',
                description: 'Trace stolen cryptocurrency across 8 blockchains. Free risk score, evidence-grade reports.',
                offers: [
                  { '@type': 'Offer', name: 'Free Scan', price: '0', priceCurrency: 'USD' },
                  { '@type': 'Offer', name: 'Quick Scan', price: '14.99', priceCurrency: 'USD' },
                  { '@type': 'Offer', name: 'Deep Trace', price: '29.99', priceCurrency: 'USD' },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  { '@type': 'Question', name: 'How do I trace stolen cryptocurrency?', acceptedAnswer: { '@type': 'Answer', text: "Paste the scammer's wallet address. ChainTracing runs a BFS search across EVM chains, Solana, Tron, and Bitcoin, flagging mixers, bridges, and exchange deposits so you can see exactly where your funds went." } },
                  { '@type': 'Question', name: 'Can stolen crypto be recovered?', acceptedAnswer: { '@type': 'Answer', text: "ChainTracing produces the on-chain evidence. Actual recovery requires law enforcement, a lawyer, or the receiving exchange's abuse team." } },
                  { '@type': 'Question', name: 'How do I know if a wallet address is a scammer?', acceptedAnswer: { '@type': 'Answer', text: 'Enter the address for a free risk score. We cross-check against 4,700+ known scam addresses, OFAC sanctions, phishing databases, and behavioural patterns.' } },
                  { '@type': 'Question', name: 'Which blockchains can you trace?', acceptedAnswer: { '@type': 'Answer', text: 'Ethereum, BSC, Polygon, Arbitrum, Base, Solana, Tron, and Bitcoin — all in one trace.' } },
                  { '@type': 'Question', name: 'What do I do if I sent crypto to a scammer?', acceptedAnswer: { '@type': 'Answer', text: 'Act fast — funds move through mixers within hours. Run a free trace to capture the hop path, then file reports with the receiving exchange, local police, and IC3 (FBI).' } },
                ],
              },
            ],
          }),
        }}
      />
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
              Trace Stolen Crypto<br />
              <span style={{ color: '#00D9FF' }}>Across 8 Blockchains</span>
            </h1>

            <p className="text-lg md:text-xl max-w-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
              Follow scammer wallets hop-by-hop across Ethereum, Solana, Tron, Bitcoin, and EVM L2s. Free risk score and scam database check. Evidence-grade reports for victims, investigators, and law enforcement.
            </p>

            <AnimatedStatsCounter reportsCount={reportsCount} flaggedCount={flaggedCount} communityReportsCount={communityReportsCount} />

            <a
              href="#hero-form-anchor"
              className="mt-10 inline-block px-8 py-4 rounded-xl font-bold text-sm transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #00D9FF, #0099BB)',
                color: '#0A1628',
                cursor: 'pointer',
              }}
            >
              Check a Wallet — Free
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

      {/* b) PRICING — shown before scan so visitors know cost upfront */}
      <section id="pricing" className="py-20 px-4" style={{ background: 'rgba(10,22,40,0.8)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-3" style={{ color: 'var(--text-primary)' }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-center max-w-xl mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
            Run a free trace first — pay only if you want the full evidence report.
          </p>
          <p className="text-center text-sm font-semibold mb-12" style={{ color: '#00E676' }}>
            🎁 First report 50% off for account holders — Quick $7.50 · Deep $14.99
          </p>
          <PricingTiers />
        </div>
      </section>

      {/* c) HOW IT WORKS */}
      <section className="py-24 px-4" style={{ background: 'rgba(10,22,40,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            How to Trace Stolen Cryptocurrency
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Forensic-grade on-chain analysis in four steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Search, title: "Enter the Scammer's Wallet", desc: "Paste the wallet address or transaction hash where your crypto was sent." },
              { icon: ArrowRight, title: "Multi-Chain BFS Trace", desc: "Our BFS engine follows the funds across EVM chains, Solana, Tron, and Bitcoin — automatically." },
              { icon: Shield, title: "Detect Mixers, Bridges & Exchanges", desc: "Identify Tornado Cash, cross-chain bridges, and CEX hot wallets (Binance, Coinbase, Kraken, OKX, Bybit)." },
              { icon: FileText, title: "Get a Court-Ready Evidence Report", desc: "PDF with every hop, block explorer links, timestamps, risk flags, and law enforcement action guidance." },
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
            Blockchain Forensics Features
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Everything a crypto investigation needs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Multi-Chain Tracing", desc: "Trace across 8 chains: Ethereum, BSC, Polygon, Arbitrum, Base, Solana, Tron, and Bitcoin." },
              { icon: AlertTriangle, title: "OFAC & Sanctions Screening", desc: "Check against 779 OFAC SDN entries plus EU and UK HMT sanctions lists." },
              { icon: Cpu, title: "Mixer & Bridge Detection", desc: "Flag Tornado Cash, Blender, and cross-chain bridges used to obscure funds." },
              { icon: Briefcase, title: "Exchange Off-Ramp Identification", desc: "Map funds to known CEX hot wallets — Binance, Coinbase, Kraken, OKX, Bybit — for subpoena targeting." },
              { icon: FileCheck, title: "Evidence-Grade PDF Reports", desc: "Court-ready packages with block explorer links, timestamps, and attribution confidence." },
              { icon: ShieldCheck, title: "Built for Law Enforcement", desc: "Compliance letters, wallet clustering, timing analysis, and risk scoring." },
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
            Built for Victims, Investigators, and Law Enforcement
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Crypto Scam Victims", desc: "Pig butchering, romance scam, phishing, rug pull — trace where your stolen crypto went. Free risk score, affordable evidence report." },
              { icon: Scale, title: "Investigators & Compliance", desc: "Professional on-chain forensics for private investigators, compliance teams, and auditors." },
              { icon: Shield, title: "Law Enforcement", desc: "Court-ready evidence, OFAC screening, mixer detection, and CEX attribution for subpoenas." },
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

      {/* f) PRICING (detailed post-scan) */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Forensic Report Tiers
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
            Pay only after you see the trace results. USDT (TRC-20) payment.
          </p>
          <p className="text-center text-sm font-semibold mb-12" style={{ color: '#00E676' }}>
            🎁 First report 50% off — Quick $7.50 · Deep $14.99 (account holders)
          </p>
          <PricingTiers />
        </div>
      </section>

      {/* f2) SAMPLE REPORT */}
      <SampleReport />

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
              { value: '4,700+', label: 'known scam addresses' },
              { value: '345,566', label: 'phishing domains' },
              { value: '8', label: 'blockchains supported' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-mono font-bold" style={{ color: '#00D9FF' }}>{stat.value}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            Cross-chain hop tracking · Beyond-CEX reliability flagging
          </p>
        </div>
      </section>

      {/* h) FAQ */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Crypto Tracing FAQ
          </h2>
          
          <div className="space-y-4">
            {[
              { q: "How do I trace stolen cryptocurrency?", a: "Paste the scammer's wallet address above. ChainTracing runs a BFS search across EVM chains, Solana, Tron, and Bitcoin, flagging mixers, bridges, and exchange deposits so you can see exactly where your funds went." },
              { q: "Can stolen crypto be recovered?", a: "ChainTracing produces the on-chain evidence. Actual recovery requires law enforcement, a lawyer, or the receiving exchange's abuse team — our PDF is built for all three." },
              { q: "How do I know if a wallet address is a scammer?", a: "Enter the address for a free risk score. We cross-check against 4,700+ known scam addresses, OFAC sanctions, phishing databases, and behavioural patterns." },
              { q: "Which blockchains can you trace?", a: "Ethereum, BSC, Polygon, Arbitrum, Base, Solana, Tron, and Bitcoin — all in one trace." },
              { q: "How far can you follow the funds?", a: "Up to 20 hops on Deep Trace. We also flag when funds have passed through a CEX — beyond that point on-chain tracing becomes unreliable and the exchange must be subpoenaed." },
              { q: "What do I do if I sent crypto to a scammer?", a: "Act fast — funds move through mixers within hours. Run a free trace to capture the hop path, then file reports with the receiving exchange, local police, and IC3 (FBI)." },
              { q: "Do you work with law enforcement?", a: "Yes — our PDF reports are built to evidentiary standards with block explorer citations, timestamps, and compliance letters." },
              { q: "Is my data private?", a: "Reports are accessible only via your unique token. We never share your data or the addresses you trace." },
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
            Stolen crypto moves fast.<br />
            <span style={{ color: '#00D9FF' }}>Trace it now.</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto mb-16" style={{ color: 'var(--text-secondary)' }}>
            Funds reach mixers and exchanges within hours. Get on-chain evidence before the trail goes cold.
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
            Start Free Trace
          </a>
        </div>
      </section>
    </main>
  );
}
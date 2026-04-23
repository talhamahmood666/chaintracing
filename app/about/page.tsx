import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FaXTwitter, FaLinkedin, FaGithub } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

export const metadata: Metadata = {
  title: 'About ChainTracing — Blockchain Forensics for Scam Victims & Investigators',
  description: 'ChainTracing helps crypto scam victims and law enforcement trace stolen funds across EVM, Solana, Tron, and Bitcoin. Affordable, evidence-grade on-chain analysis.',
  alternates: { canonical: '/about' },
};

const GLASS = {
  background: "rgba(10,22,40,0.7)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,217,255,0.15)",
  boxShadow: "0 0 40px rgba(0,217,255,0.07), 0 20px 60px rgba(0,0,0,0.4)",
} as React.CSSProperties;

export default function AboutPage() {
  return (
    <div className="min-h-screen relative z-10 flex items-start justify-center px-4 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            url: 'https://chaintracing.org/about',
            mainEntity: {
              '@type': 'Organization',
              name: 'ChainTracing',
              founder: {
                '@type': 'Person',
                name: 'Talha Mahmood',
                jobTitle: 'Founder',
                sameAs: [
                  'https://x.com/talhamahmood666',
                  'https://github.com/talhamahmood666',
                ],
              },
              description: 'Affordable blockchain forensics for crypto scam victims and investigators.',
            },
          }),
        }}
      />
      <div className="w-full max-w-3xl flex flex-col items-center gap-10">

        {/* Hero */}
        <section className="w-full text-center pt-4 pb-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
            About ChainTracing — Blockchain Forensics for Scam Victims
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Affordable, evidence-grade on-chain tracing for people who can&apos;t spend $500+ on a forensic firm.
          </p>
        </section>

        {/* Photo */}
        <div style={{
          borderRadius: "9999px",
          padding: "3px",
          background: "linear-gradient(135deg, #00D9FF, #0099BB)",
          boxShadow: "0 0 32px rgba(0,217,255,0.4), 0 0 64px rgba(0,217,255,0.15)",
        }}>
          <div style={{ borderRadius: "9999px", overflow: "hidden", width: 200, height: 200, background: "#0A1628" }}>
            <Image
              src="/talha.jpg"
              alt="Talha Mahmood"
              width={200}
              height={200}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              priority
            />
          </div>
        </div>

        {/* Name + title */}
        <div className="text-center">
          <h2 id="founder" className="text-3xl sm:text-4xl font-black tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
            Talha Mahmood
          </h2>
          <p className="text-base font-semibold uppercase tracking-widest" style={{ color: "#00D9FF" }}>
            Founder, ChainTracing
          </p>
        </div>

        {/* Bio */}
        <div className="w-full rounded-2xl p-8 flex flex-col gap-5" style={GLASS}>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            CEO of{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Symbiote Technologies</span>{" "}
            (Lahore, Pakistan) and builder of autonomous AI systems on{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Paperclip</span>. Shipped
            the Paperclip OpenRouter adapter — unlocking access to 300+ models for the platform.
          </p>

          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Built ChainTracing after watching too many crypto victims hit dead ends trying to trace stolen funds.
            Most can&apos;t afford $500+ forensic firms, and free block explorers don&apos;t connect the dots.
            ChainTracing turns the same on-chain data professional investigators use into a{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>$14.99 evidence report</span>{" "}
            any victim can hand to police or an exchange compliance team.
          </p>
        </div>

        {/* Why ChainTracing Exists */}
        <section className="w-full rounded-2xl p-8" style={GLASS}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
            Why ChainTracing Exists
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Professional blockchain forensics firms charge $500 to $5,000 per investigation — out of reach for most scam victims. Meanwhile, public block explorers show raw transactions but don&apos;t identify exchanges, mixers, or sanctioned wallets. ChainTracing closes the gap: the same forensic techniques investigators use at a fraction of the price, delivered as a PDF you can hand to police, your lawyer, or the exchange&apos;s abuse team.
          </p>
        </section>

        {/* How We Trace Stolen Crypto */}
        <section className="w-full rounded-2xl p-8" style={GLASS}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
            How We Trace Stolen Crypto
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            ChainTracing runs a breadth-first search across Ethereum, BSC, Polygon, Arbitrum, Base, Solana, Tron, and Bitcoin. Every hop is cross-checked against known CEX hot wallets (Binance, Coinbase, Kraken, OKX, Bybit), mixer contracts (Tornado Cash, Blender), cross-chain bridges, OFAC sanctions lists, and a database of 4,700+ reported scam wallets. When funds reach an exchange, we flag the deposit so you know which CEX to subpoena — and we flag the point at which on-chain tracing becomes unreliable, so you don&apos;t chase ghosts.
          </p>
        </section>

        {/* Who ChainTracing Is For */}
        <section className="w-full rounded-2xl p-8" style={GLASS}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
            Who ChainTracing Is For
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl p-5" style={{ border: "1px solid rgba(0,217,255,0.15)", background: "rgba(10,22,40,0.4)" }}>
              <h3 className="font-bold mb-2" style={{ color: "#00D9FF" }}>Crypto Scam Victims</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>Pig butchering, romance scams, phishing, rug pulls, fake exchanges. If you sent crypto to a wallet you shouldn&apos;t have, we show you where it went.</p>
            </div>
            <div className="rounded-xl p-5" style={{ border: "1px solid rgba(0,217,255,0.15)", background: "rgba(10,22,40,0.4)" }}>
              <h3 className="font-bold mb-2" style={{ color: "#00D9FF" }}>Private Investigators &amp; Lawyers</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>On-chain evidence for civil cases, divorce asset discovery, fraud investigations, and compliance work.</p>
            </div>
            <div className="rounded-xl p-5" style={{ border: "1px solid rgba(0,217,255,0.15)", background: "rgba(10,22,40,0.4)" }}>
              <h3 className="font-bold mb-2" style={{ color: "#00D9FF" }}>Law Enforcement</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>Court-ready PDFs with block explorer citations, exchange attribution, and OFAC screening — built for subpoena targeting.</p>
            </div>
          </div>
        </section>

        {/* What ChainTracing Is Not */}
        <section className="w-full rounded-2xl p-8" style={GLASS}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
            What ChainTracing Is Not
          </h2>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            ChainTracing is not a recovery service. We do not contact exchanges or law enforcement on your behalf, we do not negotiate with scammers, and we do not guarantee fund recovery. What we provide is forensic-grade on-chain evidence — the raw material that makes recovery possible when handed to the right authority. Anyone claiming to recover stolen crypto for an upfront fee is almost certainly running a follow-up scam.
          </p>
        </section>

        {/* CTA */}
        <section className="w-full rounded-2xl p-8 text-center" style={GLASS}>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Ready to Trace a Wallet?
          </h2>
          <p className="text-base mb-6" style={{ color: "var(--text-secondary)" }}>
            Free risk score. No account needed.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/" className="px-5 py-3 rounded-xl text-sm font-black"
              style={{ background: "linear-gradient(135deg, #00D9FF, #0099BB)", color: "#0A1628" }}>
              Start a Free Trace
            </Link>
            <Link href="/report-scammer" className="px-5 py-3 rounded-xl text-sm font-black"
              style={{ background: "rgba(0,217,255,0.1)", border: "1px solid rgba(0,217,255,0.3)", color: "#00D9FF" }}>
              Report a Scam Wallet
            </Link>
          </div>
        </section>

        {/* Contact card */}
        <div className="w-full rounded-2xl p-8" style={GLASS}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: "#00D9FF" }}>
            Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ borderColor: "rgba(0,217,255,0.08)" }}>
            <ContactRow icon={<MdEmail size={20} />} platform="Email" label="support@chaintracing.org" href="mailto:support@chaintracing.org" first />
            <ContactRow icon={<FaXTwitter size={20} />} platform="X" label="@talhamahmood666" href="https://x.com/talhamahmood666" />
            <ContactRow icon={<FaLinkedin size={20} />} platform="LinkedIn" label="talha-m" href="https://www.linkedin.com/in/talha-m-70732497/" />
            <ContactRow icon={<FaGithub size={20} />} platform="GitHub" label="talhamahmood666" href="https://github.com/talhamahmood666" />
          </div>
        </div>

      </div>
    </div>
  );
}

function ContactRow({ icon, platform, label, href, first }: {
  icon: React.ReactNode;
  platform: string;
  label: string;
  href: string;
  first?: boolean;
}) {
  const isMailto = href.startsWith("mailto");
  return (
    <a
      href={href}
      target={isMailto ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 rounded-xl hover:bg-white/[0.04]"
      style={{ borderTop: first ? undefined : "1px solid rgba(0,217,255,0.06)" }}
    >
      <span className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" style={{ color: "#00D9FF" }}>
        {icon}
      </span>
      <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider w-16" style={{ color: "#00D9FF" }}>
        {platform}
      </span>
      <span className="flex-1 text-sm truncate transition-colors duration-150 group-hover:text-white" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <ArrowUpRight size={14} className="flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity duration-150" style={{ color: "#00D9FF" }} />
    </a>
  );
}

import type { Metadata } from "next";
import GlassCard from "@/components/GlassCard";
import { getAdminClient } from "@/lib/supabase";
import CommentForm from "./CommentForm";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  category: string;
  created_at: string;
}

export const metadata: Metadata = {
  title: "Roadmap — ChainTracing",
  description: "What we have built, what is coming next, and what we are thinking about at ChainTracing.",
  alternates: { canonical: "/roadmap" },
};

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  shipped:    { label: "Shipped",      color: "#00E676", bg: "rgba(0,230,118,0.15)"  },
  progress:   { label: "In Progress",  color: "#00D9FF", bg: "rgba(0,217,255,0.15)"  },
  planned:    { label: "Planned",      color: "#9B59B6", bg: "rgba(155,89,182,0.15)" },
  longer:     { label: "Longer-Term",  color: "#888",    bg: "rgba(255,255,255,0.08)"},
  exploring:  { label: "Exploring",    color: "#FFA500", bg: "rgba(255,165,0,0.15)"  },
};

function Badge({ type }: { type: keyof typeof BADGE }) {
  const { label, color, bg } = BADGE[type];
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest"
      style={{ background: bg, color, border: `1px solid ${color}40` }}>
      {label}
    </span>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
      <span className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>+</span>
      <span>{children}</span>
    </li>
  );
}

async function getComments() {
  try {
    const db = getAdminClient();
    const { data } = await db
      .from("roadmap_comments")
      .select("id, author_name, content, category, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function RoadmapPage() {
  const comments = await getComments();

  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-4xl mx-auto px-4 py-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
            ChainTracing Roadmap
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            What we have built, what is coming, what we are thinking about.
          </p>
        </div>

        {/* Guiding Principles */}
        <GlassCard className="mb-10">
          <h2 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
            Guiding Principles
          </h2>
          <ul className="space-y-3">
            {[
              ["Honest about limits.", "We are evidence, not recovery."],
              ["Public sources only.", "No scraping partners' data."],
              ["Ship lean.", "Iterate on real user need."],
              ["Build in public.", ""],
            ].map(([bold, rest]) => (
              <li key={bold} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 shrink-0" style={{ color: "#00D9FF" }}>+</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{bold}</strong>
                  {rest ? " " + rest : ""}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Shipped */}
        <GlassCard className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Badge type="shipped" />
          </div>
          <ul className="space-y-2.5">
            <Item>Multi-chain tracing across Ethereum, BSC, Polygon, Arbitrum, Base, Solana, Tron, Bitcoin</Item>
            <Item>Free risk score plus paid PDF report ($14.99 Quick, $29.99 Deep)</Item>
            <Item>Scam address database (4,700+ entries from OFAC SDN, MEW darklist, community reports)</Item>
            <Item>Bridge detection across 8 chains</Item>
            <Item>CEX hot wallet flagging</Item>
            <Item>User accounts and dashboard</Item>
            <Item>Community scam reporting</Item>
            <Item>Crypto payments via Plisio</Item>
            <Item>Coupon code system</Item>
          </ul>
        </GlassCard>

        {/* In Progress */}
        <GlassCard className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Badge type="progress" />
          </div>
          <ul className="space-y-2.5">
            <Item>Wallet clustering for same-owner detection</Item>
            <Item>Public scam address lookup at /check</Item>
          </ul>
        </GlassCard>

        {/* Planned */}
        <GlassCard className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Badge type="planned" />
          </div>
          <ul className="space-y-2.5">
            <Item>SHA-256 signed PDFs with timestamp for legal admissibility</Item>
            <Item>Subpoena contact directory per CEX</Item>
            <Item>Phishing URL database</Item>
            <Item>B2B API access for private investigators and forensic accountants</Item>
            <Item>Monthly subscription tiers ($199 and $499)</Item>
          </ul>
        </GlassCard>

        {/* Longer-Term */}
        <GlassCard className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Badge type="longer" />
          </div>
          <ul className="space-y-2.5">
            <Item>Cross-chain tracing continuing through bridge hops</Item>
            <Item>Behavioral scam pattern detection</Item>
            <Item>Real-time wallet alerts</Item>
            <Item>Social graph layer</Item>
          </ul>
        </GlassCard>

        {/* Exploring */}
        <GlassCard className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <Badge type="exploring" />
          </div>
          <ul className="space-y-2.5">
            <Item>Partnership with PI associations</Item>
            <Item>Law enforcement portal</Item>
            <Item>Victim advocacy integrations</Item>
          </ul>
        </GlassCard>

        {/* FAQ */}
        <h2 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
          FAQ
        </h2>
        <div className="space-y-4 mb-14">
          {[
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
          ].map(({ q, a }) => (
            <GlassCard key={q}>
              <p className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>{q}</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{a}</p>
            </GlassCard>
          ))}
        </div>

        {/* Comments */}
        <h2 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
          Community Comments
        </h2>

        {comments.length > 0 && (
          <div className="space-y-4 mb-8">
            {comments.map((c: Comment) => (
              <GlassCard key={c.id}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {c.author_name || "Anonymous"}
                  </span>
                  {c.category && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(0,217,255,0.1)", color: "#00D9FF", border: "1px solid rgba(0,217,255,0.2)" }}>
                      {c.category}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(c.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.content}</p>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Comment form */}
        <GlassCard className="mb-10">
          <h3 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
            Leave a Comment or Feature Request
          </h3>
          <CommentForm />
        </GlassCard>

        {/* CTA */}
        <div className="text-center rounded-2xl px-6 py-8"
          style={{ background: "rgba(0,217,255,0.05)", border: "1px solid rgba(0,217,255,0.15)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Have a feature idea? Add it above or email{" "}
            <a href="mailto:support@chaintracing.org" className="font-semibold"
              style={{ color: "#00D9FF" }}>
              support@chaintracing.org
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}

import GlassCard from "@/components/GlassCard";

const PARAGRAPHS = [
  "Last year I got hit by an impersonation scam. Someone I thought I was talking to wasn't who they said they were, and a few thousand dollars in crypto moved to a wallet I didn't control before I realized what had happened.",
  "I did what everyone does next: I opened a block explorer, stared at a string of transactions I didn't understand, and started Googling.",
  "Here's what I found. Professional forensics firms quote $500 to $5,000. For someone who just lost money, that's a second gut-punch. Free block explorers show you everything and explain nothing. Community subreddits work only if a stranger cares enough to help.",
  "There's a gap in the middle, and that gap is where most victims actually live. People who've lost enough money to care, but not enough to justify a $2,000 forensics bill.",
  "That's who ChainTracing is for. A $14.99 Quick Scan and a $29.99 Deep Trace priced for the person who just lost two months of rent and wants to know if their funds hit an exchange before they file a police report that might actually get taken seriously.",
  "Built from Pakistan, solo, in public. No VC money, no promises of recovery, just the forensic evidence victims need to take the next step.",
];

export default function WhyWeBuilt() {
  return (
    <GlassCard>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
        Why we built ChainTracing
      </h2>
      <div className="space-y-4">
        {PARAGRAPHS.map((p, i) => (
          <p key={i} className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {p}
          </p>
        ))}
      </div>
      <p className="mt-6 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
        Talha Mahmood, Founder
      </p>
    </GlassCard>
  );
}

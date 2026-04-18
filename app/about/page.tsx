import Image from "next/image";
import { Mail, ArrowUpRight } from "lucide-react";

export const metadata = {
  title: "About — ChainTracing",
  description: "Talha Mahmood, Founder of ChainTracing. Building forensic-grade crypto tracing tools for victims.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen relative z-10 flex items-start justify-center px-4 py-24">
      <div className="w-full max-w-3xl flex flex-col items-center gap-10">

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
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
            Talha Mahmood
          </h1>
          <p className="text-base font-semibold uppercase tracking-widest" style={{ color: "#00D9FF" }}>
            Founder, ChainTracing
          </p>
        </div>

        {/* Bio */}
        <div
          className="w-full rounded-2xl p-8 flex flex-col gap-5"
          style={{
            background: "rgba(10,22,40,0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,217,255,0.15)",
            boxShadow: "0 0 40px rgba(0,217,255,0.07), 0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
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
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>$9.99 evidence report</span>{" "}
            any victim can hand to police or an exchange compliance team.
          </p>

          <p className="text-sm leading-relaxed italic" style={{ color: "rgba(180,200,220,0.6)" }}>
            ChainTracing is not a recovery service. We do not contact exchanges or law enforcement on your
            behalf. We provide forensic-grade evidence so you can.
          </p>
        </div>

        {/* Contact card */}
        <div
          className="w-full rounded-2xl p-8"
          style={{
            background: "rgba(10,22,40,0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,217,255,0.15)",
            boxShadow: "0 0 40px rgba(0,217,255,0.07), 0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: "#00D9FF" }}>
            Contact
          </h2>
          <div className="flex flex-col gap-4">
            <ContactRow icon={<Mail size={16} />} label="talha.mahmood666@gmail.com" href="mailto:talha.mahmood666@gmail.com" platform="Email" />
            <ContactRow icon={null} label="@talhamahmood666" href="https://x.com/talhamahmood666" platform="X" />
            <ContactRow icon={null} label="talha-m" href="https://www.linkedin.com/in/talha-m-70732497/" platform="LinkedIn" />
            <ContactRow icon={null} label="talhamahmood666" href="https://github.com/talhamahmood666" platform="GitHub" />
          </div>
        </div>

      </div>
    </div>
  );
}

function ContactRow({ icon, label, href, platform }: { icon: React.ReactNode; label: string; href: string; platform: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="flex items-center gap-3 group transition-colors duration-200"
      style={{ color: "var(--text-secondary)" }}
    >
      {icon && <span style={{ color: "#00D9FF" }}>{icon}</span>}
      <span className="text-sm font-semibold" style={{ color: "#00D9FF", minWidth: 64 }}>{platform}</span>
      <span className="text-sm group-hover:text-white transition-colors duration-200">{label}</span>
      <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100 transition-opacity duration-200" style={{ color: "#00D9FF" }} />
    </a>
  );
}

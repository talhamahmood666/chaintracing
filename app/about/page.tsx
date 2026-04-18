import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { FaXTwitter, FaLinkedin, FaGithub } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

export const metadata = {
  title: "About — ChainTracing",
  description: "Talha Mahmood, Founder of ChainTracing. Building forensic-grade crypto tracing tools for victims.",
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
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>$9.99 evidence report</span>{" "}
            any victim can hand to police or an exchange compliance team.
          </p>

          <p className="text-sm leading-relaxed italic" style={{ color: "rgba(180,200,220,0.6)" }}>
            ChainTracing is not a recovery service. We do not contact exchanges or law enforcement on your
            behalf. We provide forensic-grade evidence so you can.
          </p>
        </div>

        {/* Contact card */}
        <div className="w-full rounded-2xl p-8" style={GLASS}>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: "#00D9FF" }}>
            Contact
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ borderColor: "rgba(0,217,255,0.08)" }}>
            <ContactRow icon={<MdEmail size={20} />} platform="Email" label="talha.mahmood666@gmail.com" href="mailto:talha.mahmood666@gmail.com" first />
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

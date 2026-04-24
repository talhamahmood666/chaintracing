import type { Metadata } from "next";
import GlassCard from "@/components/GlassCard";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — ChainTracing",
  description: "Questions, partnership inquiries, or press? Get in touch with the ChainTracing team.",
  alternates: { canonical: "/contact" },
};

const SOCIALS = [
  {
    label: "X (Twitter)",
    href: "https://x.com/talhamahmood666",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  {
    label: "Farcaster",
    href: "https://farcaster.xyz/talhamahmood666",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.997 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 11.997 12C18.628 24 24 18.628 24 12c0-6.627-5.372-12-12.003-12zm-.79 6.667h1.58l.413 2.222h1.967V6.667h1.58v2.222h1.253v1.778h-1.253v5.332c0 .492.223.89.671 1.001l.985.25v1.083H15.5l-1.52-.389c-.92-.235-1.48-1.016-1.48-1.945V10.667H11.2v5.332c0 .929-.562 1.71-1.48 1.945l-1.52.389H6.597v-1.083l.985-.25c.449-.112.671-.51.671-1.001v-5.332H7v-1.778h1.253V6.667h1.58v2.222h1.967l.407-2.222z" />
      </svg>
    ),
  },
  {
    label: "Dev.to",
    href: "https://dev.to/talhamahmood666",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.52v1.28l-.72.04-.75.03v1.77l1.22.03 1.2.04v1.28h-1.6c-1.53 0-1.6-.01-1.87-.3l-.3-.28v-3.16c0-3.02.01-3.18.25-3.48.23-.31.25-.31 1.88-.31h1.64v1.29zm4.68 5.45c-.17.43-.64.79-1 .79-.18 0-.45-.15-.67-.39-.32-.32-.45-.63-.82-2.08l-.9-3.39-.45-1.67h.76c.4 0 .75.02.75.05 0 .06 1.16 4.54 1.26 4.83.04.15.32-.7.73-2.3l.66-2.52.74-.04c.4-.02.73 0 .73.04 0 .14-1.67 6.38-1.8 6.68z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/chaintracingorg",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen relative z-10">
      <div className="max-w-3xl mx-auto px-4 py-20">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: "var(--text-primary)" }}>
            Get in Touch
          </h1>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            Questions, partnership inquiries, or press? We reply within 24 hours.
          </p>
        </div>

        {/* Form */}
        <GlassCard className="mb-10">
          <ContactForm />
        </GlassCard>

        {/* Other ways to reach us */}
        <GlassCard>
          <h2 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
            Other Ways to Reach Us
          </h2>
          <div className="space-y-4">
            <a href="mailto:support@chaintracing.org"
              className="flex items-center gap-3 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#00D9FF" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              support@chaintracing.org
            </a>

            <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>Follow us</p>
              <div className="flex flex-wrap gap-3">
                {SOCIALS.map(({ label, href, icon }) => (
                  <a key={label} href={href}
                    target={href === "#" ? undefined : "_blank"}
                    rel={href === "#" ? undefined : "noopener noreferrer"}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:opacity-80"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: href === "#" ? "var(--text-muted)" : "var(--text-secondary)",
                      cursor: href === "#" ? "default" : "pointer",
                    }}
                    aria-label={label}
                  >
                    {icon}
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}

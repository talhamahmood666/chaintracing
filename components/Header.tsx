'use client';

import AuthButton from "./AuthButton";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Trace" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/report-scammer", label: "Report Scammer" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass border-b border-white/[0.06] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black tracking-tight text-lg shrink-0">
            <span style={{ color: '#00D9FF' }} className="text-glow-cyan">Chain</span>
            <span className="text-white">Tracing</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href + label}
                href={href}
                className="text-sm font-semibold transition-colors duration-200"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: auth + hamburger */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <AuthButton />
          </div>

          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 transition-all duration-200" style={{ background: 'var(--text-secondary)', transform: open ? 'rotate(45deg) translate(3px, 3px)' : 'none' }} />
            <span className="block w-5 h-0.5 transition-all duration-200" style={{ background: 'var(--text-secondary)', opacity: open ? 0 : 1 }} />
            <span className="block w-5 h-0.5 transition-all duration-200" style={{ background: 'var(--text-secondary)', transform: open ? 'rotate(-45deg) translate(3px, -3px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06]" style={{ background: 'rgba(10,22,40,0.98)', backdropFilter: 'blur(20px)' }}>
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href + label}
                href={href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/[0.06] mt-1">
              <AuthButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

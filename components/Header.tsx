import AuthButton from "./AuthButton";
import Link from "next/link";

export default function Header() {
  return (
    <header className="glass border-b border-white/[0.06] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-black tracking-tight text-lg">
          <span style={{ color: '#00D9FF' }} className="text-glow-cyan">Chain</span>
          <span className="text-white">Tracing</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-semibold transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
          >
            Trace
          </Link>
          <Link
            href="/about"
            className="text-sm font-semibold transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
          >
            About
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}

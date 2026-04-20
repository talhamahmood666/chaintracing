import Link from "next/link";
import DisclaimerModal from "./DisclaimerModal";

export default function Footer() {
  return (
    <footer className="border-t mt-16" style={{ borderColor: 'var(--border-glass)', background: 'rgba(10,22,40,0.8)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} ChainTracing. Informational use only — not legal advice.
        </p>
        <nav className="flex items-center gap-6 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/report-scammer" className="hover:text-white transition-colors">Report a Scammer</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <DisclaimerModal />
          <a href="mailto:support@chaintracing.app" className="hover:text-white transition-colors">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

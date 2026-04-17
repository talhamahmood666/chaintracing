import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <nav className="px-6 py-3 flex items-center gap-6 text-sm"
        style={{ background: 'rgba(10,22,40,0.95)', borderBottom: '1px solid rgba(255,71,87,0.2)', backdropFilter: 'blur(12px)' }}>
        <span className="font-black mr-4 text-base" style={{ color: '#FF4757', fontFamily: 'var(--font-geist-mono)' }}>
          ⬡ ADMIN
        </span>
        {[
          { href: '/admin', label: 'Overview' },
          { href: '/admin/reports', label: 'Reports' },
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/scam-db', label: 'Scam DB' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(232,244,253,0.5)' }}>
            {label}
          </Link>
        ))}
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

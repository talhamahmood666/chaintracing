import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const ADMIN_LABELS: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/reports': 'Reports',
  '/admin/users': 'Users',
  '/admin/scam-db': 'Scam DB',
  '/admin/submissions': 'Submissions',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // M6: gate the entire admin section before rendering any child
  try {
    const { requireAdmin } = await import("@/lib/auth-admin");
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const hdrs = await headers();
  const pathname = hdrs.get("x-invoke-path") ?? hdrs.get("x-pathname") ?? "";
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
          { href: '/admin/submissions', label: 'Submissions' },
          { href: '/admin/community-reports', label: 'Community Reports' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="font-medium transition-colors hover:text-white"
            style={{ color: 'rgba(232,244,253,0.5)' }}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <nav className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          {Object.entries(ADMIN_LABELS).filter(([path]) => path !== '/admin' && pathname?.startsWith(path)).map(([path, label]) => (
            <span key={path} className="flex items-center gap-1.5">
              <span>/</span>
              <Link href={path} className="hover:text-white transition-colors">{label}</Link>
            </span>
          ))}
        </nav>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}

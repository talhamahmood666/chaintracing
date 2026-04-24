import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // M6: gate the entire admin section before rendering any child
  try {
    const { requireAdmin } = await import("@/lib/auth-admin");
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-6 py-6">{children}</main>
    </div>
  );
}

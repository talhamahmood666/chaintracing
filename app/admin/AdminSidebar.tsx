"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Database,
  Inbox,
  MessageSquare,
  Mail,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/admin",                    label: "Overview",          icon: LayoutDashboard },
  { href: "/admin/reports",            label: "Reports",           icon: FileText        },
  { href: "/admin/users",              label: "Users",             icon: Users           },
  { href: "/admin/scam-db",            label: "Scam DB",           icon: Database        },
  { href: "/admin/submissions",        label: "Submissions",       icon: Inbox           },
  { href: "/admin/community-reports",  label: "Community Reports", icon: MessageSquare   },
  { href: "/admin/contact",            label: "Contact",           icon: Mail            },
];

const STORAGE_KEY = "admin-sidebar-collapsed";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard, must run once on mount
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(c => {
      localStorage.setItem(STORAGE_KEY, !c ? "1" : "0");
      return !c;
    });
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebarContent = (mobile = false) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,71,87,0.2)" }}>
        {(!collapsed || mobile) && (
          <span className="font-black text-base tracking-tight"
            style={{ color: "#FF4757", fontFamily: "var(--font-geist-mono)" }}>
            ⬡ ADMIN
          </span>
        )}
        {collapsed && !mobile && (
          <span className="font-black text-base mx-auto"
            style={{ color: "#FF4757", fontFamily: "var(--font-geist-mono)" }}>
            ⬡
          </span>
        )}
        {mobile ? (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 rounded"
            style={{ color: "rgba(232,244,253,0.5)" }}>
            <X size={18} />
          </button>
        ) : (
          <button onClick={toggleCollapsed} className="p-1 rounded transition-colors hover:text-white"
            style={{ color: "rgba(232,244,253,0.5)" }}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              onClick={() => mobile && setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                color: active ? "#FF4757" : "rgba(232,244,253,0.55)",
                background: active ? "rgba(255,71,87,0.1)" : "transparent",
                minHeight: 40,
              }}
              title={collapsed && !mobile ? label : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} className="shrink-0" />
              {(!collapsed || mobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  if (!mounted) {
    // SSR placeholder — avoids hydration mismatch
    return (
      <>
        <div className="hidden md:block w-60 shrink-0" />
        <div className="md:hidden" />
      </>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-full shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 64 : 240,
          background: "rgba(10,22,40,0.98)",
          borderRight: "1px solid rgba(255,71,87,0.15)",
          backdropFilter: "blur(12px)",
          zIndex: 200,
        }}
      >
        {sidebarContent(false)}
      </aside>

      {/* Desktop spacer */}
      <div className="hidden md:block shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 64 : 240 }} />

      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-3 z-[300] p-2 rounded-lg"
        style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(255,71,87,0.3)", color: "#FF4757" }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[298]"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="md:hidden fixed left-0 top-0 h-full z-[299] flex flex-col transition-transform duration-200"
        style={{
          width: 240,
          background: "rgba(10,22,40,0.98)",
          borderRight: "1px solid rgba(255,71,87,0.15)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
}

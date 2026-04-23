"use client";

import { createClient } from "@/lib/supabase-browser";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email?: string;
  user_metadata?: { avatar_url?: string; full_name?: string; name?: string };
};

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetch("/api/stats/is-admin").then(r => r.json()).then(d => setIsAdmin(!!d.admin)).catch(() => {});
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetch("/api/stats/is-admin").then(r => r.json()).then(d => setIsAdmin(!!d.admin)).catch(() => {});
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = user?.user_metadata?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    ?? user?.email?.slice(0, 2).toUpperCase() ?? "?";

  if (loading) return <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />;

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <a href="/login" className="text-sm font-semibold transition-colors duration-200"
          style={{ color: 'var(--text-secondary)' }}>
          Sign In
        </a>
        <a href="/signup"
          className="px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 min-h-[44px] flex items-center"
          style={{ background: 'var(--cyan)', color: '#0A1628' }}>
          Get Started
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          if (!menuOpen && buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect();
            setDropdownPos({ top: r.bottom + window.scrollY + 8, right: window.innerWidth - r.right });
          }
          setMenuOpen(!menuOpen);
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm transition-all duration-200 min-w-[44px] min-h-[44px]"
        style={{ background: 'rgba(0,217,255,0.15)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}
        title={user.email ?? "Account"}
      >
        {initials}
        {isAdmin && (
          <span className="absolute -bottom-1 -right-1 px-1 rounded text-white font-black leading-none"
            style={{ background: '#FF4757', fontSize: 8 }}>
            ADMIN
          </span>
        )}
      </button>

      {menuOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setMenuOpen(false)} />
          <div className="fixed w-48 rounded-xl overflow-hidden" style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999, background: '#0A1628', border: '1px solid var(--border-glass)' }} onClick={e => e.stopPropagation()}>
            {user.email && (
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
              </div>
            )}
            {isAdmin && (
              <a href="/admin"
                className="block px-4 py-2.5 text-sm font-bold transition-colors duration-200 min-h-[44px] flex items-center"
                style={{ color: '#FF4757', borderBottom: '1px solid var(--border-glass)' }}
                onClick={() => setMenuOpen(false)}>
                Admin Panel
              </a>
            )}
            <a href="/dashboard"
              className="block px-4 py-2.5 text-sm font-medium transition-colors duration-200 min-h-[44px] flex items-center"
              style={{ color: 'var(--text-primary)' }}
              onClick={() => setMenuOpen(false)}>
              Dashboard
            </a>
            <a href="/report-scam"
              className="block px-4 py-2.5 text-sm font-medium transition-colors duration-200 min-h-[44px] flex items-center"
              style={{ color: '#FF4757' }}
              onClick={() => setMenuOpen(false)}>
              Submit Scam (Dashboard)
            </a>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-200 min-h-[44px]"
              style={{ color: 'var(--red)' }}>
              Sign Out
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

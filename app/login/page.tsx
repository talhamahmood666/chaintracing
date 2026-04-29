"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)',
  outline: 'none',
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push(next); router.refresh(); }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-tight" style={{ color: '#00D9FF' }}>
            Chain<span style={{ color: 'var(--text-primary)' }}>Tracing</span>
          </Link>
          <h1 className="text-xl font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>Sign in to your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No account?{" "}
            <Link href="/signup" className="font-medium" style={{ color: '#00D9FF' }}>Sign up free</Link>
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <button type="button" onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 mb-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
            <GoogleIcon /> Continue with Google
          </button>

          <div className="relative mb-5">
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>or</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <p className="text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
                {error}
              </p>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,217,255,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,217,255,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs font-medium" style={{ color: '#00D9FF' }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628', opacity: loading ? 0.6 : 1 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg-primary)' }} />}>
      <LoginForm />
    </Suspense>
  );
}

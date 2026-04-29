"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)',
  outline: 'none',
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess("Check your email for a password reset link.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-tight" style={{ color: '#00D9FF' }}>
            Chain<span style={{ color: 'var(--text-primary)' }}>Tracing</span>
          </Link>
          <h1 className="text-xl font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>Reset your password</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Remember it?{" "}
            <Link href="/login" className="font-medium" style={{ color: '#00D9FF' }}>Sign in</Link>
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <p className="text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676' }}>
                {success}
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
            <button type="submit" disabled={loading || !!success}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628', opacity: loading || !!success ? 0.6 : 1 }}>
              {loading ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

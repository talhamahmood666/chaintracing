"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--text-primary)',
  outline: 'none',
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase puts the recovery token in the URL fragment after email link click.
    // The SSR client picks it up automatically on mount.
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Also check immediately in case the event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, [supabase]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/login?reset=success");
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Checking your reset link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-tight" style={{ color: '#00D9FF' }}>
            Chain<span style={{ color: 'var(--text-primary)' }}>Tracing</span>
          </Link>
          <h1 className="text-xl font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>Set new password</h1>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <p className="text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
                {error}
              </p>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                autoComplete="new-password" placeholder="Min 8 characters"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,217,255,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                autoComplete="new-password" placeholder="Retype your password"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'rgba(0,217,255,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #00D9FF, #0099BB)', color: '#0A1628', opacity: loading ? 0.6 : 1 }}>
              {loading ? "Updating password..." : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

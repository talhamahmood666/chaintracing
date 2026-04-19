'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getAdminClient } from "@/lib/supabase";

interface PaymentData {
  walletAddress: string;
  amount: string;
  currency: string;
  qrCode: string;
  expiresAt: string;
  txnId: string;
}

function useCountdown(expiresAt: string | undefined): number | null {
  // null = not yet initialised (avoid false "expired" on first render)
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    // Guard: if expiresAt looks like a bare Unix timestamp in seconds, convert it.
    const ms = /^\d{9,11}$/.test(expiresAt.trim())
      ? Number(expiresAt) * 1000
      : new Date(expiresAt).getTime();
    const calc = () => Math.max(0, Math.floor((ms - Date.now()) / 1000));
    setSecs(calc());
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return secs;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function PayPage() {
  const router = useRouter();
  const params = useParams<{ reportId: string }>();
  const searchParams = useSearchParams();
  const reportId = params.reportId;
  const token = searchParams.get("token") ?? "";

  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [orderLabel, setOrderLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [pollStatus, setPollStatus] = useState<string>("pending");

  const secs = useCountdown(paymentData?.expiresAt);

  // Only mark expired once the countdown has initialised (secs !== null) and
  // actually reached zero — prevents false-positive on first render.
  useEffect(() => {
    if (secs === 0 && paymentData) setExpired(true);
  }, [secs, paymentData]); // secs===null is never 0, so this is safe

  useEffect(() => {
    if (!reportId || !token) return;

    // Check status first — skip countdown if already resolved
    fetch(`/api/payment-status/${reportId}?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === "paid" || d.status === "failed") {
          if (d.status === "paid") router.replace(`/report/${reportId}?token=${token}`);
          else setPollStatus(d.status);
        }
      })
      .catch(() => {});

    fetch(`/api/payment-data/${reportId}?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.paymentData) {
          const pd: PaymentData = d.paymentData;
          // If already expired on load, show expired (CTA to restart — handled below)
          if (pd.expiresAt) {
            const ms = /^\d{9,11}$/.test(pd.expiresAt.trim())
              ? Number(pd.expiresAt) * 1000
              : new Date(pd.expiresAt).getTime();
            if (ms < Date.now()) setExpired(true);
          }
          setPaymentData(pd);
        }
        if (d.orderLabel) setOrderLabel(d.orderLabel);
      })
      .catch(() => {});
  }, [reportId, token, router]);

  // Poll status every 5s
  useEffect(() => {
    if (!reportId || !token || expired) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/payment-status/${reportId}?token=${token}`);
        const d = await r.json();
        setPollStatus(d.status);
        if (d.status === "paid") {
          router.replace(`/report/${reportId}?token=${token}`);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, [reportId, token, router, expired]);

  const copy = useCallback(() => {
    if (!paymentData) return;
    navigator.clipboard.writeText(paymentData.walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [paymentData]);

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(0,217,255,0.3)', borderTopColor: '#00D9FF' }} />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⏱</div>
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Invoice Expired</h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>The payment window has closed. Start a new trace to generate a fresh invoice.</p>
          <a href="/" className="inline-block px-6 py-3 rounded-xl font-bold text-sm" style={{ background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF' }}>
            Start New Trace
          </a>
        </div>
      </div>
    );
  }

  const secsNum = secs ?? 0;
  const pct = paymentData.expiresAt && secs !== null
    ? Math.min(100, (secsNum / Math.max(1, Math.floor((new Date(paymentData.expiresAt).getTime() - Date.now() + secsNum * 1000) / 1000))) * 100)
    : 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass rounded-2xl p-8 max-w-lg w-full glow-cyan">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>ChainTracing</p>
            <h1 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{orderLabel || 'Complete Payment'}</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: '#00D9FF' }}>
              {paymentData.amount} {paymentData.currency}
            </div>
            <div className="text-xs mt-0.5" style={{ color: pollStatus === 'pending' ? 'var(--text-muted)' : '#00E676' }}>
              {pollStatus === 'pending' ? 'Awaiting payment' : pollStatus}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Time remaining</span>
            <span className="font-mono font-bold" style={{ color: secsNum < 120 ? '#FF4757' : 'var(--text-primary)' }}>{secs !== null ? fmt(secsNum) : '—'}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: secsNum < 120 ? '#FF4757' : '#00D9FF' }}
            />
          </div>
        </div>

        {/* QR Code */}
        {paymentData.qrCode && (
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-xl" style={{ background: '#fff' }}>
              <img
                src={paymentData.qrCode.startsWith('data:') ? paymentData.qrCode : `data:image/png;base64,${paymentData.qrCode}`}
                alt="Payment QR"
                width={160}
                height={160}
                className="block"
              />
            </div>
          </div>
        )}

        {/* Wallet Address */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Send {paymentData.currency} to
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,217,255,0.15)' }}>
            <code className="flex-1 text-xs break-all font-mono" style={{ color: 'var(--text-primary)' }}>
              {paymentData.walletAddress}
            </code>
            <button
              onClick={copy}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: copied ? 'rgba(0,230,118,0.15)' : 'rgba(0,217,255,0.1)',
                border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : 'rgba(0,217,255,0.2)'}`,
                color: copied ? '#00E676' : '#00D9FF',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Amount reminder */}
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.15)', color: 'rgba(255,165,0,0.8)' }}>
          <span>⚠</span>
          <span>Send exactly <strong>{paymentData.amount} {paymentData.currency}</strong>. Partial payments will not unlock the report.</span>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          This page auto-refreshes. You will be redirected once payment is confirmed.
        </p>
      </div>
    </div>
  );
}

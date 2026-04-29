'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import TraceLoadingOverlay from "./TraceLoadingOverlay";
import { useRouter } from "next/navigation";
import { IntentSelector, type Intent } from "@/components/IntentSelector";
import { createClient } from "@/lib/supabase-browser";

const HISTORY_KEY = "chaintracing_address_history";
const HISTORY_MAX = 10;

interface HistoryEntry {
  address: string;
  chain: string;
  timestamp: number;
}

const CHAIN_LABELS: Record<string, string> = {
  eth: "Ethereum", bsc: "BNB", polygon: "Polygon", arbitrum: "Arbitrum",
  base: "Base", solana: "Solana", tron: "Tron", btc: "Bitcoin",
};

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function relTime(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const TRON_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const BTC_RE = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;

const EVM_CHAINS = new Set(["eth", "bsc", "polygon", "arbitrum", "base"]);

interface ValidationResult {
  valid: boolean;
  suggestedChain?: string;
  message?: string;
}

export function validateAddressForChain(address: string, chain: string): ValidationResult {
  const a = address.trim();
  if (!a) return { valid: true };

  const matches = {
    evm: EVM_RE.test(a),
    solana: SOL_RE.test(a) && !TRON_RE.test(a), // tron is a subset of base58
    tron: TRON_RE.test(a),
    btc: BTC_RE.test(a),
  };

  let ok = false;
  if (EVM_CHAINS.has(chain)) ok = matches.evm;
  else if (chain === "solana") ok = matches.solana;
  else if (chain === "tron") ok = matches.tron;
  else if (chain === "btc") ok = matches.btc;

  if (ok) return { valid: true };

  let suggested: string | undefined;
  if (matches.evm) suggested = "eth";
  else if (matches.tron) suggested = "tron";
  else if (matches.btc) suggested = "btc";
  else if (matches.solana) suggested = "solana";

  const chainLabel = CHAIN_LABELS[chain] ?? chain;
  let msg = `This doesn't look like a valid ${chainLabel} address.`;
  if (suggested && suggested !== chain) {
    msg += ` Did you mean ${CHAIN_LABELS[suggested]}?`;
  }
  return { valid: false, suggestedChain: suggested, message: msg };
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistoryEntry(address: string, chain: string) {
  try {
    const existing = loadHistory();
    const filtered = existing.filter(
      e => !(e.address.toLowerCase() === address.toLowerCase() && e.chain === chain)
    );
    const next = [{ address, chain, timestamp: Date.now() }, ...filtered].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — silently skip
  }
}

export default function TraceForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("eth");
  const [intent, setIntent] = useState<Intent>("lost_money");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveScans, setLiveScans] = useState<number | null>(null);
  const [liveFlagged, setLiveFlagged] = useState<number | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [startTxid, setStartTxid] = useState("");
  const [startVout, setStartVout] = useState("0");
  const [txidError, setTxidError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- init from localStorage + API on mount
    setHistory(loadHistory());
    fetch("/api/stats").then(r => r.json()).then(d => {
      if (d.scans) setLiveScans(d.scans);
      if (d.flagged) setLiveFlagged(d.flagged);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const validation = useMemo(() => validateAddressForChain(address, chain), [address, chain]);

  const dropdownEntries = useMemo(() => {
    const q = address.trim().toLowerCase();
    if (!q) return history.slice(0, 5);
    return history.filter(e => e.address.toLowerCase().startsWith(q)).slice(0, 5);
  }, [address, history]);

  const showDropdown = focused && dropdownEntries.length > 0;

  const clearHistory = () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    setHistory([]);
  };

  const pickEntry = (entry: HistoryEntry) => {
    setAddress(entry.address);
    setChain(entry.chain);
    setFocused(false);
  };

  const TXID_RE = /^[0-9a-f]{64}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { setError("Enter a wallet address or transaction hash to trace."); return; }

    // Validate UTXO fields for BTC advanced mode
    if (chain === "btc" && advancedOpen && startTxid.trim()) {
      if (!TXID_RE.test(startTxid.trim())) {
        setTxidError("Transaction ID must be 64 hex characters");
        return;
      }
      const voutNum = parseInt(startVout, 10);
      if (isNaN(voutNum) || voutNum < 0) {
        setTxidError("Output index required when txid is provided");
        return;
      }
    }
    if (chain === "btc" && advancedOpen && !startTxid.trim() && startVout !== "0") {
      setTxidError("Transaction ID required when output index is set");
      return;
    }

    setLoading(true);
    setError(null);
    setTxidError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const utxoMode = chain === "btc" && advancedOpen && TXID_RE.test(startTxid.trim());
    const body: Record<string, unknown> = { address: address.trim(), chain, intent, userId: user?.id };
    if (utxoMode) {
      body.startTxid = startTxid.trim();
      body.startVout = parseInt(startVout, 10) || 0;
    }

    const res = await fetch("/api/trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error || "Trace failed. Please check the address and try again."); setLoading(false); return; }
    if (data.reportId) {
      saveHistoryEntry(address.trim(), chain);
      setHistory(loadHistory());
      const base = data.isAdmin
        ? `/report/${data.reportId}?token=${data.viewToken}&admin=1`
        : `/report/${data.reportId}?token=${data.viewToken}`;
      router.push(data.utxoMode ? `${base}&utxo=1` : base);
    } else {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
    {loading && <TraceLoadingOverlay />}
    <div className="glass rounded-2xl p-8 glow-cyan">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>
        Check a Wallet for Scam Activity
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div ref={wrapperRef} className="relative">
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Scammer Wallet Address or Transaction Hash
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={e => { setFocused(true); e.target.style.borderColor = 'rgba(0,217,255,0.5)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(0,217,255,0.2)'; }}
            placeholder="Paste wallet address (0x..., T..., bc1..., or Solana) or tx hash"
            disabled={loading}
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl text-sm font-mono"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(0,217,255,0.2)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />

          {showDropdown && (
            <div
              className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
              style={{
                background: 'rgba(10,22,40,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,217,255,0.25)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(0,217,255,0.1)' }}>
                Recent wallet traces
              </div>
              {dropdownEntries.map((e, i) => (
                <button
                  key={`${e.address}-${e.chain}-${i}`}
                  type="button"
                  onMouseDown={ev => ev.preventDefault()}
                  onClick={() => pickEntry(e)}
                  className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left transition-colors"
                  style={{ background: 'transparent', color: 'var(--text-primary)' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(0,217,255,0.08)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                >
                  <span className="text-xs font-mono">{truncate(e.address)}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ background: 'rgba(0,217,255,0.12)', color: '#00D9FF' }}
                  >
                    {CHAIN_LABELS[e.chain] ?? e.chain}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{relTime(e.timestamp)}</span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={ev => ev.preventDefault()}
                onClick={clearHistory}
                className="w-full px-3 py-2 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-muted)', borderTop: '1px solid rgba(0,217,255,0.1)', background: 'transparent' }}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,71,87,0.08)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
              >
                Clear trace history
              </button>
            </div>
          )}

          {!validation.valid && validation.message && (
            <p
              className="text-xs mt-1.5 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
              }}
            >
              ⚠ {validation.message}
            </p>
          )}

          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Free: 2 hops anonymous · 5 hops signed in · Risk score + scam database check included</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Blockchain Network
          </label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          >
            <option value="eth" style={{ background: '#0D1B2A' }}>Ethereum</option>
            <option value="bsc" style={{ background: '#0D1B2A' }}>BNB Smart Chain</option>
            <option value="polygon" style={{ background: '#0D1B2A' }}>Polygon</option>
            <option value="arbitrum" style={{ background: '#0D1B2A' }}>Arbitrum</option>
            <option value="base" style={{ background: '#0D1B2A' }}>Base</option>
            <option value="solana" style={{ background: '#0D1B2A' }}>Solana</option>
            <option value="tron" style={{ background: '#0D1B2A' }}>Tron</option>
            <option value="btc" style={{ background: '#0D1B2A' }}>Bitcoin</option>
          </select>
        </div>

        {chain === "btc" && (
          <div>
            <button
              type="button"
              onClick={() => { setAdvancedOpen(o => !o); setTxidError(null); }}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: advancedOpen ? "#00D9FF" : "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span style={{ fontSize: 10 }}>{advancedOpen ? "▼" : "▶"}</span>
              Advanced: UTXO forensic trace (optional)
            </button>
            {advancedOpen && (
              <div className="mt-3 rounded-xl p-4 space-y-3"
                style={{ background: "rgba(0,217,255,0.04)", border: "1px solid rgba(0,217,255,0.15)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  If you sent crypto to this address and have your transaction ID, ChainTracing can perform a precise UTXO-level forensic trace following your specific funds. Without a txid, you&apos;ll get a wallet profile analysis instead.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Your transaction ID (optional)
                  </label>
                  <input
                    type="text"
                    value={startTxid}
                    onChange={e => { setStartTxid(e.target.value); setTxidError(null); }}
                    placeholder="If you sent funds, paste the txid here"
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(0,217,255,0.2)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                      Output index
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={startVout}
                      onChange={e => { setStartVout(e.target.value); setTxidError(null); }}
                      placeholder="0"
                      disabled={loading}
                      className="px-3 py-2 rounded-lg text-xs font-mono w-20"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(0,217,255,0.2)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
                    The vout index of your payment (usually 0 or 1)
                  </p>
                </div>
                {txidError && (
                  <p className="text-xs px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.3)", color: "#FF4757" }}>
                    {txidError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <IntentSelector value={intent} onChange={setIntent} />

        {error && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: '#FF4757' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
          style={{
            background: loading || !address.trim() ? 'rgba(0,217,255,0.2)' : 'linear-gradient(135deg, #00D9FF, #0099BB)',
            color: loading || !address.trim() ? 'rgba(0,217,255,0.4)' : '#0A1628',
            cursor: loading || !address.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />
              Tracing across the blockchain…
            </span>
          ) : 'Trace This Wallet — Free'}
        </button>
      </form>

      {/* Trust indicators */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Wallets Traced', value: liveScans != null ? new Intl.NumberFormat('en-US').format(liveScans) : '—' },
          { label: 'Scam Wallets Flagged', value: liveFlagged != null ? new Intl.NumberFormat('en-US').format(liveFlagged) : '—' },
          { label: 'Blockchains Supported', value: '8' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <p className="text-xl font-black mb-1" style={{ color: '#00D9FF', fontFamily: 'var(--font-geist-mono)' }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

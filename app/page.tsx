"use client";

import { useState } from "react";
import type { Chain } from "@/lib/tracer";
import type { RiskFlag } from "@/lib/risk";
import {
  CHAIN_DISPLAY_NAMES,
  ADDRESS_PLACEHOLDERS,
  validateAddress as validateAddressShared,
} from "@/lib/chain-utils";

const CHAINS: { value: Chain; label: string; placeholder: string }[] = [
  "eth",
  "bsc",
  "polygon",
  "arbitrum",
  "solana",
  "tron",
].map((value) => ({
  value: value as Chain,
  label: CHAIN_DISPLAY_NAMES[value as Chain],
  placeholder: ADDRESS_PLACEHOLDERS[value as Chain],
}));

interface FreeResult {
  riskScore: number;
  riskLevel: string;
  riskSummary: string;
  flags: RiskFlag[];
  hopCount: number;
  hops: unknown[];
  firstHop: { to: string; label?: string } | null;
}

function RiskMeter({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  let color = "#16a34a";
  if (pct >= 75) color = "#dc2626";
  else if (pct >= 50) color = "#ea580c";
  else if (pct >= 25) color = "#d97706";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Low risk</span>
        <span>Critical risk</span>
      </div>
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-center mt-2">
        <span className="text-3xl font-black" style={{ color }}>
          {pct}
        </span>
        <span className="text-slate-400 text-lg">/100</span>
      </div>
    </div>
  );
}

function FlagBadge({ flag }: { flag: RiskFlag }) {
  const styles: Record<string, string> = {
    critical: "bg-red-50 border-red-200 text-red-700",
    high: "bg-orange-50 border-orange-200 text-orange-700",
    medium: "bg-yellow-50 border-yellow-200 text-yellow-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${styles[flag.severity] ?? styles.info}`}>
      <p className="font-semibold text-sm">{flag.label}</p>
      <p className="text-xs mt-0.5 opacity-80">{flag.description}</p>
    </div>
  );
}

// Use shared validation function
const validateAddress = (addr: string, c: Chain): string | null => {
  return validateAddressShared(addr, c);
};

export default function HomePage() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<Chain>("eth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<"quick" | "deep" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [result, setResult] = useState<FreeResult | null>(null);

  const selectedChain = CHAINS.find((c) => c.value === chain)!;

  // Clear address error whenever chain or address changes
  function handleAddressChange(val: string) {
    setAddress(val);
    if (addressError) setAddressError(null);
  }

  function handleChainChange(c: Chain) {
    setChain(c);
    if (addressError) setAddressError(null);
  }

  async function handleTrace(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;

    const addrErr = validateAddress(trimmed, chain);
    if (addrErr) {
      setAddressError(addrErr);
      return;
    }

    setLoading(true);
    setError(null);
    setAddressError(null);
    setResult(null);

    try {
      const res = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim(), chain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Trace failed. Please check the address and try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyTier(tier: "quick" | "deep") {
    if (!result) return;
    setCheckoutLoading(tier);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          chain,
          email: email.trim() || undefined,
          tier,
          hops: result.hops,
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          riskFlags: result.flags,
          riskSummary: result.riskSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed.");
        return;
      }
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Nav */}
      <nav className="px-6 py-5 max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-white text-xl font-bold tracking-tight">
          Chain<span className="text-blue-400">Tracing</span>
        </span>
        <span className="text-slate-400 text-sm">
          Helping victims trace stolen crypto
        </span>
      </nav>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-12 pb-10 text-center">
        <div className="inline-block bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wider">
          FREE RISK SCAN
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Trace where your stolen
          <br />
          <span className="text-blue-400">crypto went.</span>
        </h1>
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
          Enter the scammer&apos;s wallet address. We&apos;ll follow the money
          hop-by-hop until it reaches a known exchange — giving you real
          evidence to report to law enforcement.
        </p>

        {/* Trace form */}
        <form
          onSubmit={handleTrace}
          className="bg-white rounded-2xl p-6 text-left shadow-2xl"
        >
          {/* Chain selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Blockchain
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHAINS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleChainChange(c.value)}
                  className={`text-sm font-medium px-3 py-2 rounded-lg border transition-all ${
                    chain === c.value
                      ? "bg-blue-700 text-white border-blue-700"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address input */}
          <div className="mb-4">
            <label
              htmlFor="address"
              className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              Scammer&apos;s Wallet Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder={selectedChain.placeholder}
              className={`w-full border rounded-lg px-4 py-3 font-mono text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                addressError ? "border-red-400 bg-red-50" : "border-slate-300"
              }`}
              required
            />
            {addressError && (
              <p className="text-red-600 text-xs mt-1.5">{addressError}</p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                Tracing funds…
              </span>
            ) : (
              "Trace This Address — Free"
            )}
          </button>
        </form>
      </section>

      {/* Free results */}
      {result && (
        <section className="max-w-2xl mx-auto px-4 pb-12">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="font-bold text-slate-800 text-xl mb-1">
              Scan Complete
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              We traced{" "}
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                {address.slice(0, 8)}…{address.slice(-6)}
              </span>{" "}
              on {selectedChain.label}
              {result.riskLevel !== "info" && (
                <> and found {result.hopCount} hop{result.hopCount !== 1 ? "s" : ""}</>
              )}
              .
            </p>

            {/* Known exchange address — blue info banner, no risk meter */}
            {result.riskLevel === "info" ? (
              <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl mt-0.5">ℹ</span>
                  <div>
                    <p className="font-bold text-blue-900 mb-1">
                      {result.flags[0]?.label ?? "Known Exchange Address"}
                    </p>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {result.riskSummary}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Risk meter */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Risk Score
                  </p>
                  <RiskMeter score={result.riskScore} />
                </div>

                {/* Summary */}
                <p className="text-slate-700 text-sm leading-relaxed mb-5 bg-slate-50 rounded-lg p-4 border border-slate-100">
                  {result.riskSummary}
                </p>

                {/* Flags */}
                {result.flags.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Detected Flags
                    </p>
                    <div className="space-y-2">
                      {result.flags.map((f) => (
                        <FlagBadge key={f.id} flag={f} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* First hop teaser */}
            {result.firstHop && result.riskLevel !== "info" && (
              <div className="mb-5 bg-slate-50 rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-400 mb-1">First hop leads to</p>
                <p className="font-mono text-sm text-slate-700">
                  {result.firstHop.label ? (
                    <span className="font-semibold text-green-700">
                      {result.firstHop.label}
                    </span>
                  ) : (
                    <>
                      {result.firstHop.to.slice(0, 10)}…
                      <span className="text-slate-400 ml-2 text-xs">
                        (+{result.hopCount - 1} more hops hidden)
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Paywall CTA — hidden for known exchange addresses and 0-hop results */}
            {result.riskLevel !== "info" && result.hopCount === 0 && (
              <div className="border-t border-slate-100 pt-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
                  <p className="font-semibold text-slate-700 mb-1">
                    No outgoing transactions to trace
                  </p>
                  <p className="text-slate-500 text-sm">
                    This address has no outgoing transactions yet. Funds are
                    still here. Monitor the address using a block explorer and
                    check back if funds move.
                  </p>
                </div>
              </div>
            )}
            {result.riskLevel !== "info" && result.hopCount > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <p className="font-bold text-slate-800 text-lg mb-1">
                  Get the Full Evidence Report
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  Unlock every hop, all wallet addresses, exchange destinations,
                  and a timestamped PDF you can hand to police or a lawyer.
                </p>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email (optional — for report delivery)"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                {/* Two-tier pricing cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Quick Scan */}
                  <div className="border border-slate-200 rounded-xl p-4 flex flex-col">
                    <p className="font-bold text-slate-800 mb-0.5">Quick Scan</p>
                    <p className="text-2xl font-black text-blue-700 mb-2">$9.99</p>
                    <ul className="text-xs text-slate-500 space-y-1 mb-4 flex-1">
                      <li>✓ Up to 10 hops traced</li>
                      <li>✓ All wallet addresses</li>
                      <li>✓ Exchange destination</li>
                      <li>✓ Timestamped PDF evidence</li>
                      <li>✓ Block explorer links</li>
                    </ul>
                    <button
                      onClick={() => handleBuyTier("quick")}
                      disabled={checkoutLoading !== null}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {checkoutLoading === "quick"
                        ? "Redirecting…"
                        : "Buy Quick Scan — $9.99"}
                    </button>
                  </div>

                  {/* Deep Trace */}
                  <div className="border-2 border-blue-600 rounded-xl p-4 flex flex-col relative">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                      MOST EVIDENCE
                    </span>
                    <p className="font-bold text-slate-800 mb-0.5">Deep Trace</p>
                    <p className="text-2xl font-black text-blue-700 mb-2">$29.99</p>
                    <ul className="text-xs text-slate-500 space-y-1 mb-4 flex-1">
                      <li>✓ Everything in Quick Scan</li>
                      <li>✓ Up to 20 hops traced</li>
                      <li>✓ Bridge detection</li>
                      <li>✓ Mixer / Tornado Cash flags</li>
                      <li>✓ Wallet clustering analysis</li>
                      <li>✓ Timing analysis</li>
                      <li>✓ Exchange compliance letter</li>
                    </ul>
                    <button
                      onClick={() => handleBuyTier("deep")}
                      disabled={checkoutLoading !== null}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                      {checkoutLoading === "deep"
                        ? "Redirecting…"
                        : "Buy Deep Trace — $29.99"}
                    </button>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-3">
                  One-time payment · Secure crypto checkout via Plisio · Instant access
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How it works */}
      {!result && (
        <section className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-center text-white font-bold text-2xl mb-10">
            How ChainTracing works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Enter the address",
                body: "Paste the wallet address that received your stolen funds — from your transaction history or a scammer's known address.",
              },
              {
                step: "2",
                title: "We follow the money",
                body: "Our engine traces up to 20 hops across the blockchain, following the largest outgoing transfers through bridges and mixers until it hits a known exchange.",
              },
              {
                step: "3",
                title: "Get evidence",
                body: "Receive a risk score instantly for free. Choose Quick Scan ($9.99) for a hop-by-hop PDF, or Deep Trace ($29.99) for bridge detection, mixer flags, and an exchange compliance letter.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white/5 rounded-xl border border-white/10 p-6 text-white"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <span className="text-white font-bold text-lg">
            Chain<span className="text-blue-400">Tracing</span>
          </span>
          <p className="text-slate-500 text-xs text-center max-w-2xl leading-relaxed">
            <strong className="text-slate-400">Legal Disclaimer:</strong> ChainTracing
            is a blockchain analytics tool for evidence gathering only. Reports are
            generated from publicly available on-chain data and do not constitute
            legal advice. Wallet labels are sourced from community databases and
            may not be exhaustive or current. Exchange identification may be
            incomplete. ChainTracing is not responsible for the outcome of any
            legal or regulatory proceeding. Always consult a qualified legal
            professional for matters involving crypto asset recovery. All sales
            are final — reports are generated immediately upon payment.
          </p>
          <div className="flex gap-4 text-slate-600 text-xs">
            <span>© {new Date().getFullYear()} ChainTracing</span>
            <span>·</span>
            <span>Payments via Plisio</span>
            <span>·</span>
            <span>Report fraud to IC3.gov · Action Fraud · local authorities</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

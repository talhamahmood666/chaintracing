"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntentSelector } from "@/components/IntentSelector";
import { createClient } from "@/lib/supabase-browser";

export default function HomePage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [intent, setIntent] = useState<"curious" | "lost_money" | "law_enforcement">("lost_money");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntentWarning, setShowIntentWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError("Please enter a wallet address or transaction hash");
      return;
    }
    setLoading(true);
    setError(null);
    setShowIntentWarning(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const res = await fetch("/api/trace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: address.trim(),
        chain,
        intent,
        userId: user?.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Trace failed. Please try again.");
      setLoading(false);
      return;
    }

    if (data.reportId) {
      router.push(`/report/${data.reportId}?token=${data.viewToken}`);
    } else {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ChainTracing</h1>
          <p className="text-slate-600">
            Free blockchain forensics — trace stolen funds, identify scam wallets
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Wallet Address or Transaction Hash
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              disabled={loading}
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Blockchain</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BNB Smart Chain</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="solana">Solana</option>
              <option value="tron">Tron</option>
            </select>
          </div>

          <IntentSelector value={intent} onChange={setIntent} />

          {showIntentWarning && intent === "law_enforcement" && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-900 font-semibold text-sm mb-2">
                🚨 Law Enforcement Report
              </p>
              <p className="text-amber-800 text-sm">
                For law enforcement cases, we recommend the Deep Trace ($29.99) which includes compliance documentation and up to 20 hops. This provides the strongest evidence for legal proceedings.
              </p>
            </div>
          )}

          {error && (
            <>
              <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            </>
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
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Tracing...
              </span>
            ) : (
              "Start Free Trace"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Free tier limited to 2 hops. Deep scans unlock up to 20 hops and exchange deposit tracing.</p>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntentSelector } from "@/components/IntentSelector";
import GlassCard from "@/components/GlassCard";
import { createClient } from "@/lib/supabase-browser";

export default function HomePage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState("eth");
  const [intent, setIntent] = useState<"curious" | "lost_money" | "law_enforcement">("lost_money");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError("Please enter a wallet address");
      return;
    }
    setLoading(true);
    setError(null);

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
          <p className="text-slate-600">Free blockchain forensics — trace stolen funds, identify scam wallets</p>
        </div>

        <GlassCard className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Paste wallet address or transaction ID
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x... or transaction hash"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900 bg-white/20 backdrop-blur-sm placeholder:text-gray-500"
                disabled={loading}
              />
              <p className="text-sm text-slate-500 mt-1">
                We'll trace where funds moved — free for first 2 hops
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Choose blockchain</label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white/20 backdrop-blur-sm"
                disabled={loading}
              >
                <option value="eth">Ethereum</option>
                <option value="bsc">BNB Smart Chain</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="solana">Solana</option>
                <option value="tron">Tron</option>
              </select>
            </div>

            <IntentSelector value={intent} onChange={setIntent} />

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Tracing...' : 'Trace This Address — Free'}
            </button>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
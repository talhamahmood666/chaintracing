'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  reportId: string;
  address: string;
  chain: string;
  hopCount: number;
}

export default function ShareButtons({ reportId, address, chain, hopCount }: ShareButtonsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const truncatedAddress = `${address.slice(0, 8)}...${address.slice(-6)}`;

  const copyToClipboard = async (text: string, type: 'link' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);

      // Track share in database
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          platform: type === 'link' ? 'clipboard_link' : 'clipboard_summary',
        }),
      });
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleShareOnX = () => {
    const text = `I traced a crypto scam address (${truncatedAddress}) and found ${hopCount} suspicious hops on ${chain.toUpperCase()}. Free blockchain forensics tool 👉`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const generateSummary = () => {
    return `ChainTracing Report Summary
Address: ${truncatedAddress}
Chain: ${chain.toUpperCase()}
Hops Traced: ${hopCount}

I used ChainTracing (chaintracing.io) to trace this address for free. The funds moved through ${hopCount} intermediate addresses. Check out the full report!`;
  };

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Share Report</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.href : '', 'link')}
          className={`px-3 py-2 text-sm rounded-md border transition-colors ${
            copied === 'link'
              ? 'bg-green-100 border-green-300 text-green-700'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {copied === 'link' ? '✓ Link Copied!' : '📋 Copy Link'}
        </button>

        <button
          onClick={() => copyToClipboard(generateSummary(), 'summary')}
          className={`px-3 py-2 text-sm rounded-md border transition-colors ${
            copied === 'summary'
              ? 'bg-green-100 border-green-300 text-green-700'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {copied === 'summary' ? '✓ Summary Copied!' : '📝 Copy Anonymized Summary'}
        </button>

        <button
          onClick={handleShareOnX}
          className="px-3 py-2 text-sm rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors"
        >
          🐦 Share on X
        </button>
      </div>
    </div>
  );
}
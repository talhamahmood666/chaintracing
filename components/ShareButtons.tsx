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
  const truncated = `${address.slice(0, 8)}...${address.slice(-6)}`;

  const copyToClipboard = async (text: string, type: 'link' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, platform: type === 'link' ? 'clipboard_link' : 'clipboard_summary', sharedText: text }),
      });
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const handleX = () => {
    const text = `I traced a crypto scam address (${truncated}) and found ${hopCount} hops on ${chain.toUpperCase()}. Free blockchain forensics:`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const btnBase = "px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 min-h-[44px] flex items-center gap-1.5";

  return (
    <div className="glass rounded-xl p-4 mb-6">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Share Report</p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyToClipboard(typeof window !== 'undefined' ? window.location.href : '', 'link')}
          className={btnBase}
          style={{
            background: copied === 'link' ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${copied === 'link' ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: copied === 'link' ? '#00E676' : 'var(--text-secondary)',
          }}
        >
          {copied === 'link' ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        <button
          onClick={() => copyToClipboard(`ChainTracing Report\nAddress: ${truncated}\nChain: ${chain.toUpperCase()}\nHops: ${hopCount}`, 'summary')}
          className={btnBase}
          style={{
            background: copied === 'summary' ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${copied === 'summary' ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: copied === 'summary' ? '#00E676' : 'var(--text-secondary)',
          }}
        >
          {copied === 'summary' ? '✓ Copied!' : '📝 Copy Summary'}
        </button>
        <button onClick={handleX} className={btnBase}
          style={{ background: 'rgba(29,161,242,0.15)', border: '1px solid rgba(29,161,242,0.3)', color: '#1DA1F2' }}>
          𝕏 Share
        </button>
      </div>
    </div>
  );
}

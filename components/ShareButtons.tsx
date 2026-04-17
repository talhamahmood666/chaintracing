'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  reportId: string;
  address: string;
  chain: string;
  hopCount: number;
  riskScore?: number;
}

export default function ShareButtons({ reportId, address, chain, hopCount, riskScore = 0 }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const reportUrl = typeof window !== 'undefined' ? window.location.href : `https://chaintracing-app.vercel.app/report/${reportId}`;
  const tweetText = `I traced a crypto scam using ChainTracing. Risk score: ${riskScore}/100. ${hopCount} hops traced on ${chain.toUpperCase()}.`;

  const logShare = (platform: string) =>
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, platform, sharedText: tweetText }),
    }).catch(() => {});

  const handleX = () => {
    logShare('twitter');
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(reportUrl)}`,
      '_blank'
    );
  };

  const handleReddit = () => {
    logShare('reddit');
    window.open(
      `https://www.reddit.com/submit?url=${encodeURIComponent(reportUrl)}&title=${encodeURIComponent(tweetText)}`,
      '_blank'
    );
  };

  const handleTelegram = () => {
    logShare('telegram');
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(reportUrl)}&text=${encodeURIComponent(tweetText)}`,
      '_blank'
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      logShare('clipboard');
    } catch {}
  };

  const btn = "px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px]";

  return (
    <div className="glass rounded-xl p-5 mb-6 glow-cyan" style={{ border: '1px solid rgba(0,217,255,0.2)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-sm font-black uppercase tracking-widest" style={{ color: '#00D9FF' }}>Share This Trace</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Help others identify this scam wallet</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={handleX} className={btn}
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#E8F4FD' }}>
          𝕏 Twitter/X
        </button>
        <button onClick={handleReddit} className={btn}
          style={{ background: 'rgba(255,69,0,0.12)', border: '1px solid rgba(255,69,0,0.3)', color: '#FF4500' }}>
          Reddit
        </button>
        <button onClick={handleTelegram} className={btn}
          style={{ background: 'rgba(0,136,204,0.12)', border: '1px solid rgba(0,136,204,0.3)', color: '#0088CC' }}>
          Telegram
        </button>
        <button onClick={handleCopy} className={btn}
          style={{
            background: copied ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.1)'}`,
            color: copied ? '#00E676' : 'var(--text-secondary)',
          }}>
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
      </div>
    </div>
  );
}

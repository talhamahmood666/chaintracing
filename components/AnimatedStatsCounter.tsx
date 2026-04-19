'use client';

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Shield, Layers, Users } from "lucide-react";

function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let raf: number;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

export default function AnimatedStatsCounter({
  reportsCount,
  flaggedCount,
  communityReportsCount = 0,
}: {
  reportsCount: number;
  flaggedCount: number;
  communityReportsCount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  // SSR values as fallback — never show stale 0 when we have real SSR data (M5)
  const [stats, setStats] = useState({ scans: reportsCount, flagged: flaggedCount, chains: 8, community: communityReportsCount });
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => setFetchFailed(true));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const traced = useCountUp(stats.scans, 1800, visible);
  const flagged = useCountUp(stats.flagged, 1800, visible);
  const chains = useCountUp(stats.chains, 800, visible);
  const community = useCountUp(stats.community, 1800, visible);

  const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n);
  // M5: show "—" if both SSR and live fetch are unavailable (n===0 and fetchFailed)
  const display = (n: number, raw: number) =>
    fetchFailed && raw === 0 ? "—" : fmt(n);

  return (
    <div ref={ref} className="flex flex-wrap gap-6 justify-center md:justify-start">
      <div className="glass rounded-2xl px-5 py-4 text-center min-w-[110px]">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <TrendingUp className="w-4 h-4" style={{ color: '#00E676' }} />
        </div>
        <p className="font-mono font-black text-2xl" style={{ color: '#00D9FF' }}>{display(traced, stats.scans)}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>scams traced</p>
      </div>
      <div className="glass rounded-2xl px-5 py-4 text-center min-w-[110px]">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Shield className="w-4 h-4" style={{ color: '#00D9FF' }} />
        </div>
        <p className="font-mono font-black text-2xl" style={{ color: '#00D9FF' }}>{display(flagged, stats.flagged)}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>addresses flagged</p>
      </div>
      <div className="glass rounded-2xl px-5 py-4 text-center min-w-[110px]">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Layers className="w-4 h-4" style={{ color: '#9B59B6' }} />
        </div>
        <p className="font-mono font-black text-2xl" style={{ color: '#00D9FF' }}>{chains}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>chains supported</p>
      </div>
      <div className="glass rounded-2xl px-5 py-4 text-center min-w-[110px]">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Users className="w-4 h-4" style={{ color: '#FFA500' }} />
        </div>
        <p className="font-mono font-black text-2xl" style={{ color: '#00D9FF' }}>{display(community, stats.community)}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>community reports</p>
      </div>
    </div>
  );
}

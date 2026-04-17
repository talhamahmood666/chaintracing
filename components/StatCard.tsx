'use client';

import { SparklineChart } from './SparklineChart';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  accent?: string;
  sparkData?: number[];
}

export default function StatCard({ title, value, change, accent = '#00D9FF', sparkData }: StatCardProps) {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-black" style={{ color: accent, fontFamily: 'var(--font-geist-mono)' }}>{value}</p>
          {change && (
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{change}</p>
          )}
        </div>
        {sparkData && sparkData.length > 1 && (
          <div className="flex-shrink-0">
            <SparklineChart data={sparkData} color={accent} />
          </div>
        )}
      </div>
    </div>
  );
}

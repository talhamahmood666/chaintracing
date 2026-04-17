'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import type { Hop } from '@/lib/tracer';

interface TransactionFlowGraphProps {
  hops: Hop[];
}

const GRID_COLOR = 'rgba(255,255,255,0.05)';
const TICK_COLOR = 'rgba(232,244,253,0.35)';

export default function TransactionFlowGraph({ hops }: TransactionFlowGraphProps) {
  const flowData = useMemo(() => hops.map((hop) => ({
    hop: hop.hop,
    value: parseFloat(hop.value) || 0,
    address: hop.to.slice(0, 6) + '…' + hop.to.slice(-4),
    riskScore:
      (hop.isMixer ? 35 : 0) +
      (hop.isSanctioned ? 40 : 0) +
      (hop.isBridge ? 20 : 0) +
      (hop.scamMatches && hop.scamMatches.length > 0 ? 25 : 0),
  })), [hops]);

  if (hops.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        No transaction data
      </div>
    );
  }

  const barColor = (risk: number) =>
    risk >= 40 ? '#FF4757' : risk >= 20 ? '#FFA500' : '#00D9FF';

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>
        Transaction Flow
      </h3>

      <div className="mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={flowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="hop" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 10, color: '#E8F4FD', fontSize: 12 }}
              labelStyle={{ color: '#00D9FF' }}
              formatter={(v: unknown) => [`${v} ${hops[0]?.token ?? ''}`, 'Value']}
              labelFormatter={(l: unknown, p: readonly { payload?: { address?: string } }[]) => {
                const d = p[0]?.payload;
                return `Hop ${l} · ${d?.address ?? ''}`;
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#00D9FF" strokeWidth={2}
              dot={{ fill: '#00D9FF', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#00D9FF', stroke: 'rgba(0,217,255,0.4)', strokeWidth: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hops.length > 1 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Risk by Hop
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={flowData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="hop" tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,71,87,0.2)', borderRadius: 10, color: '#E8F4FD', fontSize: 12 }}
                formatter={(v: unknown) => {
                  const n = Number(v);
                  const lvl = n >= 40 ? 'Critical' : n >= 25 ? 'High' : n >= 15 ? 'Medium' : 'Low';
                  return [`${n} — ${lvl}`, 'Risk'];
                }}
              />
              <Bar dataKey="riskScore" radius={[3, 3, 0, 0]}>
                {flowData.map((d, i) => (
                  <Cell key={i} fill={barColor(d.riskScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#00D9FF' }} />Value</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#FF4757' }} />Risk</span>
      </div>
    </div>
  );
}

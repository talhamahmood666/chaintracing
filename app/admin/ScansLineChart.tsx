"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ScansLineChart({ data }: { data: { date: string; scans: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(232,244,253,0.4)', fontSize: 10 }} tickLine={false} axisLine={false}
          tickFormatter={v => v.slice(5)} />
        <YAxis tick={{ fill: 'rgba(232,244,253,0.4)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: 'rgba(232,244,253,0.6)' }}
          itemStyle={{ color: '#00D9FF' }}
        />
        <Line type="monotone" dataKey="scans" stroke="#00D9FF" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

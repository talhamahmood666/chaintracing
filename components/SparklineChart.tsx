'use client';

import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
}

export function SparklineChart({ data, color = '#00D9FF' }: SparklineChartProps) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width={80} height={36}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

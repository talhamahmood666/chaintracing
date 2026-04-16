'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { Hop } from '@/lib/tracer';

interface TransactionFlowGraphProps {
  hops: Hop[];
}

interface FlowData {
  hop: number;
  value: number;
  timestamp: number;
  address: string;
  riskScore: number;
}

export default function TransactionFlowGraph({ hops }: TransactionFlowGraphProps) {
  const flowData = useMemo(() => {
    return hops.map((hop, index) => ({
      hop: hop.hop,
      value: parseFloat(hop.value) || 0,
      timestamp: hop.timestamp,
      address: hop.to.slice(0, 8) + '...' + hop.to.slice(-6),
      riskScore:
        (hop.isMixer ? 35 : 0) +
        (hop.isSanctioned ? 40 : 0) +
        (hop.isBridge ? 20 : 0) +
        (hop.scamMatches && hop.scamMatches.length > 0 ? 25 : 0),
    }));
  }, [hops]);

  if (hops.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No transaction data available for graph</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Transaction Flow Over Time</h3>
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={flowData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hop"
              label={{ value: 'Hop Number', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{ value: 'Value (Native Token)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value: any, name: any, props: any) => {
                if (name === 'value') {
                  return [`${value} ${hops[0]?.token || ''}`, 'Transaction Value'];
                }
                return [value, name];
              }}
              labelFormatter={(label: any, payload: any) => {
                const data = payload && payload[0]?.payload;
                return `Hop ${label} - ${data?.address || ''}`;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
              name="Transaction Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {hops.length > 1 && (
        <div>
          <h4 className="text-md font-medium mb-3">Risk Indicators by Hop</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hop" />
              <YAxis label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => {
                  const riskLevel = value >= 40 ? 'Critical' : value >= 25 ? 'High' : value >= 15 ? 'Medium' : 'Low';
                  return [`${value} - ${riskLevel}`, 'Risk Score'];
                }}
              />
              <Bar
                dataKey="riskScore"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded"></span>
          Transaction Value
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          Risk Score
        </span>
      </div>
    </div>
  );
}
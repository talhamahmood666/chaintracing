'use client';

import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Hop } from '@/lib/tracer';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NodeData {
  fullAddress: string;
  hopNum?: number;
  amount?: string;
  token?: string;
  isSource: boolean;
  isCex: boolean;
  cexLabel?: string;
  isMixer: boolean;
  isSanctioned: boolean;
  isBridge: boolean;
  hasScamMatch: boolean;
  txHash?: string;
  explorerUrl?: string;
  timestamp?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nodeColors(d: NodeData) {
  if (d.isSource)                         return { border: '#00D9FF', bg: 'rgba(0,217,255,0.12)', text: '#00D9FF' };
  if (d.isCex)                            return { border: '#00E676', bg: 'rgba(0,230,118,0.10)', text: '#00E676' };
  if (d.isSanctioned || d.hasScamMatch)   return { border: '#FF4757', bg: 'rgba(255,71,87,0.10)',  text: '#FF4757' };
  if (d.isMixer || d.isBridge)            return { border: '#FFA500', bg: 'rgba(255,165,0,0.10)',  text: '#FFA500' };
  return { border: 'rgba(255,255,255,0.15)', bg: 'rgba(255,255,255,0.04)', text: '#A0B4C8' };
}

function trunc(addr: string) {
  return addr.length <= 14 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtGap(s: number) {
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`;
}

function fmtTs(ts: number) {
  return new Date(ts * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Custom node ───────────────────────────────────────────────────────────────

function HopNode({ data }: NodeProps<NodeData>) {
  const { border, bg, text } = nodeColors(data);
  const pills: { label: string; color: string; bg: string }[] = [];
  if (data.isSanctioned) pills.push({ label: 'OFAC',   color: '#FF4757', bg: 'rgba(255,71,87,0.2)' });
  if (data.hasScamMatch) pills.push({ label: 'SCAM',   color: '#FF4757', bg: 'rgba(255,71,87,0.2)' });
  if (data.isMixer)      pills.push({ label: 'MIXER',  color: '#FFA500', bg: 'rgba(255,165,0,0.2)' });
  if (data.isBridge)     pills.push({ label: 'BRIDGE', color: '#9B59B6', bg: 'rgba(155,89,182,0.2)' });
  if (data.isCex)        pills.push({ label: data.cexLabel ?? 'CEX', color: '#00E676', bg: 'rgba(0,230,118,0.2)' });

  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: '8px 11px', minWidth: 145, maxWidth: 175, fontFamily: 'monospace', cursor: 'pointer', boxShadow: `0 0 12px ${border}33` }}>
      {!data.isSource && <Handle type="target" position={Position.Left} style={{ background: border, border: 'none', width: 8, height: 8 }} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        {data.hopNum !== undefined
          ? <span style={{ background: border, color: '#0A1628', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, fontFamily: 'sans-serif', flexShrink: 0 }}>{data.hopNum}</span>
          : <span style={{ fontSize: 8, fontWeight: 700, color: text, fontFamily: 'sans-serif', letterSpacing: 1 }}>SOURCE</span>
        }
        {data.amount && (
          <span style={{ fontSize: 8, color: text, fontWeight: 700, fontFamily: 'sans-serif' }}>
            {parseFloat(data.amount).toFixed(4)} {data.token}
          </span>
        )}
      </div>

      <div style={{ fontSize: 9.5, color: '#E8F4FD', fontWeight: 600, marginBottom: pills.length ? 4 : 0, wordBreak: 'break-all' }}>
        {trunc(data.fullAddress)}
      </div>

      {pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {pills.map((p) => (
            <span key={p.label} style={{ background: p.bg, color: p.color, borderRadius: 3, padding: '1px 4px', fontSize: 7.5, fontWeight: 700, fontFamily: 'sans-serif' }}>{p.label}</span>
          ))}
        </div>
      )}

      {!data.isCex && <Handle type="source" position={Position.Right} style={{ background: border, border: 'none', width: 8, height: 8 }} />}
    </div>
  );
}

const NODE_TYPES = { hop: HopNode };

// ── Detail panel (click to expand) ───────────────────────────────────────────

function DetailPanel({ data, onClose }: { data: NodeData; onClose: () => void }) {
  const { border, text } = nodeColors(data);
  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, background: '#0D1B2A', border: `1px solid ${border}`, borderRadius: 12, padding: 14, width: 256, boxShadow: `0 0 24px ${border}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: text, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
          {data.isSource ? 'Source' : data.isCex ? data.cexLabel ?? 'Exchange' : `Hop ${data.hopNum}`}
        </span>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>✕</button>
      </div>
      <div style={{ fontSize: 9, color: '#A0B4C8', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 8 }}>{data.fullAddress}</div>
      {data.amount && <p style={{ fontSize: 10, color: '#E8F4FD', margin: '0 0 4px', fontFamily: 'sans-serif' }}>Amount: <strong>{parseFloat(data.amount).toFixed(6)} {data.token}</strong></p>}
      {data.timestamp && <p style={{ fontSize: 9, color: '#A0B4C8', margin: '0 0 4px', fontFamily: 'sans-serif' }}>{fmtTs(data.timestamp)}</p>}
      {data.txHash && (
        <div style={{ marginBottom: 4 }}>
          <p style={{ fontSize: 7.5, color: '#64748b', margin: '0 0 2px', fontFamily: 'sans-serif' }}>TX HASH</p>
          <p style={{ fontSize: 8, color: '#A0B4C8', fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>{data.txHash}</p>
        </div>
      )}
      {data.explorerUrl && (
        <a href={data.explorerUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 9, color: '#00D9FF', marginTop: 6, textDecoration: 'none', fontFamily: 'sans-serif' }}>
          View on Block Explorer →
        </a>
      )}
    </div>
  );
}

// ── Fit-view button ───────────────────────────────────────────────────────────

function FitViewBtn() {
  const { fitView } = useReactFlow();
  return (
    <button
      onClick={() => fitView({ padding: 0.15, duration: 400 })}
      style={{ position: 'absolute', bottom: 52, right: 12, zIndex: 10, background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF', borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'sans-serif' }}
    >
      ⊡ Fit
    </button>
  );
}

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(hops: Hop[]): { nodes: Node<NodeData>[]; edges: Edge[] } {
  if (!hops.length) return { nodes: [], edges: [] };

  const GAP_X = 220;
  const nodes: Node<NodeData>[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: 'source', type: 'hop', position: { x: 0, y: 0 },
    data: { fullAddress: hops[0].from, isSource: true, isCex: false, isMixer: false, isSanctioned: false, isBridge: false, hasScamMatch: false },
  });

  hops.forEach((hop, i) => {
    const id = `hop-${hop.hop}`;
    const hasScamMatch = Array.isArray((hop as any).scamMatches) && (hop as any).scamMatches.length > 0;

    nodes.push({
      id, type: 'hop', position: { x: (i + 1) * GAP_X, y: 0 },
      data: {
        fullAddress: hop.to, hopNum: hop.hop, amount: hop.value, token: hop.token,
        isSource: false, isCex: !!hop.label, cexLabel: hop.label,
        isMixer: !!hop.isMixer, isSanctioned: !!hop.isSanctioned,
        isBridge: !!hop.isBridge, hasScamMatch,
        txHash: hop.txHash, explorerUrl: hop.explorerUrl, timestamp: hop.timestamp,
      },
    });

    const flagged = hop.isSanctioned || hop.isMixer || hasScamMatch;
    const color = flagged ? '#FF4757' : hop.label ? '#00E676' : 'rgba(0,217,255,0.5)';
    const prevId = i === 0 ? 'source' : `hop-${hops[i - 1].hop}`;
    const edgeLabel = `${parseFloat(hop.value).toFixed(4)} ${hop.token}${hop.gapFromPrevSeconds != null ? `  +${fmtGap(hop.gapFromPrevSeconds)}` : ''}`;

    edges.push({
      id: `e-${i}`, source: prevId, target: id,
      label: edgeLabel, type: 'smoothstep', animated: flagged,
      style: { stroke: color, strokeWidth: flagged ? 2 : 1.5 },
      labelStyle: { fill: '#A0B4C8', fontSize: 9, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#0D1B2A', fillOpacity: 0.85 },
      markerEnd: { type: 'arrowclosed' as any, color, width: 16, height: 16 },
    });
  });

  return { nodes, edges };
}

// ── Inner graph (inside ReactFlowProvider) ────────────────────────────────────

function InnerGraph({ hops, isPaid }: { hops: Hop[]; isPaid: boolean }) {
  const { nodes: initNodes, edges: initEdges } = useMemo(() => buildGraph(hops), [hops]);
  const [nodes, , onNodesChange] = useNodesState<NodeData>(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);
  const [selected, setSelected] = useState<NodeData | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelected(node.data);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 340 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelected(null)}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        zoomOnScroll
        style={{ background: '#0A1628', borderRadius: 12 }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(0,217,255,0.06)" gap={24} size={1} />
        <Controls style={{ background: 'rgba(13,27,42,0.9)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 8 }} showInteractive={false} />
        <MiniMap
          nodeColor={(n: Node) => {
            const d = n.data as NodeData;
            if (d.isSource) return '#00D9FF';
            if (d.isCex) return '#00E676';
            if (d.isSanctioned || d.hasScamMatch) return '#FF4757';
            if (d.isMixer || d.isBridge) return '#FFA500';
            return '#334155';
          }}
          maskColor="rgba(10,22,40,0.7)"
          style={{ background: '#0D1B2A', border: '1px solid rgba(0,217,255,0.15)', borderRadius: 8 }}
        />
        <FitViewBtn />
      </ReactFlow>

      {selected && <DetailPanel data={selected} onClose={() => setSelected(null)} />}

      {!isPaid && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 12, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', background: 'rgba(10,22,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🔒</span>
          <p style={{ color: '#E8F4FD', fontWeight: 700, fontSize: 15, fontFamily: 'sans-serif', margin: 0 }}>Unlock to see full trace</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'sans-serif', margin: 0 }}>Upgrade to Quick Scan or Deep Trace below</p>
        </div>
      )}
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

interface Props { hops: Hop[]; isPaid?: boolean; }

export default function TransactionFlowGraph({ hops, isPaid = true }: Props) {
  if (!hops.length) {
    return <div className="glass rounded-2xl p-8 text-center" style={{ color: 'var(--text-muted)' }}>No transaction data</div>;
  }

  // Minimum width so graph doesn't compress on mobile — scrolls horizontally
  const minW = Math.max(600, (hops.length + 2) * 220);

  return (
    <div className="glass rounded-2xl p-4 mb-2">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', margin: 0 }}>
          Transaction Flow Graph
        </h3>
        <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'sans-serif' }}>
          {[['#00D9FF', 'Source'], ['#FF4757', 'High Risk'], ['#FFA500', 'Mixer'], ['#00E676', 'Exchange']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: minW }}>
          <ReactFlowProvider>
            <InnerGraph hops={hops} isPaid={isPaid} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

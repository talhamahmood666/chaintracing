import { ImageResponse } from 'next/og';

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

export function renderOG(title: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #0b1220 0%, #1a2540 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#60a5fa', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#60a5fa' }} />
          ChainTracing
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ color: 'white', fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 1000 }}>
            {title}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 30, lineHeight: 1.3, maxWidth: 950 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ color: '#64748b', fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>
          ETH · BSC · POLYGON · ARBITRUM · BASE · SOLANA · TRON · BTC
        </div>
      </div>
    ),
    ogSize
  );
}

import React from 'react';

type LogoProps = {
  variant?: 'header' | 'hero' | 'mark';
  className?: string;
};

export default function Logo({ variant = 'header', className = '' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <svg
        className={className}
        viewBox="0 0 300 200"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ChainTracing animated mark"
      >
        <title>ChainTracing</title>
        <desc>Animated trace path ending at a flagged endpoint inside a lens.</desc>
        <defs>
          <clipPath id="ct-markLensClip"><circle cx="220" cy="100" r="32" /></clipPath>
        </defs>
        <style>{`
          .ctm-dim { fill: none; stroke: #00D9FF; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; stroke-opacity: 0.25; }
          .ctm-bright { fill: none; stroke: #00D9FF; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; stroke-dasharray: 400; stroke-dashoffset: 400; animation: ctm-draw 3s ease-in-out infinite; }
          .ctm-node { fill: #00D9FF; opacity: 0; animation: ctm-nodePop 3s ease-in-out infinite; }
          .ctm-node-dim { fill: #00D9FF; opacity: 0.3; }
          .ctm-lens { fill: none; stroke: #00D9FF; stroke-width: 2.5; }
          .ctm-sweep { stroke: #00D9FF; stroke-width: 1.5; stroke-linecap: round; opacity: 0; animation: ctm-sweep 3s ease-in-out infinite; }
          .ctm-endpoint-ring { fill: none; stroke: #00D9FF; stroke-width: 1.5; opacity: 0; animation: ctm-endpointPulse 3s ease-in-out infinite; }
          @keyframes ctm-draw { 0% { stroke-dashoffset: 400; } 60%, 100% { stroke-dashoffset: 0; } }
          @keyframes ctm-nodePop { 0%, 100% { opacity: 0; } 70%, 95% { opacity: 1; } }
          @keyframes ctm-sweep { 0%, 60% { opacity: 0; transform: translateY(-30px); } 75% { opacity: 0.8; } 90%, 100% { opacity: 0; transform: translateY(30px); } }
          @keyframes ctm-endpointPulse { 0%, 70% { opacity: 0; r: 6; } 80% { opacity: 1; r: 10; } 90% { opacity: 0.5; r: 18; } 100% { opacity: 0; r: 26; } }
          @media (prefers-reduced-motion: reduce) {
            .ctm-bright { stroke-dashoffset: 0; animation: none; }
            .ctm-node { opacity: 1; animation: none; }
            .ctm-sweep { display: none; }
            .ctm-endpoint-ring { opacity: 0.6; animation: none; }
          }
        `}</style>
        <path className="ctm-dim" d="M 60 140 L 95 80 L 130 140 L 165 80 L 200 140 L 220 100" />
        <path className="ctm-bright" d="M 60 140 L 95 80 L 130 140 L 165 80 L 200 140 L 220 100" />
        <circle className="ctm-node-dim" cx="60" cy="140" r="4" />
        <circle className="ctm-node" cx="95" cy="80" r="4" style={{ animationDelay: '0.4s' }} />
        <circle className="ctm-node" cx="130" cy="140" r="4" style={{ animationDelay: '0.8s' }} />
        <circle className="ctm-node" cx="165" cy="80" r="4" style={{ animationDelay: '1.2s' }} />
        <circle className="ctm-node" cx="200" cy="140" r="4" style={{ animationDelay: '1.6s' }} />
        <circle className="ctm-lens" cx="220" cy="100" r="32" />
        <line x1="243" y1="123" x2="260" y2="140" stroke="#00D9FF" strokeWidth="3" strokeLinecap="round" />
        <g clipPath="url(#ct-markLensClip)">
          <line className="ctm-sweep" x1="188" y1="100" x2="252" y2="100" />
          <circle cx="215" cy="100" r="5" fill="#00D9FF" />
          <circle className="ctm-endpoint-ring" cx="215" cy="100" r="6" />
        </g>
      </svg>
    );
  }

  if (variant === 'hero') {
    return (
      <svg
        className={className}
        viewBox="0 0 680 420"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ChainTracing"
      >
        <title>ChainTracing</title>
        <desc>Animated trace path ending at a flagged endpoint inside a lens.</desc>
        <defs>
          <clipPath id="ct-lensClip"><circle cx="470" cy="220" r="52" /></clipPath>
        </defs>
        <style>{`
          .ct-dim { fill: none; stroke: #00D9FF; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; stroke-opacity: 0.25; }
          .ct-bright { fill: none; stroke: #00D9FF; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; stroke-dasharray: 600; stroke-dashoffset: 600; animation: ct-draw 3s ease-in-out infinite; }
          .ct-node { fill: #00D9FF; opacity: 0; animation: ct-nodePop 3s ease-in-out infinite; }
          .ct-node-dim { fill: #00D9FF; opacity: 0.3; }
          .ct-lens { fill: none; stroke: #00D9FF; stroke-width: 2.5; }
          .ct-sweep { stroke: #00D9FF; stroke-width: 1.5; stroke-linecap: round; opacity: 0; animation: ct-sweep 3s ease-in-out infinite; }
          .ct-endpoint-ring { fill: none; stroke: #00D9FF; stroke-width: 1.5; opacity: 0; animation: ct-endpointPulse 3s ease-in-out infinite; }
          .ct-wordmark { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 500; fill: #fff; letter-spacing: 1px; }
          .ct-wordmark-sub { font-family: ui-sans-serif, system-ui, sans-serif; font-weight: 400; font-size: 11px; fill: rgba(255,255,255,0.6); letter-spacing: 4px; }
          @keyframes ct-draw { 0% { stroke-dashoffset: 600; } 60%, 100% { stroke-dashoffset: 0; } }
          @keyframes ct-nodePop { 0%, 100% { opacity: 0; } 70%, 95% { opacity: 1; } }
          @keyframes ct-sweep { 0%, 60% { opacity: 0; transform: translateY(-50px); } 75% { opacity: 0.8; } 90%, 100% { opacity: 0; transform: translateY(50px); } }
          @keyframes ct-endpointPulse { 0%, 70% { opacity: 0; r: 10; } 80% { opacity: 1; r: 14; } 90% { opacity: 0.5; r: 22; } 100% { opacity: 0; r: 30; } }
          @media (prefers-reduced-motion: reduce) {
            .ct-bright { stroke-dashoffset: 0; animation: none; }
            .ct-node { opacity: 1; animation: none; }
            .ct-sweep { display: none; }
            .ct-endpoint-ring { opacity: 0.6; animation: none; }
          }
        `}</style>
        <path className="ct-dim" d="M 210 260 L 260 180 L 310 260 L 360 180 L 410 260 L 460 220" />
        <path className="ct-bright" d="M 210 260 L 260 180 L 310 260 L 360 180 L 410 260 L 460 220" />
        <circle className="ct-node-dim" cx="210" cy="260" r="5" />
        <circle className="ct-node" cx="260" cy="180" r="5" style={{ animationDelay: '0.4s' }} />
        <circle className="ct-node" cx="310" cy="260" r="5" style={{ animationDelay: '0.8s' }} />
        <circle className="ct-node" cx="360" cy="180" r="5" style={{ animationDelay: '1.2s' }} />
        <circle className="ct-node" cx="410" cy="260" r="5" style={{ animationDelay: '1.6s' }} />
        <circle className="ct-lens" cx="470" cy="220" r="52" />
        <line x1="506" y1="256" x2="530" y2="280" stroke="#00D9FF" strokeWidth="3.5" strokeLinecap="round" />
        <g clipPath="url(#ct-lensClip)">
          <line className="ct-sweep" x1="420" y1="220" x2="520" y2="220" />
          <circle cx="460" cy="220" r="6" fill="#00D9FF" />
          <circle className="ct-endpoint-ring" cx="460" cy="220" r="10" />
        </g>
        <text x="340" y="340" textAnchor="middle" fontSize="36" className="ct-wordmark">chaintracing</text>
        <text x="340" y="362" textAnchor="middle" className="ct-wordmark-sub">ON-CHAIN  FORENSICS</text>
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 250 60"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ChainTracing"
    >
      <title>ChainTracing</title>
      <g transform="translate(8,32)">
        <path d="M 5 12 L 20 -8 L 35 12" fill="none" stroke="#00D9FF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.35" />
        <path d="M 35 12 L 50 -8" fill="none" stroke="#00D9FF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="5" cy="12" r="2.5" fill="#00D9FF" />
        <circle cx="20" cy="-8" r="2.5" fill="#00D9FF" />
        <circle cx="35" cy="12" r="2.5" fill="#00D9FF" />
        <circle cx="62" cy="-8" r="16" fill="none" stroke="#00D9FF" strokeWidth="2.5" />
        <line x1="73" y1="3" x2="81" y2="11" stroke="#00D9FF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="62" cy="-8" r="3" fill="#00D9FF" />
      </g>
      <text x="96" y="38" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="500" fontSize="22" fill="currentColor" letterSpacing="0.5">chaintracing</text>
    </svg>
  );
}

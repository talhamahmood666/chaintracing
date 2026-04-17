'use client';

import { useEffect, useRef } from 'react';

interface RiskMeterProps {
  score: number;
  size?: number;
}

function scoreToColor(score: number): string {
  if (score >= 75) return '#FF4757';
  if (score >= 50) return '#FFA500';
  if (score >= 25) return '#FFD700';
  return '#00E676';
}

function scoreToLabel(score: number): string {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

export default function RiskMeter({ score, size = 160 }: RiskMeterProps) {
  const progressRef = useRef<SVGCircleElement>(null);
  const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = scoreToColor(clampedScore);
  const label = scoreToLabel(clampedScore);

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (clampedScore / 100) * circumference;

  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(circumference);
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1s ease';
      el.style.strokeDashoffset = String(circumference - strokeDash);
    });
  }, [circumference, strokeDash]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={10}
          />
          {/* Progress */}
          <circle
            ref={progressRef}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        {/* Score label centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-4xl leading-none" style={{ color, fontFamily: 'var(--font-geist-mono)' }}>
            {clampedScore}
          </span>
          <span className="text-xs font-bold tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
            / 100
          </span>
        </div>
      </div>
      <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest"
        style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
        {label} RISK
      </div>
    </div>
  );
}

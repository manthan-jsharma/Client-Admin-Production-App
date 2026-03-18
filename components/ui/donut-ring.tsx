'use client';

import React, { useEffect, useState } from 'react';

interface DonutRingProps {
  progress: number;          // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  labelSize?: number;
  animate?: boolean;
}

export function DonutRing({
  progress,
  size = 56,
  strokeWidth = 5,
  color = '#3A8DDE',
  trackColor = '#DDE5EC',
  label,
  labelSize = 11,
  animate = true,
}: DonutRingProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : progress);

  useEffect(() => {
    if (!animate) { setDisplayed(progress); return; }
    const raf = requestAnimationFrame(() => setDisplayed(progress));
    return () => cancelAnimationFrame(raf);
  }, [progress, animate]);

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(displayed, 100) / 100) * circ;
  const center = size / 2;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {/* Track */}
      <circle cx={center} cy={center} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      {/* Progress */}
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          transition: animate ? 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.15,0.64,1)' : 'none',
        }}
      />
      {/* Center label */}
      {label !== undefined && (
        <text
          x={center} y={center + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: labelSize, fontWeight: 700, fill: '#1E2A32', fontFamily: 'inherit' }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

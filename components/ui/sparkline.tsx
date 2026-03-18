'use client';

import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientId?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color = '#3A8DDE',
  gradientId,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const id = gradientId ?? `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));

  // Smooth cubic bezier path
  const path = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const fillPath = `${path} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  const trend = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path d={fillPath} fill={`url(#${id})`} />
      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color}60)` }}
      />
    </svg>
  );
}

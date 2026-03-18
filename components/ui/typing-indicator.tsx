'use client';

import React from 'react';

interface TypingIndicatorProps {
  label?: string;
  dotColor?: string;
}

export function TypingIndicator({
  label = 'Admin is typing',
  dotColor = '#3A8DDE',
}: TypingIndicatorProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: '16px 16px 16px 4px',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(221,229,236,0.8)',
        boxShadow: '0 2px 8px rgba(58,141,222,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="typing-dot"
            style={{
              display: 'block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: dotColor,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      {label && (
        <span style={{ fontSize: '12px', color: '#8A97A3', fontStyle: 'italic' }}>{label}</span>
      )}
    </div>
  );
}

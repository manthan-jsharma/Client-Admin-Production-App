'use client';

import React, { useRef, MouseEvent, ReactNode, CSSProperties } from 'react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  rippleColor?: string;
  style?: CSSProperties;
  className?: string;
}

export function RippleButton({
  children, rippleColor = 'rgba(255,255,255,0.38)', className = '', style, ...props
}: RippleButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top  - size / 2;

    const span = document.createElement('span');
    span.className = 'ripple-wave';
    span.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${x}px; top: ${y}px;
      background: ${rippleColor};
    `;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove(), { once: true });

    props.onClick?.(e);
  };

  return (
    <button
      ref={btnRef}
      {...props}
      onClick={handleClick}
      className={`ripple-container ${className}`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {children}
    </button>
  );
}

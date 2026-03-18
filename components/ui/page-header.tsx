'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  greeting?: string;
  greetingIcon?: React.ElementType;
  /** Show the 4px hero gradient strip at the very top */
  heroStrip?: boolean;
  /** Extra content in the meta row (right of date) */
  meta?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  greeting,
  greetingIcon: GreetingIcon,
  heroStrip = true,
  meta,
}: PageHeaderProps) {
  return (
    <div style={{ position: 'relative' }}>
      {/* ── Hero gradient strip ── */}
      {heroStrip && (
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, #3A8DDE 0%, #6BCF7A 35%, #6FB2F2 65%, #3A8DDE 100%)',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 6s ease infinite',
        }} />
      )}

      {/* ── Main header ── */}
      <div className="page-header-inner" style={{
        padding: 'clamp(14px, 3vw, 24px) clamp(16px, 4vw, 32px) clamp(12px, 2.5vw, 20px)',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.55) 100%)',
        backdropFilter: 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        borderBottom: '1px solid rgba(221,229,236,0.5)',
        position: 'relative',
      }}>
        {/* Subtle noise overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }} />

        <div className="page-header-row" style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {/* Left side */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.label}>
                    {i > 0 && <ChevronRight style={{ width: 12, height: 12, color: '#8A97A3', flexShrink: 0 }} />}
                    {crumb.href && i < breadcrumbs.length - 1 ? (
                      <Link
                        href={crumb.href}
                        style={{ fontSize: 12, color: '#8A97A3', textDecoration: 'none', transition: 'color 0.12s', fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A97A3'}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12, color: i === breadcrumbs.length - 1 ? '#5F6B76' : '#8A97A3', fontWeight: i === breadcrumbs.length - 1 ? 600 : 500 }}>
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            {/* Greeting */}
            {greeting && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {GreetingIcon && <GreetingIcon style={{ width: 14, height: 14, color: '#3A8DDE' }} />}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8A97A3', letterSpacing: '0.01em' }}>{greeting}</span>
              </div>
            )}

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(18px, 3.5vw, 26px)',
              fontWeight: 800,
              color: '#1E2A32',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: subtitle ? 6 : 0,
            }}>
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p style={{ fontSize: 13, color: '#8A97A3', lineHeight: 1.5, marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Right side: actions + meta date */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
            {meta && <div>{meta}</div>}
            {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

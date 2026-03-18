'use client';

import React from 'react';

interface EmptyStateProps {
  variant?: 'projects' | 'clients' | 'payments' | 'messages' | 'analytics' | 'generic';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  size?: number;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/* ── Animated SVG illustrations ── */

function FolderIllustration({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 120 102" fill="none">
      <defs>
        <linearGradient id="folderGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6FB2F2" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#3A8DDE" stopOpacity="0.15"/>
        </linearGradient>
        <linearGradient id="folderGrad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A8DDE" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#2F6FB2" stopOpacity="0.3"/>
        </linearGradient>
      </defs>
      {/* Folder back */}
      <rect x="8" y="28" width="104" height="66" rx="10" fill="url(#folderGrad)" stroke="#6FB2F2" strokeWidth="1.5"/>
      {/* Folder tab */}
      <path d="M8 28 L8 22 Q8 16 14 16 L44 16 Q50 16 53 22 L56 28 Z" fill="url(#folderGrad2)" stroke="#3A8DDE" strokeWidth="1.5"/>
      {/* Folder front */}
      <rect x="8" y="34" width="104" height="60" rx="10" fill="url(#folderGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      {/* Lines inside */}
      <rect x="22" y="52" width="45" height="3" rx="1.5" fill="#3A8DDE" fillOpacity="0.3"/>
      <rect x="22" y="60" width="32" height="3" rx="1.5" fill="#3A8DDE" fillOpacity="0.2"/>
      <rect x="22" y="68" width="55" height="3" rx="1.5" fill="#3A8DDE" fillOpacity="0.15"/>
      {/* Star 1 - floating */}
      <g style={{ animation: 'float 2.5s ease-in-out infinite' }}>
        <path d="M88 18 L89.5 14 L91 18 L95 18 L92 20.5 L93.5 25 L89.5 22 L85.5 25 L87 20.5 L84 18 Z"
          fill="#3A8DDE" fillOpacity="0.7"/>
      </g>
      {/* Star 2 - floating delayed */}
      <g style={{ animation: 'float 3s ease-in-out 0.6s infinite' }}>
        <path d="M100 8 L101 6 L102 8 L104 8 L102.5 9.3 L103.5 12 L101 10.5 L98.5 12 L99.5 9.3 L98 8 Z"
          fill="#6BCF7A" fillOpacity="0.8"/>
      </g>
      {/* Sparkle */}
      <g style={{ animation: 'float 2s ease-in-out 1.2s infinite' }}>
        <line x1="76" y1="10" x2="76" y2="20" stroke="#6FB2F2" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="71" y1="15" x2="81" y2="15" stroke="#6FB2F2" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="72.5" y1="11.5" x2="79.5" y2="18.5" stroke="#6FB2F2" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5"/>
        <line x1="79.5" y1="11.5" x2="72.5" y2="18.5" stroke="#6FB2F2" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5"/>
      </g>
    </svg>
  );
}

function UsersIllustration({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 120 102" fill="none">
      <defs>
        <linearGradient id="userGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6BCF7A" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#3A8DDE" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      {/* Person 1 */}
      <circle cx="44" cy="36" r="16" fill="url(#userGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      <path d="M16 88 Q16 68 44 68 Q72 68 72 88" fill="url(#userGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      {/* Person 2 (behind, right) */}
      <g opacity="0.6" style={{ animation: 'float 3s ease-in-out 0.5s infinite' }}>
        <circle cx="80" cy="40" r="13" fill="url(#userGrad)" stroke="#6BCF7A" strokeWidth="1.5"/>
        <path d="M56 88 Q56 72 80 72 Q104 72 104 88" fill="url(#userGrad)" stroke="#6BCF7A" strokeWidth="1.5"/>
      </g>
      {/* Plus badge */}
      <g style={{ animation: 'bounce-in 0.5s 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <circle cx="96" cy="24" r="12" fill="#3A8DDE"/>
        <line x1="96" y1="18" x2="96" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="90" y1="24" x2="102" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

function PaymentIllustration({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 120 90" fill="none">
      <defs>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A8DDE" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#6FB2F2" stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      {/* Card shadow */}
      <rect x="18" y="22" width="90" height="56" rx="12" fill="rgba(58,141,222,0.08)" transform="translate(3,5)"/>
      {/* Card */}
      <rect x="10" y="18" width="90" height="56" rx="12" fill="url(#cardGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      {/* Stripe */}
      <rect x="10" y="30" width="90" height="14" fill="#3A8DDE" fillOpacity="0.18"/>
      {/* Chip */}
      <rect x="20" y="48" width="18" height="14" rx="3" fill="#6FB2F2" fillOpacity="0.5" stroke="#3A8DDE" strokeWidth="1"/>
      {/* Dots */}
      {[52,60,68,76].map((x,i) => (
        <circle key={i} cx={x} cy={55} r="3.5" fill="#3A8DDE" fillOpacity="0.3"/>
      ))}
      {/* Floating coins */}
      <g style={{ animation: 'float 2.4s ease-in-out infinite' }}>
        <circle cx="98" cy="14" r="8" fill="#f59e0b" fillOpacity="0.7" stroke="#f59e0b" strokeWidth="1"/>
        <text x="98" y="18" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">$</text>
      </g>
      <g style={{ animation: 'float 3s ease-in-out 0.8s infinite' }}>
        <circle cx="14" cy="12" r="6" fill="#6BCF7A" fillOpacity="0.7" stroke="#6BCF7A" strokeWidth="1"/>
        <line x1="14" y1="9" x2="14" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="11" y1="12" x2="17" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

function MessageIllustration({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 120 102" fill="none">
      <defs>
        <linearGradient id="msgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A8DDE" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#6FB2F2" stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      {/* Background bubble */}
      <g opacity="0.5" transform="translate(30,8) scale(0.75)" style={{ animation: 'float 3.2s ease-in-out 0.4s infinite' }}>
        <rect x="8" y="12" width="80" height="54" rx="16" fill="url(#msgGrad)" stroke="#6FB2F2" strokeWidth="1.5"/>
        <path d="M24 66 L18 78 L36 66 Z" fill="url(#msgGrad)" stroke="#6FB2F2" strokeWidth="1.5"/>
      </g>
      {/* Main bubble */}
      <rect x="8" y="20" width="88" height="56" rx="18" fill="url(#msgGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      <path d="M20 76 L10 90 L38 76 Z" fill="url(#msgGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      {/* Typing dots */}
      {[36,52,68].map((x,i) => (
        <circle key={i} cx={x} cy={48} r="5" fill="#3A8DDE" fillOpacity="0.5"
          style={{ animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite` }}/>
      ))}
    </svg>
  );
}

function AnalyticsIllustration({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 120 102" fill="none">
      <defs>
        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A8DDE" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#3A8DDE" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6BCF7A" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#6BCF7A" stopOpacity="0.2"/>
        </linearGradient>
        <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      {/* Axes */}
      <line x1="20" y1="15" x2="20" y2="82" stroke="#DDE5EC" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="82" x2="108" y2="82" stroke="#DDE5EC" strokeWidth="2" strokeLinecap="round"/>
      {/* Bars */}
      <rect x="30" y="44" width="16" height="38" rx="4" fill="url(#barGrad1)"/>
      <rect x="52" y="28" width="16" height="54" rx="4" fill="url(#barGrad2)"/>
      <rect x="74" y="52" width="16" height="30" rx="4" fill="url(#barGrad3)"/>
      {/* Question mark */}
      <g style={{ animation: 'float 2.5s ease-in-out infinite' }}>
        <circle cx="96" cy="26" r="16" fill="rgba(58,141,222,0.1)" stroke="#3A8DDE" strokeWidth="1.5"/>
        <text x="96" y="33" textAnchor="middle" fontSize="18" fontWeight="800" fill="#3A8DDE" fontFamily="sans-serif">?</text>
      </g>
    </svg>
  );
}

function GenericIllustration({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 120 102" fill="none">
      <defs>
        <linearGradient id="genGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3A8DDE" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#6FB2F2" stopOpacity="0.1"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="48" r="36" fill="url(#genGrad)" stroke="#3A8DDE" strokeWidth="1.5"/>
      <g style={{ animation: 'float 2.8s ease-in-out infinite' }}>
        <path d="M44 42 Q60 28 76 42" stroke="#3A8DDE" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="44" cy="42" r="3" fill="#3A8DDE" fillOpacity="0.6"/>
        <circle cx="76" cy="42" r="3" fill="#3A8DDE" fillOpacity="0.6"/>
      </g>
      <circle cx="60" cy="58" r="3.5" fill="#3A8DDE" fillOpacity="0.5"/>
    </svg>
  );
}

const ILLUSTRATIONS = {
  projects:  FolderIllustration,
  clients:   UsersIllustration,
  payments:  PaymentIllustration,
  messages:  MessageIllustration,
  analytics: AnalyticsIllustration,
  generic:   GenericIllustration,
};

export function EmptyState({ variant = 'generic', title, description, action, size = 120, icon, children }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];
  return (
    <div
      className="animate-fade-up"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      }}
    >
      {icon ? (
        <div style={{ marginBottom: 20 }}>{icon}</div>
      ) : (
        <div style={{ marginBottom: 20, filter: 'drop-shadow(0 4px 12px rgba(58,141,222,0.12))' }}>
          <Illustration size={size} />
        </div>
      )}
      {title && (
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E2A32', marginBottom: 6, letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      )}
      {description && (
        <p style={{ fontSize: 13, color: '#8A97A3', lineHeight: 1.6, maxWidth: 300, marginBottom: (action || children) ? 20 : 0 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

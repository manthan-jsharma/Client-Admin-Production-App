'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  exiting?: boolean;
}

interface ToastCtx {
  toast: (opts: Omit<ToastItem, 'id' | 'exiting'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const Ctx = createContext<ToastCtx>({
  toast: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {},
});

export const useToast = () => useContext(Ctx);

const META: Record<ToastType, { icon: React.ElementType; bg: string; iconColor: string; border: string; accent: string }> = {
  success: { icon: CheckCircle2, bg: '#f0fdf4', iconColor: '#22c55e', border: '#bbf7d0', accent: '#22c55e' },
  error:   { icon: XCircle,      bg: '#fff1f2', iconColor: '#ef4444', border: '#fecaca', accent: '#ef4444' },
  info:    { icon: Info,         bg: '#eff8ff', iconColor: '#3A8DDE', border: '#bfdbfe', accent: '#3A8DDE' },
  warning: { icon: AlertTriangle,bg: '#fffbeb', iconColor: '#f59e0b', border: '#fde68a', accent: '#f59e0b' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const m = META[toast.type];
  const Icon = m.icon;
  return (
    <div
      className={toast.exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '14px',
        background: m.bg,
        border: `1px solid ${m.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        minWidth: '300px',
        maxWidth: '380px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: m.accent, borderRadius: '14px 0 0 14px' }} />

      <div style={{ width: 32, height: 32, borderRadius: '10px', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color: m.iconColor }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E2A32', marginBottom: '2px', lineHeight: 1.3 }}>
            {toast.title}
          </p>
        )}
        <p style={{ fontSize: '13px', color: '#5F6B76', lineHeight: 1.45 }}>{toast.message}</p>
      </div>

      <button
        onClick={onDismiss}
        style={{ color: '#8A97A3', flexShrink: 0, padding: 2, borderRadius: 6, cursor: 'pointer', background: 'none', border: 'none' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#1E2A32'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A97A3'}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>

      {/* progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2, background: m.accent, opacity: 0.4,
        animation: 'progress-fill 4s linear reverse both',
        width: '100%',
      }} />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
  }, []);

  const add = useCallback((opts: Omit<ToastItem, 'id' | 'exiting'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]);
    const t = setTimeout(() => dismiss(id), 4200);
    timers.current.set(id, t);
  }, [dismiss]);

  const ctx: ToastCtx = {
    toast: add,
    success: (message, title) => add({ type: 'success', message, title }),
    error:   (message, title) => add({ type: 'error',   message, title }),
    info:    (message, title) => add({ type: 'info',    message, title }),
    warning: (message, title) => add({ type: 'warning', message, title }),
  };

  return (
    <Ctx.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

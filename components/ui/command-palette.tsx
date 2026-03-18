'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, Users, BarChart3, CreditCard,
  MessageSquare, Settings2, Package, GitBranch, Star, Wrench,
  Search, ArrowRight, ClipboardList, Map, UserCircle, Shield, Zap,
} from 'lucide-react';

interface CmdItem { label: string; href: string; icon: React.ElementType; group: string; keywords?: string }
interface CmdCtx { open: () => void; close: () => void; isOpen: boolean }

const Ctx = createContext<CmdCtx>({ open: () => {}, close: () => {}, isOpen: false });
export const useCommandPalette = () => useContext(Ctx);

const ADMIN_ITEMS: CmdItem[] = [
  { label: 'Dashboard',    href: '/dashboard/admin',              icon: LayoutDashboard, group: 'Main' },
  { label: 'Projects',     href: '/dashboard/admin/projects',     icon: FolderKanban,    group: 'Main' },
  { label: 'Clients',      href: '/dashboard/admin/clients',      icon: Users,           group: 'Main' },
  { label: 'Approvals',    href: '/dashboard/admin/approvals',    icon: Shield,          group: 'Main' },
  { label: 'Tickets',      href: '/dashboard/admin/requests',     icon: ClipboardList,   group: 'Manage' },
  { label: 'Chats',        href: '/dashboard/admin/chats',        icon: MessageSquare,   group: 'Manage' },
  { label: 'Payments',     href: '/dashboard/admin/payments',     icon: CreditCard,      group: 'Manage' },
  { label: 'Services',     href: '/dashboard/admin/services',     icon: Package,         group: 'Manage' },
  { label: 'Analytics',    href: '/dashboard/admin/analytics',    icon: BarChart3,       group: 'Insights' },
  { label: 'Referrals',    href: '/dashboard/admin/referrals',    icon: GitBranch,       group: 'Grow' },
  { label: 'Testimonials', href: '/dashboard/admin/testimonials', icon: Star,            group: 'Grow' },
  { label: 'Maintenance',  href: '/dashboard/admin/maintenance',  icon: Wrench,          group: 'Grow' },
  { label: 'Settings',     href: '/dashboard/admin/settings',     icon: Settings2,       group: 'Insights' },
];

const CLIENT_ITEMS: CmdItem[] = [
  { label: 'Dashboard', href: '/dashboard/client',              icon: LayoutDashboard, group: 'Overview' },
  { label: 'Projects',  href: '/dashboard/client/projects',     icon: FolderKanban,    group: 'Overview' },
  { label: 'Roadmap',   href: '/dashboard/client/roadmap',      icon: Map,             group: 'Overview' },
  { label: 'Setup',     href: '/dashboard/client/setup',        icon: Settings2,       group: 'Overview' },
  { label: 'Payments',  href: '/dashboard/client/payments',     icon: CreditCard,      group: 'Billing' },
  { label: 'Services',  href: '/dashboard/client/services',     icon: Package,         group: 'Billing' },
  { label: 'Referrals', href: '/dashboard/client/referrals',    icon: GitBranch,       group: 'Engage' },
  { label: 'Chat',      href: '/dashboard/client/chat',         icon: MessageSquare,   group: 'Engage' },
  { label: 'Maintenance', href: '/dashboard/client/maintenance',icon: Wrench,          group: 'Engage' },
  { label: 'Profile',   href: '/dashboard/client/profile',      icon: UserCircle,      group: 'Account' },
];

function PaletteModal({ onClose, role }: { onClose: () => void; role: 'admin' | 'client' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = role === 'admin' ? ADMIN_ITEMS : CLIENT_ITEMS;

  const filtered = query.trim()
    ? items.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.group.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(p => Math.min(p + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(p => Math.max(p - 1, 0)); }
      if (e.key === 'Enter' && filtered[active]) navigate(filtered[active].href);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, active, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const groups = [...new Set(filtered.map(i => i.group))];

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '520px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(28px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '0 24px 64px rgba(30,42,50,0.22), 0 4px 16px rgba(30,42,50,0.08)',
          overflow: 'hidden',
          animation: 'slide-up 0.3s cubic-bezier(0.34,1.3,0.64,1) both',
        }}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(221,229,236,0.8)' }}>
          <Search style={{ width: 18, height: 18, color: '#8A97A3', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '15px', color: '#1E2A32', fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontSize: '10px', color: '#8A97A3', background: '#f1f5f9',
            border: '1px solid #DDE5EC', borderRadius: '6px',
            padding: '3px 7px', fontFamily: 'inherit', flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Zap style={{ width: 28, height: 28, color: '#DDE5EC', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '13px', color: '#8A97A3' }}>No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            groups.map(group => {
              const groupItems = filtered.filter(i => i.group === group);
              return (
                <div key={group}>
                  <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A97A3', padding: '8px 12px 4px' }}>
                    {group}
                  </p>
                  {groupItems.map(item => {
                    const globalIdx = filtered.indexOf(item);
                    const isActive = globalIdx === active;
                    const isCurrent = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        onMouseEnter={() => setActive(globalIdx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                          padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                          background: isActive ? '#eff8ff' : 'transparent',
                          transition: 'background 0.12s',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '9px', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: isActive ? 'rgba(58,141,222,0.12)' : '#f1f5f9',
                          transition: 'background 0.12s',
                        }}>
                          <Icon style={{ width: 15, height: 15, color: isActive ? '#3A8DDE' : '#8A97A3' }} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: isActive ? '#1E2A32' : '#5F6B76', flex: 1 }}>
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: '10px', color: '#3A8DDE', background: '#eff8ff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                            Current
                          </span>
                        )}
                        {isActive && <ArrowRight style={{ width: 14, height: 14, color: '#3A8DDE' }} />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(221,229,236,0.7)', display: 'flex', gap: 16 }}>
          {[
            { keys: '↑↓', label: 'navigate' },
            { keys: '↵', label: 'open' },
            { keys: 'esc', label: 'close' },
          ].map(({ keys, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ fontSize: '10px', color: '#8A97A3', background: '#f1f5f9', border: '1px solid #DDE5EC', borderRadius: '5px', padding: '2px 5px', fontFamily: 'inherit' }}>
                {keys}
              </kbd>
              <span style={{ fontSize: '11px', color: '#8A97A3' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteProvider({
  children, role,
}: {
  children: React.ReactNode;
  role: 'admin' | 'client';
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <Ctx.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false), isOpen }}>
      {children}
      {isOpen && <PaletteModal onClose={() => setIsOpen(false)} role={role} />}
    </Ctx.Provider>
  );
}

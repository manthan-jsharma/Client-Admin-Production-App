'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCommandPalette } from '@/components/ui/command-palette';
import {
  LayoutDashboard, FolderKanban, Map, Settings2, CreditCard,
  MessageSquare, Users, ClipboardList, BarChart3, LogOut,
  UserCircle, ShieldCheck, Package, GitBranch, Star, Target,
  Wrench, LifeBuoy, SlidersHorizontal, ChevronsLeft, ChevronsRight,
  Search, X, Code2,
} from 'lucide-react';

type BadgeKey = 'pendingClients' | 'openTickets' | 'unreadMessages';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badgeKey?: BadgeKey;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const clientMenuGroups: MenuGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard/client',            label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/client/projects',   label: 'Projects',  icon: FolderKanban },
      { href: '/dashboard/client/roadmap',    label: 'Roadmap',   icon: Map },
      { href: '/dashboard/client/setup',      label: 'Setup',     icon: Settings2 },
    ],
  },
  {
    label: 'Billing',
    items: [
      { href: '/dashboard/client/payments',  label: 'Payments', icon: CreditCard },
      { href: '/dashboard/client/services',  label: 'Services',  icon: Package },
    ],
  },
  {
    label: 'Engage',
    items: [
      { href: '/dashboard/client/referrals',    label: 'Referrals',   icon: GitBranch },
      { href: '/dashboard/client/testimonials', label: 'Testimonial', icon: Star },
      { href: '/dashboard/client/lead-gen',     label: 'Lead Gen',    icon: Target },
      { href: '/dashboard/client/maintenance',  label: 'Maintenance', icon: Wrench },
      { href: '/dashboard/client/tickets',      label: 'Support',     icon: LifeBuoy },
      { href: '/dashboard/client/chat',         label: 'Chat',        icon: MessageSquare, badgeKey: 'unreadMessages' },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/client/profile', label: 'My Profile', icon: UserCircle },
    ],
  },
];

const devMenuGroups: MenuGroup[] = [
  {
    label: 'Work',
    items: [
      { href: '/dashboard/dev',       label: 'My Projects', icon: FolderKanban },
      { href: '/dashboard/dev/chat',  label: 'Chat',        icon: MessageSquare },
    ],
  },
];

const adminMenuGroups: MenuGroup[] = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard/admin',            label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/admin/projects',   label: 'Projects',  icon: FolderKanban },
      { href: '/dashboard/admin/clients',    label: 'Clients',   icon: Users },
      { href: '/dashboard/admin/approvals',  label: 'Approvals', icon: ShieldCheck, badgeKey: 'pendingClients' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/dashboard/admin/requests',  label: 'Tickets',    icon: ClipboardList, badgeKey: 'openTickets' },
      { href: '/dashboard/admin/chats',     label: 'Chats',      icon: MessageSquare, badgeKey: 'unreadMessages' },
      { href: '/dashboard/admin/payments',  label: 'Payments',   icon: CreditCard },
      { href: '/dashboard/admin/services',  label: 'Services',   icon: Package },
      { href: '/dashboard/admin/devs',      label: 'Developers', icon: Code2 },
    ],
  },
  {
    label: 'Grow',
    items: [
      { href: '/dashboard/admin/referrals',    label: 'Referrals',    icon: GitBranch },
      { href: '/dashboard/admin/testimonials', label: 'Testimonials', icon: Star },
      { href: '/dashboard/admin/lead-gen',     label: 'Lead Gen',     icon: Target },
      { href: '/dashboard/admin/maintenance',  label: 'Maintenance',  icon: Wrench },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/admin/settings',  label: 'Settings',  icon: SlidersHorizontal },
    ],
  },
];

type Counts = { pendingClients?: number; openTickets?: number; unreadMessages?: number };
const POLL_MS = 30_000;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/** Small tooltip shown when sidebar is collapsed */
function NavTooltip({ label, visible }: { label: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="animate-fade-up"
      style={{
        position: 'absolute',
        left: 'calc(100% + 10px)',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#1E2A32',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        padding: '5px 10px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 100,
        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
      }}
    >
      {label}
      <span style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid #1E2A32' }} />
    </div>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({});
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { open: openCmd } = useCommandPalette();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);
  const toggleCollapse = () => {
    setCollapsed(p => {
      localStorage.setItem('sidebar_collapsed', String(!p));
      return !p;
    });
  };

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) setCounts(result.data);
      } catch { /* ignore */ }
    };
    fetchCounts();
    pollRef.current = setInterval(fetchCounts, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  if (!user) return null;

  const groups = user.role === 'admin' ? adminMenuGroups : user.role === 'dev' ? devMenuGroups : clientMenuGroups;
  const handleLogout = () => { logout(); router.push('/login'); };
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const GLASS = {
    background: 'rgba(255,255,255,0.68)',
    backdropFilter: 'blur(24px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
    borderRight: '1px solid rgba(255,255,255,0.55)',
    boxShadow: '2px 0 20px rgba(58,141,222,0.06)',
  };

  // Close mobile drawer on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      onMobileClose?.();
    }
  }, [pathname, onMobileClose]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(30,42,50,0.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
          }}
        />
      )}
    <div
      className="flex flex-col overflow-hidden flex-shrink-0"
      style={{
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          width: 260,
        } : {
          position: 'relative', height: '100vh',
          width: collapsed ? 64 : 240,
        }),
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        ...GLASS,
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        style={{
          padding: collapsed && !isMobile ? '20px 0' : '20px 16px',
          borderBottom: '1px solid rgba(221,229,236,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          gap: 8,
        }}
      >
        {collapsed && !isMobile ? (
          <button onClick={toggleCollapse} title="Expand sidebar"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, background: 'rgba(58,141,222,0.1)', border: 'none', cursor: 'pointer' }}>
            <ChevronsRight style={{ width: 16, height: 16, color: '#3A8DDE' }} />
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(58,141,222,0.15) 0%, rgba(111,178,242,0.15) 100%)',
                border: '1px solid rgba(58,141,222,0.2)',
              }}>
                <img src="/icon.svg" alt="AI APP LABS" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <h1 style={{ fontSize: 12, fontWeight: 800, color: '#1E2A32', letterSpacing: '-0.02em', whiteSpace: 'nowrap', lineHeight: 1.2 }}>AI APP LABS</h1>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: user.role === 'dev' ? '#6BCF7A' : '#3A8DDE', lineHeight: 1.2 }}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'dev' ? 'Dev' : 'Client'} Portal
                </p>
              </div>
            </div>
            {isMobile ? (
              <button onClick={onMobileClose} title="Close"
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: 'transparent', border: '1px solid rgba(221,229,236,0.7)', cursor: 'pointer' }}>
                <X style={{ width: 14, height: 14, color: '#8A97A3' }} />
              </button>
            ) : (
              <button onClick={toggleCollapse} title="Collapse sidebar"
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: 'transparent', border: '1px solid rgba(221,229,236,0.7)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = '#3A8DDE'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(221,229,236,0.7)'; }}
              >
                <ChevronsLeft style={{ width: 13, height: 13, color: '#8A97A3' }} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Search / Command palette button */}
      {!collapsed && (
        <div style={{ padding: '10px 10px 2px' }}>
          <button
            onClick={openCmd}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(221,229,236,0.8)',
              background: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLElement).style.borderColor = '#3A8DDE'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(221,229,236,0.8)'; }}
          >
            <Search style={{ width: 13, height: 13, color: '#8A97A3' }} />
            <span style={{ flex: 1, fontSize: 12, color: '#8A97A3', textAlign: 'left' }}>Search…</span>
            <kbd style={{ fontSize: 10, color: '#8A97A3', background: 'rgba(221,229,236,0.6)', border: '1px solid rgba(221,229,236,0.9)', borderRadius: 5, padding: '2px 5px', fontFamily: 'inherit' }}>⌘K</kbd>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '12px 8px' : '12px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A97A3', padding: '0 10px 6px' }}>
                {group.label}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map(item => {
                const isActive = pathname === item.href || (
                  item.href !== '/dashboard/admin' && item.href !== '/dashboard/client' && item.href !== '/dashboard/dev' &&
                  pathname.startsWith(item.href + '/')
                );
                const Icon = item.icon;
                const badgeCount = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;

                return (
                  <div key={item.href} style={{ position: 'relative' }}
                    onMouseEnter={() => collapsed && setTooltip(item.label)}
                    onMouseLeave={() => collapsed && setTooltip(null)}
                  >
                    <Link
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: collapsed ? 0 : 10,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '9px' : '8px 10px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 500,
                        textDecoration: 'none',
                        position: 'relative',
                        transition: 'background 0.12s, color 0.12s',
                        background: isActive ? 'rgba(58,141,222,0.12)' : 'transparent',
                        color: isActive ? '#1E2A32' : '#5F6B76',
                      }}
                      onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; (e.currentTarget as HTMLElement).style.color = '#1E2A32'; } }}
                      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#5F6B76'; } }}
                    >
                      {/* Active left bar */}
                      {isActive && (
                        <span style={{
                          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                          width: 3, height: 18, borderRadius: 99, background: 'linear-gradient(180deg,#3A8DDE,#2F6FB2)',
                        }} />
                      )}
                      <Icon
                        style={{
                          width: 16, height: 16, flexShrink: 0,
                          color: isActive ? '#3A8DDE' : undefined,
                        }}
                      />
                      {!collapsed && (
                        <>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                          {badgeCount > 0 && (
                            <span style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              minWidth: 18, height: 18, padding: '0 4px',
                              background: 'linear-gradient(135deg,#4DA3F5,#2F6FB2)',
                              color: '#fff', fontSize: 10, fontWeight: 700,
                              borderRadius: 99,
                            }}>
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                        </>
                      )}
                      {/* Badge dot in collapsed mode */}
                      {collapsed && badgeCount > 0 && (
                        <span style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 7, height: 7, borderRadius: 99,
                          background: '#3A8DDE',
                          border: '1.5px solid rgba(255,255,255,0.8)',
                        }} />
                      )}
                    </Link>
                    <NavTooltip label={item.label} visible={collapsed && tooltip === item.label} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px', borderTop: '1px solid rgba(221,229,236,0.5)', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10 }}>
            {user.profilePicture ? (
              <img
                src={user.profilePicture} alt={user.name}
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(58,141,222,0.25)' }}
              />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: 'linear-gradient(135deg,#3A8DDE,#2F6FB2)', border: '2px solid rgba(58,141,222,0.25)',
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{initials}</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E2A32', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{user.name}</p>
              <p style={{ fontSize: 11, color: '#8A97A3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{user.email}</p>
            </div>
          </div>
        )}

        <div style={{ position: 'relative' }}
          onMouseEnter={() => collapsed && setTooltip('sign-out')}
          onMouseLeave={() => collapsed && setTooltip(null)}
        >
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 10, width: '100%',
              padding: collapsed ? '9px' : '8px 10px',
              borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent',
              fontSize: 13, fontWeight: 500, color: '#8A97A3',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#8A97A3';
            }}
          >
            <LogOut style={{ width: 16, height: 16, flexShrink: 0 }} />
            {!collapsed && <span>Sign out</span>}
          </button>
          <NavTooltip label="Sign out" visible={collapsed && tooltip === 'sign-out'} />
        </div>
      </div>
    </div>
    </>
  );
}

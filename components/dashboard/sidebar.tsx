'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  Settings2,
  CreditCard,
  MessageSquare,
  Users,
  ClipboardList,
  BarChart3,
  LogOut,
  Zap,
  ChevronRight,
  UserCircle,
  ShieldCheck,
  Package,
  GitBranch,
  Star,
  Target,
  Wrench,
  LifeBuoy,
  SlidersHorizontal,
} from 'lucide-react';

type BadgeKey = 'pendingClients' | 'openTickets' | 'unreadMessages';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: BadgeKey;
}

const clientMenu: MenuItem[] = [
  { href: '/dashboard/client', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/client/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/client/roadmap', label: 'Roadmap', icon: Map },
  { href: '/dashboard/client/setup', label: 'Setup', icon: Settings2 },
  { href: '/dashboard/client/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/client/services', label: 'Services', icon: Package },
  { href: '/dashboard/client/referrals', label: 'Referrals', icon: GitBranch },
  { href: '/dashboard/client/testimonials', label: 'Testimonial', icon: Star },
  { href: '/dashboard/client/lead-gen', label: 'Lead Generation', icon: Target },
  { href: '/dashboard/client/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/dashboard/client/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { href: '/dashboard/client/chat', label: 'Chat', icon: MessageSquare, badgeKey: 'unreadMessages' },
  { href: '/dashboard/client/profile', label: 'My Profile', icon: UserCircle },
];

const adminMenu: MenuItem[] = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/admin/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/admin/approvals', label: 'Approvals', icon: ShieldCheck, badgeKey: 'pendingClients' },
  { href: '/dashboard/admin/requests', label: 'Tickets', icon: ClipboardList, badgeKey: 'openTickets' },
  { href: '/dashboard/admin/chats', label: 'Chats', icon: MessageSquare, badgeKey: 'unreadMessages' },
  { href: '/dashboard/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/admin/services', label: 'Services', icon: Package },
  { href: '/dashboard/admin/referrals', label: 'Referrals', icon: GitBranch },
  { href: '/dashboard/admin/testimonials', label: 'Testimonials', icon: Star },
  { href: '/dashboard/admin/lead-gen', label: 'Lead Generation', icon: Target },
  { href: '/dashboard/admin/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: SlidersHorizontal },
];

type Counts = {
  pendingClients?: number;
  openTickets?: number;
  unreadMessages?: number;
};

const POLL_MS = 30_000;

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success) setCounts(result.data);
      } catch { /* ignore */ }
    };

    fetchCounts();
    pollRef.current = setInterval(fetchCounts, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  if (!user) return null;

  const items = user.role === 'admin' ? adminMenu : clientMenu;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-tight">BuildHub</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              {user.role === 'admin' ? 'Admin Portal' : 'Client Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 pb-2 pt-1">
          Navigation
        </p>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          const badgeCount = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              {isActive && badgeCount === 0 && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 text-slate-500" />
          Sign out
        </button>
      </div>
    </div>
  );
}

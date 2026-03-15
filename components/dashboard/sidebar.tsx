'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const menuItems = {
  client: [
    { href: '/dashboard/client', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/client/projects', label: 'Projects', icon: '📁' },
    { href: '/dashboard/client/roadmap', label: 'Roadmap', icon: '🗺️' },
    { href: '/dashboard/client/setup', label: 'Setup', icon: '⚙️' },
    { href: '/dashboard/client/payments', label: 'Payments', icon: '💳' },
    { href: '/dashboard/client/chat', label: 'Chat', icon: '💬' }
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/admin/projects', label: 'Projects', icon: '📁' },
    { href: '/dashboard/admin/clients', label: 'Clients', icon: '👥' },
    { href: '/dashboard/admin/requests', label: 'Requests', icon: '📝' },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: '📈' }
  ]
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const items = user.role === 'admin' ? menuItems.admin : menuItems.client;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 h-screen flex flex-col overflow-hidden">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">BuildHub</h1>
        <p className="text-xs text-slate-400 mt-1">Project Management</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4 space-y-3">
        <div className="px-4 py-3 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600/10 border border-red-600/50 text-red-400 rounded-lg hover:bg-red-600/20 text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

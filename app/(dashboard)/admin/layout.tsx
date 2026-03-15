'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && user.role !== 'admin') {
        // Redirect client users to client dashboard
        router.push('/dashboard/client');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900">
          {children}
        </div>
      </main>
    </div>
  );
}

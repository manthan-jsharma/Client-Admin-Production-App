'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/dashboard/sidebar';
import { ToastProvider } from '@/components/ui/toast-provider';
import { Menu } from 'lucide-react';

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter flex-1 overflow-y-auto">
      {children}
    </div>
  );
}

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) { router.push('/login'); return; }
      if (user.role === 'admin') { router.push('/dashboard/admin'); return; }
      if (user.role === 'client') { router.push('/dashboard/client'); return; }
      if (user.role !== 'dev') { router.push('/login'); return; }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#E9EEF2' }}>
        <div className="flex flex-col items-center gap-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: 'rgba(107,207,122,0.12)', border: '1px solid rgba(107,207,122,0.2)' }}
          >
            <img src="/icon.svg" alt="AI APP LABS" className="w-7 h-7 object-contain" />
          </div>
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(107,207,122,0.2)', borderTopColor: '#6BCF7A' }}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'dev') return null;

  return (
    <ToastProvider>
      <div className="flex h-screen" style={{ background: '#E9EEF2' }}>
        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 h-14 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(221,229,236,0.7)' }}>
            <button
              onClick={() => setMobileNavOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'rgba(107,207,122,0.08)', border: '1px solid rgba(107,207,122,0.15)', cursor: 'pointer' }}
            >
              <Menu size={18} color="#6BCF7A" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/icon.svg" alt="" style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1E2A32', letterSpacing: '-0.02em' }}>AI APP LABS</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 99, background: 'rgba(107,207,122,0.12)', color: '#6BCF7A', border: '1px solid rgba(107,207,122,0.25)' }}>
                Dev
              </span>
            </div>
          </div>
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </ToastProvider>
  );
}

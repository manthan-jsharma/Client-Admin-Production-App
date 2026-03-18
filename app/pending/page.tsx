'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Clock, XCircle, LogOut, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PendingPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) { router.push('/login'); return; }
      if (user.role === 'admin') { router.push('/dashboard/admin'); return; }
      if (user.status === 'approved') { router.push('/dashboard/client'); return; }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = () => { logout(); router.push('/login'); };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#E9EEF2' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
      </div>
    );
  }

  if (!user) return null;

  const isRejected = user.status === 'rejected';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#E9EEF2' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(58,141,222,0.2)' }}>
          <img src="/icon.svg" alt="AI APP LABS" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-lg font-bold" style={{ color: '#1E2A32', letterSpacing: '-0.02em' }}>AI APP LABS</span>
      </div>

      <div className="w-full max-w-md animate-fade-up">
        {isRejected ? (
          /* ── Rejected ── */
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid #fecaca', boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#fff1f2', border: '1px solid #fecaca' }}>
              <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1E2A32', letterSpacing: '-0.02em' }}>Application Not Approved</h1>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: '#5F6B76' }}>
              Unfortunately, your account request was not approved at this time.
            </p>

            {user.approvalFeedback && (
              <div className="mb-6 p-4 rounded-xl text-left" style={{ background: '#fff1f2', border: '1px solid #fecaca' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#ef4444' }}>Admin Feedback</p>
                <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{user.approvalFeedback}</p>
              </div>
            )}

            <div className="space-y-3">
              <a
                href="mailto:admin@example.com"
                className="flex items-center justify-center gap-2 w-full h-11 font-medium rounded-xl transition-all text-sm"
                style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#3A8DDE'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'}
              >
                <Mail className="w-4 h-4" /> Contact Support
              </a>
              <button
                onClick={handleLogout}
                className="w-full h-11 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                style={{ background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#fff1f2';
                  (e.currentTarget as HTMLElement).style.color = '#ef4444';
                  (e.currentTarget as HTMLElement).style.borderColor = '#fecaca';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)';
                  (e.currentTarget as HTMLElement).style.color = '#8A97A3';
                  (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC';
                }}
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        ) : (
          /* ── Pending ── */
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid #DDE5EC', boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.85)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <Clock className="w-8 h-8 animate-pulse" style={{ color: '#f59e0b' }} />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1E2A32', letterSpacing: '-0.02em' }}>Account Pending Approval</h1>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#5F6B76' }}>
              Your account has been submitted and is awaiting admin review. You&apos;ll gain full access once approved.
            </p>

            {/* User details */}
            <div className="mb-6 p-4 rounded-xl text-left space-y-2.5" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
              {[
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email },
                ...(user.businessName ? [{ label: 'Business', value: user.businessName }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#8A97A3' }}>{label}</span>
                  <span className="text-xs font-medium" style={{ color: '#334155' }}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: '#8A97A3' }}>Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#f59e0b', border: '1px solid #fde68a' }}>
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-6 space-y-3 text-left">
              {[
                { step: '1', text: 'Account created', done: true },
                { step: '2', text: 'Admin reviews your application', done: false, active: true },
                { step: '3', text: 'Account activated — start using AI APP LABS', done: false },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{
                      background: item.done ? '#3A8DDE' : item.active ? '#f59e0b' : '#DDE5EC',
                      color: item.done || item.active ? '#ffffff' : '#8A97A3',
                    }}
                  >
                    {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : item.step}
                  </div>
                  <span className="text-sm" style={{
                    color: item.done ? '#3A8DDE' : item.active ? '#f59e0b' : '#8A97A3',
                  }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.refresh()}
                className="btn-primary w-full h-11 text-sm rounded-xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Check status
              </button>
              <button
                onClick={handleLogout}
                className="w-full h-11 font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                style={{ background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#fff1f2';
                  (e.currentTarget as HTMLElement).style.color = '#ef4444';
                  (e.currentTarget as HTMLElement).style.borderColor = '#fecaca';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)';
                  (e.currentTarget as HTMLElement).style.color = '#8A97A3';
                  (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC';
                }}
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

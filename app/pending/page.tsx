'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Zap, Clock, XCircle, LogOut, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PendingPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }
      // If admin somehow lands here, redirect to dashboard
      if (user.role === 'admin') {
        router.push('/dashboard/admin');
        return;
      }
      // If client is approved, redirect to dashboard
      if (user.status === 'approved') {
        router.push('/dashboard/client');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isRejected = user.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
          <img src="/icon.svg" alt="AI APP LABS" className="w-9 h-9 object-contain" />
        </div>
        <span className="text-lg font-bold text-white">AI APP LABS</span>
      </div>

      <div className="w-full max-w-md">
        {isRejected ? (
          /* ── Rejected State ── */
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Application Not Approved</h1>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Unfortunately, your account request was not approved at this time.
            </p>

            {user.approvalFeedback && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                <p className="text-xs font-semibold text-red-400 mb-1.5 uppercase tracking-wider">Admin Feedback</p>
                <p className="text-sm text-slate-300 leading-relaxed">{user.approvalFeedback}</p>
              </div>
            )}

            <div className="space-y-3">
              <a
                href="mailto:admin@example.com"
                className="flex items-center justify-center gap-2 w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition-all text-sm border border-slate-700"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
              <Button
                onClick={handleLogout}
                className="w-full h-11 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </div>
        ) : (
          /* ── Pending State ── */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Account Pending Approval</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Your account has been submitted and is awaiting admin review. You&apos;ll gain full access once approved.
            </p>

            {/* User details */}
            <div className="mb-6 p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Name</span>
                <span className="text-xs font-medium text-white">{user.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Email</span>
                <span className="text-xs font-medium text-white">{user.email}</span>
              </div>
              {user.businessName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Business</span>
                  <span className="text-xs font-medium text-white">{user.businessName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Pending Review
                </span>
              </div>
            </div>

            {/* Steps */}
            <div className="mb-6 space-y-3 text-left">
              {[
                { step: '1', text: 'Account created', done: true },
                { step: '2', text: 'Admin reviews your application', done: false, active: true },
                { step: '3', text: 'Account activated — start using AI APP LABS', done: false },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    item.done
                      ? 'bg-emerald-500 text-white'
                      : item.active
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-500'
                  }`}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <span className={`text-sm ${item.done ? 'text-emerald-400' : item.active ? 'text-amber-300' : 'text-slate-600'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.refresh()}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check status
              </Button>
              <Button
                onClick={handleLogout}
                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

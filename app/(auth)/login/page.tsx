'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, AlertCircle, ArrowRight, Clock, CheckCircle2, FolderKanban, MessageSquare, CreditCard } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!email || !password) throw new Error('Please enter email and password');
      await login(email, password);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
      return;
    }
    const storedUser = localStorage.getItem('auth_user');
    if (!storedUser) { setIsLoading(false); return; }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.status === 'pending') { router.push('/pending'); return; }
    router.push(parsedUser.role === 'admin' ? '/dashboard/admin' : '/dashboard/client');
  };

  const features = [
    { icon: FolderKanban, text: 'Real-time project tracking & roadmaps' },
    { icon: MessageSquare, text: 'Client communication & file sharing' },
    { icon: CreditCard, text: 'Payment management & invoicing' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#E9EEF2' }}>
      {/* Left panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #3A8DDE 0%, #2F6FB2 40%, #1a4f82 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: '#ffffff', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#ffffff', transform: 'translate(-30%, 30%)' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-5" style={{ background: '#ffffff', transform: 'translate(-50%, -50%)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <img src="/icon.svg" alt="AI APP LABS" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>AI APP LABS</span>
        </div>

        {/* Copy */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>
              Manage projects<br />with confidence.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              A unified workspace for tracking progress, communicating with clients, and delivering results on time.
            </p>
          </div>
          <div className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>© 2026 AI APP LABS. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#ffffff' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
              <img src="/icon.svg" alt="AI APP LABS" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-lg font-bold" style={{ color: '#1E2A32' }}>AI APP LABS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: '#1E2A32', letterSpacing: '-0.03em' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: '#5F6B76' }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-4 rounded-xl animate-fade-up" style={{ background: '#fff1f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email — floating label */}
            <div className="fl-wrap rounded-xl transition-all" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#3A8DDE'}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'}
            >
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: '#8A97A3' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder=" "
                required
                className="w-full pl-10 pr-4 rounded-xl text-sm outline-none bg-transparent transition-all"
                style={{ color: '#1E2A32' }}
              />
              <label>Email address</label>
            </div>

            {/* Password — floating label */}
            <div className="fl-wrap rounded-xl transition-all" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#3A8DDE'}
              onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'}
            >
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: '#8A97A3' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder=" "
                required
                className="w-full pl-10 pr-4 rounded-xl text-sm outline-none bg-transparent transition-all"
                style={{ color: '#1E2A32' }}
              />
              <label>Password</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#8A97A3' }}>Demo Credentials</p>
            <div className="space-y-1.5">
              {[
                { role: 'Client', creds: 'client@example.com / Test1234' },
                { role: 'Admin',  creds: 'admin@example.com / Test1234' },
              ].map(({ role, creds }) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#8A97A3' }}>{role}</span>
                  <span className="text-xs font-mono" style={{ color: '#334155' }}>{creds}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <p className="text-xs" style={{ color: '#92400e' }}>New accounts require admin approval before access is granted.</p>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#8A97A3' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold transition-colors" style={{ color: '#3A8DDE' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#2F6FB2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Users, ClipboardList, Settings2 } from 'lucide-react';

export default function AdminLoginPage() {
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
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!result.success || !result.data) throw new Error(result.error || 'Login failed');
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('auth_user', JSON.stringify(result.data.user));
      window.location.href = '/dashboard/admin';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Users,         text: 'Manage clients & project workflows' },
    { icon: ClipboardList, text: 'Review deliveries and approvals' },
    { icon: Settings2,     text: 'Full platform configuration access' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#E9EEF2' }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10" style={{ background: '#3A8DDE', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10" style={{ background: '#8b5cf6', transform: 'translate(-30%, 30%)' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <img src="/icon.svg" alt="AI APP LABS" className="w-7 h-7 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>AI APP LABS</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
              Admin
            </span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ letterSpacing: '-0.03em' }}>Admin portal</h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Restricted access. Only authorised administrators may sign in here.
            </p>
          </div>
          <div className="space-y-3.5">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 AI APP LABS. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#ffffff' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <img src="/icon.svg" alt="AI APP LABS" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-lg font-bold" style={{ color: '#1E2A32' }}>AI APP LABS Admin</span>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4" style={{ background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' }}>
              <ShieldCheck className="w-3 h-3" />
              Administrator access only
            </div>
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: '#1E2A32', letterSpacing: '-0.03em' }}>Admin sign in</h1>
            <p className="text-sm" style={{ color: '#5F6B76' }}>Enter your admin credentials to access the portal</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl animate-fade-up" style={{ background: '#fff1f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email — floating label */}
            <div className="fl-wrap rounded-xl transition-all" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#8b5cf6'}
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
              onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#8b5cf6'}
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
              className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:scale-95 mt-2"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 45%, #7c3aed 100%)',
                boxShadow: '0 4px 16px rgba(139,92,246,0.38), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : (
                <>Sign in to admin portal <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-8" style={{ color: '#8A97A3' }}>
            Not an admin?{' '}
            <a href="/login" className="transition-colors" style={{ color: '#5F6B76' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#5F6B76'}
            >
              Go to client login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

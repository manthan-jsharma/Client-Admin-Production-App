'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Mail, Lock, User, Phone, Building2, Briefcase, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', businessName: '', phone: '', company: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!formData.email || !formData.password || !formData.name || !formData.businessName)
        throw new Error('Please fill in all required fields');
      if (formData.password !== formData.confirmPassword)
        throw new Error('Passwords do not match');
      if (formData.password.length < 8)
        throw new Error('Password must be at least 8 characters');
      await signup(formData.email, formData.password, formData.name, formData.businessName, formData.phone || undefined, formData.company || undefined);
      router.push('/pending');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32',
  };

  const fields = [
    { label: 'Full name', name: 'name', type: 'text', placeholder: 'John Doe', icon: User, required: true },
    { label: 'Business name', name: 'businessName', type: 'text', placeholder: 'Acme Inc.', icon: Briefcase, required: true },
    { label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com', icon: Mail, required: true, fullWidth: true },
    { label: 'Company', name: 'company', type: 'text', placeholder: 'Company name', icon: Building2 },
    { label: 'Phone', name: 'phone', type: 'tel', placeholder: '+1 555 0000', icon: Phone },
    { label: 'Password', name: 'password', type: 'password', placeholder: 'Min. 8 characters', icon: Lock, required: true, hint: 'Must include uppercase, lowercase, and a number' },
    { label: 'Confirm password', name: 'confirmPassword', type: 'password', placeholder: 'Re-enter password', icon: Lock, required: true },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#E9EEF2' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
            <img src="/icon.svg" alt="AI APP LABS" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-lg font-bold" style={{ color: '#1E2A32', letterSpacing: '-0.02em' }}>AI APP LABS</span>
        </div>

        <div
          className="rounded-2xl p-8 animate-fade-up"
          style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)' }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1.5" style={{ color: '#1E2A32', letterSpacing: '-0.03em' }}>Create your account</h1>
            <p className="text-sm" style={{ color: '#5F6B76' }}>
              Join AI APP LABS — your account will be reviewed by an admin before activation.
            </p>
          </div>

          {/* Approval notice */}
          <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3A8DDE' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
              After signing up, your account will be <strong>pending admin approval</strong>. You&apos;ll be notified once access is granted.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl animate-fade-up" style={{ background: '#fff1f2', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ label, name, type, placeholder, icon: Icon, required, hint, fullWidth }) => (
                <div key={name} className={`space-y-1.5 ${fullWidth ? 'sm:col-span-2' : ''}`}>
                  <label className="text-sm font-semibold" style={{ color: '#334155' }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input
                      type={type}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      required={required}
                      className="w-full pl-10 pr-4 h-10 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#3A8DDE')}
                      onBlur={e => (e.target.style.borderColor = '#DDE5EC')}
                    />
                  </div>
                  {hint && <p className="text-xs" style={{ color: '#8A97A3' }}>{hint}</p>}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 mt-2"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#8A97A3' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold transition-colors" style={{ color: '#3A8DDE' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#2F6FB2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

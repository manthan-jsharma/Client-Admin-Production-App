'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Referral } from '@/lib/types';
import {
  GitBranch, Gift, CheckCircle2, Clock, PhoneCall,
  Mail, Building2, Plus, X, AlertCircle, Users,
  Sparkles, ArrowRight, MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: '18px',
};

const CLIENT_STATUS: Record<Referral['status'], { label: string; badgeBg: string; badgeColor: string; badgeBorder: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { label: 'Submitted',    badgeBg: '#eff8ff', badgeColor: '#3A8DDE', badgeBorder: '#c8dff0', icon: Clock },
  contacted: { label: 'Under Review', badgeBg: '#fffbeb', badgeColor: '#f59e0b', badgeBorder: '#fde68a', icon: PhoneCall },
  converted: { label: 'Approved',     badgeBg: 'rgba(107,207,122,0.1)', badgeColor: '#6BCF7A', badgeBorder: '#a7f3d0', icon: CheckCircle2 },
  rejected:  { label: 'Not Eligible', badgeBg: 'rgba(58,141,222,0.06)', badgeColor: '#5F6B76', badgeBorder: '#DDE5EC', icon: X },
};

const STEPS = [
  { n: '1', label: 'Submit a referral',  sub: 'Fill in your contact\'s details below' },
  { n: '2', label: 'We reach out',       sub: 'Our team contacts them within 48 hrs' },
  { n: '3', label: 'Earn your reward',   sub: 'Get a free AI software asset on conversion' },
];

export default function ClientReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ refereeName: '', refereeEmail: '', refereePhone: '', refereeCompany: '', notes: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchReferrals(); }, []);

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/referrals', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setReferrals(result.data);
    } catch { notify('error', 'Failed to load referrals'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 5000); };

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (!form.refereeName.trim()) errs.refereeName = 'Name is required';
    if (!form.refereeEmail.trim() || !form.refereeEmail.includes('@')) errs.refereeEmail = 'Valid email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setReferrals(prev => [result.data, ...prev]);
        setForm({ refereeName: '', refereeEmail: '', refereePhone: '', refereeCompany: '', notes: '' });
        setShowForm(false);
        notify('success', 'Referral submitted! We\'ll be in touch shortly.');
      } else notify('error', result.error || 'Failed to submit');
    } catch { notify('error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const approvedCount = referrals.filter(r => r.status === 'converted').length;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Referral Program"
        subtitle="Refer a contact and earn a free AI software asset"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Referrals' }]}
        heroStrip
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 font-semibold rounded-xl h-10 px-4 text-sm transition-all duration-150 active:scale-95"
            style={showForm
              ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }
              : { background: '#3A8DDE', color: 'white' }
            }
            onMouseEnter={e => { if (!showForm) (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
            onMouseLeave={e => { if (!showForm) (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Refer Someone</>}
          </button>
        }
      />

      <div className="p-8 space-y-5 animate-fade-up">
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium"
            style={notification.type === 'success'
              ? { background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0', color: '#6BCF7A' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }
            }
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Reward Banner */}
        <div className="relative overflow-hidden" style={{ ...CARD, border: '1px solid #c8dff0' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }} />
          <div className="p-6 relative">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Your Reward</span>
                </div>
                <h2 className="text-lg font-bold mb-1.5" style={{ color: '#1E2A32' }}>Free AI Software Asset</h2>
                <p className="text-sm leading-relaxed max-w-xl" style={{ color: '#334155' }}>
                  For every contact you refer who becomes a client, you'll receive a{' '}
                  <span style={{ color: '#3A8DDE', fontWeight: 600 }}>free AI software asset</span>{' '}
                  delivered to your account. No limits on referrals.
                </p>
                {approvedCount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#6BCF7A' }} />
                    <span className="text-xs font-semibold" style={{ color: '#6BCF7A' }}>{approvedCount} reward{approvedCount > 1 ? 's' : ''} earned</span>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="pt-5 grid grid-cols-3 gap-4" style={{ borderTop: '1px solid #f1f5f9' }}>
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5" style={{ background: '#3A8DDE' }}>
                    {step.n}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#1E2A32' }}>{step.label}</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#5F6B76' }}>{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submission Form */}
        {showForm && (
          <div className="overflow-hidden" style={CARD}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Submit a Referral</h2>
              <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>Tell us about the person you're referring</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input
                    value={form.refereeName}
                    onChange={e => { setForm(f => ({ ...f, refereeName: e.target.value })); setErrors(er => ({ ...er, refereeName: '' })); }}
                    placeholder="Jane Smith"
                    className="rounded-xl h-10"
                    style={{ background: 'rgba(58,141,222,0.06)', border: errors.refereeName ? '1px solid #ef4444' : '1px solid #DDE5EC', color: '#1E2A32' }}
                  />
                  {errors.refereeName && <p className="text-xs" style={{ color: '#ef4444' }}>{errors.refereeName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input
                    type="email"
                    value={form.refereeEmail}
                    onChange={e => { setForm(f => ({ ...f, refereeEmail: e.target.value })); setErrors(er => ({ ...er, refereeEmail: '' })); }}
                    placeholder="jane@company.com"
                    className="rounded-xl h-10"
                    style={{ background: 'rgba(58,141,222,0.06)', border: errors.refereeEmail ? '1px solid #ef4444' : '1px solid #DDE5EC', color: '#1E2A32' }}
                  />
                  {errors.refereeEmail && <p className="text-xs" style={{ color: '#ef4444' }}>{errors.refereeEmail}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>
                    Phone <span className="font-normal normal-case" style={{ color: '#8A97A3' }}>(optional)</span>
                  </label>
                  <Input
                    type="tel"
                    value={form.refereePhone}
                    onChange={e => setForm(f => ({ ...f, refereePhone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                    className="rounded-xl h-10"
                    style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>
                    Company <span className="font-normal normal-case" style={{ color: '#8A97A3' }}>(optional)</span>
                  </label>
                  <Input
                    value={form.refereeCompany}
                    onChange={e => setForm(f => ({ ...f, refereeCompany: e.target.value }))}
                    placeholder="Acme Corp"
                    className="rounded-xl h-10"
                    style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>
                  Context <span className="font-normal normal-case" style={{ color: '#8A97A3' }}>(optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. She runs a startup and is looking to build a customer dashboard…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl focus:outline-none text-sm resize-none"
                  style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A8DDE'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,149,221,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#DDE5EC'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 font-semibold rounded-xl px-6 h-10 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: '#3A8DDE', color: 'white' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
                >
                  {isSubmitting ? 'Submitting…' : <><GitBranch className="w-4 h-4" /> Submit Referral</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="font-medium rounded-xl px-5 h-10 text-sm transition-all duration-150 active:scale-95"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Referrals List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#334155' }}>
              Your Referrals
              {referrals.length > 0 && <span className="ml-2 font-normal" style={{ color: '#8A97A3' }}>({referrals.length})</span>}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              <p className="text-xs" style={{ color: '#5F6B76' }}>Loading…</p>
            </div>
          ) : referrals.length === 0 ? (
            <EmptyState variant="clients" />
          ) : (
            <div className="space-y-3">
              {referrals.map(r => {
                const sc = CLIENT_STATUS[r.status];
                const StatusIcon = sc.icon;
                return (
                  <div
                    key={r._id}
                    className="transition-all duration-200 overflow-hidden"
                    style={{
                      ...CARD,
                      border: r.status === 'converted' ? '1px solid #a7f3d0' : '1px solid #DDE5EC',
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                            style={r.status === 'converted'
                              ? { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A' }
                              : { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }
                            }
                          >
                            {r.refereeName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{r.refereeName}</h3>
                              <span
                                className="inline-flex items-center gap-1 font-semibold"
                                style={{ background: sc.badgeBg, color: sc.badgeColor, border: `1px solid ${sc.badgeBorder}`, borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }}
                              >
                                <StatusIcon className="w-3 h-3" />{sc.label}
                              </span>
                              {r.status === 'converted' && (
                                <span
                                  className="inline-flex items-center gap-1 font-semibold"
                                  style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }}
                                >
                                  <Gift className="w-3 h-3" /> Reward earned
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6B76' }}>
                                <Mail className="w-3 h-3" style={{ color: '#8A97A3' }} />{r.refereeEmail}
                              </div>
                              {r.refereePhone && (
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6B76' }}>
                                  <PhoneCall className="w-3 h-3" style={{ color: '#8A97A3' }} />{r.refereePhone}
                                </div>
                              )}
                              {r.refereeCompany && (
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6B76' }}>
                                  <Building2 className="w-3 h-3" style={{ color: '#8A97A3' }} />{r.refereeCompany}
                                </div>
                              )}
                            </div>

                            {r.notes && (
                              <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2 mt-2" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                                <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: '#8A97A3' }} />
                                <p className="leading-relaxed" style={{ color: '#5F6B76' }}>{r.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs" style={{ color: '#8A97A3' }}>{new Date(r.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>

                      {/* Status timeline */}
                      <div className="mt-4 pt-4 flex items-center gap-1" style={{ borderTop: '1px solid #f1f5f9' }}>
                        {(['pending', 'contacted', 'converted'] as const).map((s, i) => {
                          const isPast = (s === 'pending') ||
                            (s === 'contacted' && (r.status === 'contacted' || r.status === 'converted')) ||
                            (s === 'converted' && r.status === 'converted');
                          return (
                            <React.Fragment key={s}>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
                                  style={{ background: isPast ? '#3A8DDE' : '#DDE5EC' }}
                                />
                                <span className="text-[11px] font-medium transition-colors" style={{ color: isPast ? '#334155' : '#8A97A3' }}>
                                  {CLIENT_STATUS[s].label}
                                </span>
                              </div>
                              {i < 2 && (
                                <div
                                  className="flex-1 h-px transition-colors"
                                  style={{ background: isPast && !(s === 'contacted' && r.status === 'pending') ? '#c8dff0' : '#DDE5EC' }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                        {r.status === 'rejected' && <span className="ml-2 text-[11px]" style={{ color: '#8A97A3' }}>— Not eligible</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {referrals.length > 0 && (
          <p className="text-xs text-center pt-2" style={{ color: '#8A97A3' }}>
            Status updates within <span style={{ color: '#5F6B76' }}>48 hours</span> · Reward delivered on successful conversion
          </p>
        )}
      </div>
    </div>
  );
}

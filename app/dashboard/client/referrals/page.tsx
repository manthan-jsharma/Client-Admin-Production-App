'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Referral } from '@/lib/types';
import {
  GitBranch, Gift, CheckCircle2, Clock, PhoneCall,
  Mail, Building2, Plus, X, AlertCircle, Users,
  Sparkles, ArrowRight, MessageSquare,
} from 'lucide-react';

// Map internal status → client-facing label
const CLIENT_STATUS: Record<Referral['status'], { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { label: 'Submitted',    badge: 'bg-blue-500/15 text-blue-400',    icon: Clock },
  contacted: { label: 'Under Review', badge: 'bg-amber-500/15 text-amber-400',  icon: PhoneCall },
  converted: { label: 'Approved',     badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected:  { label: 'Not Eligible', badge: 'bg-slate-600/50 text-slate-400',  icon: X },
};

const STEPS = [
  { n: '1', label: 'Submit a referral', sub: 'Fill in your contact\'s details below' },
  { n: '2', label: 'We reach out', sub: 'Our team contacts them within 48 hrs' },
  { n: '3', label: 'Earn your reward', sub: 'Get a free AI software asset on conversion' },
];

export default function ClientReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [form, setForm] = useState({
    refereeName: '',
    refereeEmail: '',
    refereePhone: '',
    refereeCompany: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await fetch('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setReferrals(result.data);
    } catch {
      notify('error', 'Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

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
        notify('success', 'Referral submitted successfully! We\'ll be in touch shortly.');
      } else {
        notify('error', result.error || 'Failed to submit referral');
      }
    } catch {
      notify('error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedCount = referrals.filter(r => r.status === 'converted').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Referral Program</h1>
            <p className="text-sm text-slate-500 mt-1">Refer a contact and earn a free AI software asset</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
              showForm
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Refer Someone</>}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Reward Banner */}
        <Card className="bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-slate-800/60 border-blue-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Your Reward</span>
                </div>
                <h2 className="text-lg font-bold text-white mb-1">Free AI Software Asset</h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  For every person you refer who becomes a client, you'll receive a <span className="text-blue-400 font-semibold">free AI software asset</span> —
                  delivered directly to your account. No limits on how many referrals you can submit.
                </p>
                {approvedCount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 rounded-lg px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">{approvedCount} reward{approvedCount > 1 ? 's' : ''} earned so far</span>
                  </div>
                )}
              </div>
            </div>

            {/* Steps */}
            <div className="mt-5 pt-5 border-t border-slate-700/50 grid grid-cols-3 gap-4">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mt-0.5">
                    {step.n}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{step.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Submission Form */}
        {showForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-base font-semibold text-white">Submit a Referral</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tell us about the person you're referring</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Full Name <span className="text-red-400">*</span></label>
                  <Input
                    value={form.refereeName}
                    onChange={e => { setForm(f => ({ ...f, refereeName: e.target.value })); setErrors(er => ({ ...er, refereeName: '' })); }}
                    placeholder="Jane Smith"
                    className={`bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 rounded-xl h-10 ${errors.refereeName ? 'border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {errors.refereeName && <p className="text-xs text-red-400">{errors.refereeName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email Address <span className="text-red-400">*</span></label>
                  <Input
                    type="email"
                    value={form.refereeEmail}
                    onChange={e => { setForm(f => ({ ...f, refereeEmail: e.target.value })); setErrors(er => ({ ...er, refereeEmail: '' })); }}
                    placeholder="jane@company.com"
                    className={`bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 rounded-xl h-10 ${errors.refereeEmail ? 'border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {errors.refereeEmail && <p className="text-xs text-red-400">{errors.refereeEmail}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Phone Number</label>
                  <Input
                    type="tel"
                    value={form.refereePhone}
                    onChange={e => setForm(f => ({ ...f, refereePhone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                    className="bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Company / Business</label>
                  <Input
                    value={form.refereeCompany}
                    onChange={e => setForm(f => ({ ...f, refereeCompany: e.target.value }))}
                    placeholder="Acme Corp"
                    className="bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Message / Context <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. She runs a startup and is looking to build a customer dashboard..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700/80 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20 disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : <><GitBranch className="w-4 h-4" /> Submit Referral</>}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl px-5 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Referrals List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Your Referrals
              {referrals.length > 0 && <span className="ml-2 text-slate-600 font-normal">({referrals.length})</span>}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-7 h-7 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <Card className="bg-slate-800/60 border-slate-700/50 p-12 text-center">
              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1.5">No referrals yet</p>
              <p className="text-slate-600 text-sm mb-4">Click "Refer Someone" to submit your first referral</p>
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm mx-auto"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Get Started
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {referrals.map(r => {
                const sc = CLIENT_STATUS[r.status];
                const StatusIcon = sc.icon;
                return (
                  <Card key={r._id} className={`border transition-all duration-200 ${r.status === 'converted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${r.status === 'converted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/60 text-slate-400'}`}>
                            {r.refereeName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="text-sm font-semibold text-white">{r.refereeName}</h3>
                              <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${sc.badge}`}>
                                <StatusIcon className="w-3 h-3" />
                                {sc.label}
                              </span>
                              {r.status === 'converted' && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                                  <Gift className="w-3 h-3" /> Reward earned
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail className="w-3 h-3 text-slate-600" />
                                {r.refereeEmail}
                              </div>
                              {r.refereePhone && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <PhoneCall className="w-3 h-3 text-slate-600" />
                                  {r.refereePhone}
                                </div>
                              )}
                              {r.refereeCompany && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Building2 className="w-3 h-3 text-slate-600" />
                                  {r.refereeCompany}
                                </div>
                              )}
                            </div>

                            {r.notes && (
                              <div className="flex items-start gap-2 text-xs bg-slate-700/30 rounded-lg px-3 py-2 mt-2">
                                <MessageSquare className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                                <p className="text-slate-400 leading-relaxed">{r.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-600">
                            {new Date(r.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Status timeline */}
                      <div className="mt-4 pt-4 border-t border-slate-700/30 flex items-center gap-1">
                        {(['pending', 'contacted', 'converted'] as const).map((s, i) => {
                          const isActive = r.status === s || (s === 'pending' && r.status !== 'rejected') || (s === 'contacted' && (r.status === 'contacted' || r.status === 'converted')) || (s === 'converted' && r.status === 'converted');
                          const isPast = (s === 'pending') || (s === 'contacted' && (r.status === 'contacted' || r.status === 'converted')) || (s === 'converted' && r.status === 'converted');
                          const isCurrent = r.status === s || (r.status === 'rejected' && s === 'pending');
                          return (
                            <React.Fragment key={s}>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPast ? 'bg-blue-500' : 'bg-slate-700'}`} />
                                <span className={`text-[11px] font-medium ${isPast ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {CLIENT_STATUS[s].label}
                                </span>
                              </div>
                              {i < 2 && <div className={`flex-1 h-px ${isPast && !(s === 'contacted' && r.status === 'pending') ? 'bg-blue-500/40' : 'bg-slate-700'}`} />}
                            </React.Fragment>
                          );
                        })}
                        {r.status === 'rejected' && (
                          <span className="ml-2 text-[11px] text-slate-600">— Not eligible</span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer tip */}
        {referrals.length > 0 && (
          <p className="text-xs text-slate-600 text-center pt-2">
            Status updates within <span className="text-slate-500">48 hours</span> of submission. Reward delivered on successful conversion.
          </p>
        )}
      </div>
    </div>
  );
}

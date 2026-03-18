'use client';

import React, { useState, useEffect } from 'react';
import { LeadGenRequest } from '@/lib/types';
import {
  Target, Plus, X, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, DollarSign, Calendar, FileText,
} from 'lucide-react';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.07), 0 1px 4px rgba(0,0,0,0.04)',
  borderRadius: '16px',
};

const STATUS_CONFIG = {
  pending:  { label: 'Submitted',    badgeStyle: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' },    icon: Clock },
  approved: { label: 'Approved',     badgeStyle: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' },    icon: CheckCircle2 },
  rejected: { label: 'Not Eligible', badgeStyle: { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' },    icon: X },
};

const BUDGET_OPTIONS = ['Under $1,000', '$1,000 – $5,000', '$5,000 – $10,000', '$10,000 – $25,000', '$25,000 – $50,000', '$50,000+'];
const TIMELINE_OPTIONS = ['ASAP / Urgent', '1–2 weeks', '1 month', '2–3 months', '3–6 months', 'Flexible'];

export default function ClientLeadGenPage() {
  const [requests, setRequests] = useState<LeadGenRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ details: '', budget: '', timeline: '' });
  const [errors, setErrors] = useState<{ details?: string; budget?: string; timeline?: string }>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/lead-gen', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setRequests(result.data);
    } catch { notify('error', 'Failed to load requests'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 5000); };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.details.trim() || form.details.trim().length < 30) errs.details = 'Please describe your requirements in at least 30 characters';
    if (!form.budget) errs.budget = 'Please select a budget range';
    if (!form.timeline) errs.timeline = 'Please select a timeline';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lead-gen', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const result = await res.json();
      if (result.success) {
        setRequests(prev => [result.data, ...prev]);
        setForm({ details: '', budget: '', timeline: '' }); setShowForm(false);
        notify('success', 'Lead generation request submitted! Our team will review it shortly.');
      } else notify('error', result.error || 'Failed to submit request');
    } catch { notify('error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 bg-white" style={{ borderBottom: '1px solid #DDE5EC' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1E2A32' }}>Lead Generation</h1>
            <p className="text-sm mt-1" style={{ color: '#5F6B76' }}>Submit lead generation requests — our team will qualify and action them</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 font-semibold rounded-xl h-10 px-4 text-sm transition-all"
            style={showForm
              ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }
              : { background: '#3A8DDE', color: '#ffffff' }}>
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Request</>}
          </button>
        </div>
      </div>

      <div className="p-8 space-y-5">
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium"
            style={notification.type === 'success'
              ? { background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0', color: '#6BCF7A' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Info card */}
        <div style={{ ...CARD, border: '1px solid #ddd6fe' }} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-violet-400 via-violet-200 to-transparent" />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <Target className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#1E2A32' }}>Grow your pipeline</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5F6B76' }}>
                Tell us about your target audience, budget, and timeline. Our team reviews every request and reaches out to discuss the best strategy. You can track the status of each submission here.
              </p>
            </div>
          </div>
        </div>

        {/* Submit form */}
        {showForm && (
          <div style={CARD} className="overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>New Lead Generation Request</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Describe your requirements and we&apos;ll get back to you</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Requirements & Target Audience <span style={{ color: '#ef4444' }}>*</span></label>
                  <span className="text-[11px]" style={{ color: '#8A97A3' }}>{form.details.length}/1000</span>
                </div>
                <textarea value={form.details} onChange={e => { setForm(f => ({ ...f, details: e.target.value.slice(0, 1000) })); setErrors(er => ({ ...er, details: '' })); }}
                  placeholder="Describe your ideal leads: industry, company size, geography, pain points, decision-maker titles, etc." rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm resize-none leading-relaxed transition-all focus:outline-none"
                  style={{
                    background: 'rgba(58,141,222,0.06)',
                    border: errors.details ? '1px solid #ef4444' : '1px solid #DDE5EC',
                    color: '#1E2A32',
                  }} />
                {errors.details && <p className="text-xs" style={{ color: '#ef4444' }}>{errors.details}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Budget Range <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {BUDGET_OPTIONS.map(opt => (
                      <button key={opt} type="button" onClick={() => { setForm(f => ({ ...f, budget: opt })); setErrors(e => ({ ...e, budget: '' })); }}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                        style={form.budget === opt
                          ? { background: '#3A8DDE', border: '1px solid #3A8DDE', color: '#ffffff' }
                          : { background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#5F6B76' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.budget && <p className="text-xs" style={{ color: '#ef4444' }}>{errors.budget}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Timeline <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {TIMELINE_OPTIONS.map(opt => (
                      <button key={opt} type="button" onClick={() => { setForm(f => ({ ...f, timeline: opt })); setErrors(e => ({ ...e, timeline: '' })); }}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                        style={form.timeline === opt
                          ? { background: '#8b5cf6', border: '1px solid #8b5cf6', color: '#ffffff' }
                          : { background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#5F6B76' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.timeline && <p className="text-xs" style={{ color: '#ef4444' }}>{errors.timeline}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 disabled:opacity-50 text-white font-semibold rounded-xl px-6 h-10 text-sm transition-colors"
                  style={{ background: '#3A8DDE' }}>
                  {isSubmitting ? 'Submitting…' : <><Target className="w-4 h-4" /> Submit Request</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 h-10 text-sm transition-colors"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#8A97A3' }}>Loading…</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={CARD} className="p-14 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
              <Target className="w-7 h-7" style={{ color: '#cbd5e1' }} />
            </div>
            <p className="font-medium mb-1.5" style={{ color: '#334155' }}>No lead gen requests yet</p>
            <p className="text-sm mb-5" style={{ color: '#8A97A3' }}>Submit your first request to start building your pipeline</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 text-white rounded-xl h-9 px-4 text-sm font-semibold transition-colors" style={{ background: '#3A8DDE' }}>
              <Plus className="w-3.5 h-3.5" /> New Request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const sc = STATUS_CONFIG[req.status];
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === req._id;
              return (
                <div key={req._id}
                  style={{ ...CARD, border: req.status === 'approved' ? '1px solid #a7f3d0' : '1px solid #DDE5EC' }}
                  className="overflow-hidden transition-all">
                  {req.status === 'approved' && <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-200 to-transparent" />}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={sc.badgeStyle}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                      {req.budget && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg" style={{ color: '#5F6B76', background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                          <DollarSign className="w-3 h-3" /> {req.budget}
                        </span>
                      )}
                      {req.timeline && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg" style={{ color: '#5F6B76', background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                          <Calendar className="w-3 h-3" /> {req.timeline}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`} style={{ color: '#334155' }}>{req.details}</p>
                    {req.details.length > 120 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : req._id!)} className="flex items-center gap-1 text-xs mt-1.5 transition-colors" style={{ color: '#3A8DDE' }}>
                        {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                      </button>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <p className="text-xs" style={{ color: '#8A97A3' }}>Submitted {new Date(req.createdAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      {req.status === 'pending' && <p className="text-xs flex items-center gap-1" style={{ color: '#f59e0b' }}><Clock className="w-3 h-3" /> Awaiting review</p>}
                      {req.status === 'approved' && <p className="text-xs flex items-center gap-1" style={{ color: '#6BCF7A' }}><CheckCircle2 className="w-3 h-3" /> Our team will be in touch</p>}
                    </div>

                    {req.adminFeedback && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <p className="text-xs flex items-start gap-1.5" style={{ color: '#5F6B76' }}>
                          <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Team note: <span className="ml-1" style={{ color: '#334155' }}>{req.adminFeedback}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

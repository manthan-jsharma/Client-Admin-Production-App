'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadGenRequest } from '@/lib/types';
import {
  Target, Plus, X, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, DollarSign, Calendar, FileText,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Submitted',    badge: 'bg-amber-500/15 text-amber-400',    icon: Clock },
  approved: { label: 'Approved',     badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Not Eligible', badge: 'bg-slate-600/50 text-slate-400',    icon: X },
};

const BUDGET_OPTIONS = [
  'Under $1,000', '$1,000 – $5,000', '$5,000 – $10,000',
  '$10,000 – $25,000', '$25,000 – $50,000', '$50,000+',
];

const TIMELINE_OPTIONS = [
  'ASAP / Urgent', '1–2 weeks', '1 month', '2–3 months', '3–6 months', 'Flexible',
];

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

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.details.trim() || form.details.trim().length < 30) {
      errs.details = 'Please describe your requirements in at least 30 characters';
    }
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
      const res = await fetch('/api/lead-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setRequests(prev => [result.data, ...prev]);
        setForm({ details: '', budget: '', timeline: '' });
        setShowForm(false);
        notify('success', 'Lead generation request submitted! Our team will review it shortly.');
      } else {
        notify('error', result.error || 'Failed to submit request');
      }
    } catch { notify('error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Lead Generation</h1>
            <p className="text-sm text-slate-500 mt-1">Submit lead generation requests — our team will qualify and action them</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
              showForm
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Request</>}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Info card */}
        <Card className="bg-gradient-to-br from-violet-600/10 via-blue-600/5 to-slate-800/60 border-violet-500/20 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Grow your pipeline</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tell us about your target audience, budget, and timeline. Our team reviews every request and
                reaches out to discuss the best strategy. You can track the status of each submission here.
              </p>
            </div>
          </div>
        </Card>

        {/* Submit form */}
        {showForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-sm font-semibold text-white">New Lead Generation Request</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Details */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Requirements & Target Audience <span className="text-red-400">*</span>
                  <span className="text-slate-600 font-normal ml-2">({form.details.length}/1000)</span>
                </label>
                <textarea
                  value={form.details}
                  onChange={e => { setForm(f => ({ ...f, details: e.target.value.slice(0, 1000) })); setErrors(er => ({ ...er, details: '' })); }}
                  placeholder="Describe your ideal leads: industry, company size, geography, pain points, decision-maker titles, etc."
                  rows={5}
                  className={`w-full px-4 py-3 bg-slate-700/80 border text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none leading-relaxed ${errors.details ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                />
                {errors.details && <p className="text-xs text-red-400">{errors.details}</p>}
              </div>

              {/* Budget + Timeline row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Budget Range <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BUDGET_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, budget: opt })); setErrors(e => ({ ...e, budget: '' })); }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          form.budget === opt
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.budget && <p className="text-xs text-red-400">{errors.budget}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Timeline <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIMELINE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setForm(f => ({ ...f, timeline: opt })); setErrors(e => ({ ...e, timeline: '' })); }}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                          form.timeline === opt
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-slate-700/60 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {errors.timeline && <p className="text-xs text-red-400">{errors.timeline}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20 disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : <><Target className="w-4 h-4" /> Submit Request</>}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-5 h-10">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Requests list */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-7 h-7 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No lead gen requests yet</p>
            <p className="text-slate-600 text-sm mb-4">Submit your first request to start building your pipeline</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm mx-auto flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> New Request
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map(req => {
              const sc = STATUS_CONFIG[req.status];
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === req._id;
              return (
                <Card key={req._id} className={`border transition-all ${req.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                          {req.budget && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded-md">
                              <DollarSign className="w-3 h-3" /> {req.budget}
                            </span>
                          )}
                          {req.timeline && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-700/40 px-2 py-0.5 rounded-md">
                              <Calendar className="w-3 h-3" /> {req.timeline}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {req.details}
                        </p>
                        {req.details.length > 120 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : req._id!)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
                          >
                            {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/40">
                      <p className="text-xs text-slate-600">
                        Submitted {new Date(req.createdAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {req.status === 'pending' && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting review
                        </p>
                      )}
                      {req.status === 'approved' && (
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Our team will be in touch
                        </p>
                      )}
                    </div>

                    {req.adminFeedback && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 flex items-start gap-1.5">
                          <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Admin note: <span className="text-slate-400 ml-1">{req.adminFeedback}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

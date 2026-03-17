'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Testimonial } from '@/lib/types';
import {
  Star, CheckCircle2, Clock, XCircle, AlertCircle,
  ThumbsUp, ThumbsDown, Filter, MessageSquare,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Under Review', badge: 'bg-amber-500/15 text-amber-400',    icon: Clock },
  approved: { label: 'Published',    badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected',     badge: 'bg-red-500/15 text-red-400',         icon: XCircle },
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </div>
  );
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionState, setActionState] = useState<Record<string, { isLoading: boolean; feedback: string; showFeedback: boolean }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchTestimonials(); }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setTestimonials(result.data);
    } catch { notify('error', 'Failed to load testimonials'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getState = (id: string) =>
    actionState[id] ?? { isLoading: false, feedback: '', showFeedback: false };

  const setState = (id: string, patch: Partial<typeof actionState[string]>) =>
    setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const st = getState(id);
    setState(id, { isLoading: true });
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminFeedback: st.feedback.trim() || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        setTestimonials(prev => prev.map(t => t._id === id ? result.data : t));
        setState(id, { isLoading: false, feedback: '', showFeedback: false });
        notify('success', `Testimonial ${status === 'approved' ? 'published' : 'rejected'} successfully.`);
      } else {
        notify('error', result.error || 'Action failed');
        setState(id, { isLoading: false });
      }
    } catch {
      notify('error', 'Network error');
      setState(id, { isLoading: false });
    }
  };

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.status === filter);
  const counts = {
    all: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    rejected: testimonials.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Testimonials</h1>
            <p className="text-sm text-slate-500 mt-1">Review and publish client testimonials</p>
          </div>
          {counts.pending > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-400 px-3 py-1.5 rounded-full font-semibold border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" /> {counts.pending} awaiting review
            </span>
          )}
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

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f ? 'bg-slate-600 text-slate-300' : 'bg-slate-700/50 text-slate-600'
              }`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-7 h-7 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {filter === 'all' ? 'No testimonials yet' : `No ${filter} testimonials`}
            </p>
            <p className="text-slate-600 text-sm">Testimonials submitted by clients will appear here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(t => {
              const sc = STATUS_CONFIG[t.status];
              const StatusIcon = sc.icon;
              const st = getState(t._id!);

              return (
                <Card key={t._id} className={`border transition-all ${t.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' : t.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {t.clientName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{t.clientName || 'Client'}</p>
                          <StarRating value={t.rating} />
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    {/* Testimonial text */}
                    <blockquote className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-600 pl-4 mb-4">
                      "{t.testimonialText}"
                    </blockquote>

                    <p className="text-xs text-slate-600 mb-4">
                      Submitted {new Date(t.createdAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>

                    {/* Existing admin feedback */}
                    {t.adminFeedback && (
                      <div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-500">Your note: <span className="text-slate-400">{t.adminFeedback}</span></p>
                      </div>
                    )}

                    {/* Actions (only for pending) */}
                    {t.status === 'pending' && (
                      <div className="space-y-3 pt-3 border-t border-slate-700/50">
                        {st.showFeedback && (
                          <div>
                            <label className="text-xs font-medium text-slate-400 block mb-1.5">
                              Optional note to client
                            </label>
                            <textarea
                              value={st.feedback}
                              onChange={e => setState(t._id!, { feedback: e.target.value })}
                              placeholder="Add a note for the client (optional)"
                              rows={2}
                              className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs resize-none"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleAction(t._id!, 'approved')}
                            disabled={st.isLoading}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg h-8 px-4 disabled:opacity-60"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Publish
                          </Button>
                          <Button
                            onClick={() => handleAction(t._id!, 'rejected')}
                            disabled={st.isLoading}
                            className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg h-8 px-4 disabled:opacity-60"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </Button>
                          <button
                            onClick={() => setState(t._id!, { showFeedback: !st.showFeedback })}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-1"
                          >
                            {st.showFeedback ? 'Hide note' : '+ Add note'}
                          </button>
                          {st.isLoading && <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin ml-2" />}
                        </div>
                      </div>
                    )}

                    {/* Re-review actions for already-decided */}
                    {t.status !== 'pending' && (
                      <div className="pt-3 border-t border-slate-700/40 flex items-center gap-2">
                        {t.status === 'rejected' && (
                          <Button
                            onClick={() => handleAction(t._id!, 'approved')}
                            disabled={getState(t._id!).isLoading}
                            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg h-7 px-3 disabled:opacity-60"
                          >
                            <ThumbsUp className="w-3 h-3" /> Publish instead
                          </Button>
                        )}
                        {t.status === 'approved' && (
                          <Button
                            onClick={() => handleAction(t._id!, 'rejected')}
                            disabled={getState(t._id!).isLoading}
                            className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 border border-slate-600/50 text-xs font-semibold rounded-lg h-7 px-3 disabled:opacity-60"
                          >
                            <XCircle className="w-3 h-3" /> Unpublish
                          </Button>
                        )}
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

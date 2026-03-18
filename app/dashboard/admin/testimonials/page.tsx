'use client';

import React, { useState, useEffect } from 'react';
import { Testimonial } from '@/lib/types';
import {
  Star, CheckCircle2, Clock, XCircle, AlertCircle,
  ThumbsUp, ThumbsDown, Filter, MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const STATUS_CONFIG = {
  pending:  { label: 'Under Review', pillClass: 'pill-pending',  icon: Clock },
  approved: { label: 'Published',    pillClass: 'pill-active',   icon: CheckCircle2 },
  rejected: { label: 'Rejected',     pillClass: 'pill-rejected', icon: XCircle },
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= value ? 'fill-amber-400 text-amber-400' : ''}`} style={n > value ? { color: '#DDE5EC' } : {}} />
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

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 4000); };
  const getState = (id: string) => actionState[id] ?? { isLoading: false, feedback: '', showFeedback: false };
  const setState = (id: string, patch: Partial<typeof actionState[string]>) => setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

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
      } else { notify('error', result.error || 'Action failed'); setState(id, { isLoading: false }); }
    } catch { notify('error', 'Network error'); setState(id, { isLoading: false }); }
  };

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.status === filter);
  const counts = {
    all: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    rejected: testimonials.filter(t => t.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Testimonials"
        subtitle="Review and publish client testimonials"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Testimonials' }]}
        heroStrip={true}
        actions={counts.pending > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#f59e0b' }}>
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold">{counts.pending} awaiting review</span>
          </div>
        ) : undefined}
      />

      <div className="p-8 space-y-5">
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium"
            style={notification.type === 'success'
              ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
          <Filter className="w-3.5 h-3.5 ml-2 mr-1 flex-shrink-0" style={{ color: '#8A97A3' }} />
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === f
                ? { background: '#3A8DDE', color: '#ffffff' }
                : { color: '#5F6B76' }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={filter === f
                  ? { background: 'rgba(255,255,255,0.25)', color: '#ffffff' }
                  : { background: '#DDE5EC', color: '#5F6B76' }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total',     value: counts.all,      accentFrom: '#5F6B76', valueColor: '#1E2A32' },
            { label: 'Pending',   value: counts.pending,  accentFrom: '#f59e0b', valueColor: '#f59e0b' },
            { label: 'Published', value: counts.approved, accentFrom: '#10b981', valueColor: '#10b981' },
            { label: 'Rejected',  value: counts.rejected, accentFrom: '#ef4444', valueColor: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={CARD} className="relative p-4 overflow-hidden">
              <div className="h-[3px] absolute top-0 inset-x-0 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${s.accentFrom}, transparent)` }} />
              <p className="text-xs mb-1.5 font-medium" style={{ color: '#5F6B76' }}>{s.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: s.valueColor }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#8A97A3' }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="generic"
            title="No testimonials yet"
            description={filter === 'all' ? 'Testimonials submitted by clients will appear here' : `No ${filter} testimonials at the moment`}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(t => {
              const sc = STATUS_CONFIG[t.status];
              const StatusIcon = sc.icon;
              const st = getState(t._id!);
              return (
                <div key={t._id} style={{ ...CARD, border: t.status === 'approved' ? '1px solid #a7f3d0' : t.status === 'rejected' ? '1px solid #fecaca' : '1px solid rgba(255,255,255,0.55)' }} className="overflow-hidden transition-all">
                  {t.status === 'approved' && <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-200 to-transparent" />}
                  {t.status === 'pending' && <div className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-200 to-transparent" />}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {t.clientName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{t.clientName || 'Client'}</p>
                          <StarRating value={t.rating} />
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.pillClass}`}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                    </div>

                    <blockquote className="text-sm leading-relaxed italic pl-4 mb-3" style={{ color: '#334155', borderLeft: '2px solid #c8dff0' }}>
                      &quot;{t.testimonialText}&quot;
                    </blockquote>
                    <p className="text-xs mb-4" style={{ color: '#8A97A3' }}>Submitted {new Date(t.createdAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                    {t.adminFeedback && (
                      <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                        <p className="text-xs" style={{ color: '#5F6B76' }}>Your note: <span style={{ color: '#334155' }}>{t.adminFeedback}</span></p>
                      </div>
                    )}

                    {t.status === 'pending' && (
                      <div className="space-y-3 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                        {st.showFeedback && (
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: '#5F6B76' }}>Optional note to client</label>
                            <textarea value={st.feedback} onChange={e => setState(t._id!, { feedback: e.target.value })} placeholder="Add a note for the client (optional)" rows={2}
                              className="w-full px-4 py-3 rounded-xl text-xs resize-none transition-all focus:outline-none"
                              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }} />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAction(t._id!, 'approved')} disabled={st.isLoading}
                            className="btn-primary flex items-center gap-1.5 disabled:opacity-60 text-xs font-semibold rounded-xl h-9 px-4">
                            <ThumbsUp className="w-3.5 h-3.5" /> Publish
                          </button>
                          <button onClick={() => handleAction(t._id!, 'rejected')} disabled={st.isLoading}
                            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl h-9 px-4 transition-colors"
                            style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button onClick={() => setState(t._id!, { showFeedback: !st.showFeedback })} className="text-xs ml-1 transition-colors" style={{ color: '#5F6B76' }}>
                            {st.showFeedback ? 'Hide note' : '+ Add note'}
                          </button>
                          {st.isLoading && <div className="w-4 h-4 border-2 rounded-full animate-spin ml-2" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />}
                        </div>
                      </div>
                    )}

                    {t.status !== 'pending' && (
                      <div className="pt-4 flex items-center gap-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                        {t.status === 'rejected' && (
                          <button onClick={() => handleAction(t._id!, 'approved')} disabled={getState(t._id!).isLoading}
                            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl h-7 px-3 transition-colors"
                            style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>
                            <ThumbsUp className="w-3 h-3" /> Publish instead
                          </button>
                        )}
                        {t.status === 'approved' && (
                          <button onClick={() => handleAction(t._id!, 'rejected')} disabled={getState(t._id!).isLoading}
                            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl h-7 px-3 transition-colors"
                            style={{ background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}>
                            <XCircle className="w-3 h-3" /> Unpublish
                          </button>
                        )}
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

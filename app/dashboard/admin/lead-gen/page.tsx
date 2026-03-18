'use client';

import React, { useState, useEffect } from 'react';
import { LeadGenRequest } from '@/lib/types';
import {
  Target, CheckCircle2, Clock, XCircle, AlertCircle,
  ThumbsUp, ThumbsDown, Filter, DollarSign, Calendar, FileText,
  ChevronDown, ChevronUp,
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
  pending:  { label: 'Pending',   pillClass: 'pill-pending',  icon: Clock },
  approved: { label: 'Approved',  pillClass: 'pill-active',   icon: CheckCircle2 },
  rejected: { label: 'Rejected',  pillClass: 'pill-rejected', icon: XCircle },
};

export default function AdminLeadGenPage() {
  const [requests, setRequests] = useState<LeadGenRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, { isLoading: boolean; feedback: string; showFeedback: boolean }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/lead-gen', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setRequests(result.data);
    } catch { notify('error', 'Failed to load requests'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 4000); };
  const getState = (id: string) => actionState[id] ?? { isLoading: false, feedback: '', showFeedback: false };
  const setStateFor = (id: string, patch: Partial<typeof actionState[string]>) => setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const st = getState(id);
    setStateFor(id, { isLoading: true });
    try {
      const res = await fetch(`/api/admin/lead-gen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminFeedback: st.feedback.trim() || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        setRequests(prev => prev.map(r => r._id === id ? result.data : r));
        setStateFor(id, { isLoading: false, feedback: '', showFeedback: false });
        notify('success', `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
      } else { notify('error', result.error || 'Action failed'); setStateFor(id, { isLoading: false }); }
    } catch { notify('error', 'Network error'); setStateFor(id, { isLoading: false }); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Lead Generation"
        subtitle="Review and action client lead generation requests"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Lead Generation' }]}
        heroStrip={true}
        actions={counts.pending > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#f59e0b' }}>
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold">{counts.pending} pending review</span>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Requests', value: counts.all,      accentFrom: '#5F6B76', valueColor: '#1E2A32' },
            { label: 'Pending Review', value: counts.pending,  accentFrom: '#f59e0b', valueColor: '#f59e0b' },
            { label: 'Approved',       value: counts.approved, accentFrom: '#10b981', valueColor: '#10b981' },
          ].map(s => (
            <div key={s.label} style={CARD} className="relative p-4 overflow-hidden">
              <div className="h-[3px] absolute top-0 inset-x-0 rounded-t-2xl" style={{ background: `linear-gradient(to right, ${s.accentFrom}, transparent)` }} />
              <p className="text-xs mb-1.5 font-medium" style={{ color: '#5F6B76' }}>{s.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: s.valueColor }}>{s.value}</p>
            </div>
          ))}
        </div>

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

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#8A97A3' }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="generic"
            title="No lead gen requests yet"
            description={filter === 'all' ? 'Client requests will appear here for review' : `No ${filter} requests at the moment`}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(req => {
              const sc = STATUS_CONFIG[req.status];
              const StatusIcon = sc.icon;
              const st = getState(req._id!);
              const isExpanded = expandedId === req._id;
              return (
                <div key={req._id}
                  style={{ ...CARD, border: req.status === 'approved' ? '1px solid #a7f3d0' : req.status === 'rejected' ? '1px solid #fecaca' : '1px solid rgba(255,255,255,0.55)' }}
                  className="overflow-hidden transition-all">
                  {req.status === 'approved' && <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-200 to-transparent" />}
                  {req.status === 'pending' && <div className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-200 to-transparent" />}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {req.clientName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{req.clientName || 'Client'}</p>
                          <p className="text-[11px]" style={{ color: '#8A97A3' }}>{new Date(req.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {req.budget && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg" style={{ color: '#5F6B76', background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                            <DollarSign className="w-3 h-3" /> {req.budget}
                          </span>
                        )}
                        {req.timeline && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg" style={{ color: '#5F6B76', background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                            <Calendar className="w-3 h-3" /> {req.timeline}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${sc.pillClass}`}>
                          <StatusIcon className="w-3 h-3" />{sc.label}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`} style={{ color: '#334155' }}>{req.details}</p>
                      {req.details.length > 150 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : req._id!)} className="flex items-center gap-1 text-xs mt-1.5 transition-colors" style={{ color: '#3A8DDE' }}>
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}
                    </div>

                    {req.adminFeedback && (
                      <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                        <p className="text-xs flex items-start gap-1.5" style={{ color: '#5F6B76' }}>
                          <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Your note: <span className="ml-1" style={{ color: '#334155' }}>{req.adminFeedback}</span>
                        </p>
                      </div>
                    )}

                    <div className="pt-4 space-y-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                      {st.showFeedback && (
                        <div>
                          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: '#5F6B76' }}>Note to client (optional)</label>
                          <textarea value={st.feedback} onChange={e => setStateFor(req._id!, { feedback: e.target.value })}
                            placeholder="Next steps, timeline, or any context for the client…" rows={2}
                            className="w-full px-4 py-3 rounded-xl text-xs resize-none transition-all focus:outline-none"
                            style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.status !== 'approved' && (
                          <button onClick={() => handleAction(req._id!, 'approved')} disabled={st.isLoading}
                            className="btn-primary flex items-center gap-1.5 disabled:opacity-60 text-xs font-semibold rounded-xl h-9 px-4">
                            <ThumbsUp className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {req.status !== 'rejected' && (
                          <button onClick={() => handleAction(req._id!, 'rejected')} disabled={st.isLoading}
                            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl h-9 px-4 transition-colors"
                            style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                        <button onClick={() => setStateFor(req._id!, { showFeedback: !st.showFeedback })} className="text-xs transition-colors" style={{ color: '#5F6B76' }}>
                          {st.showFeedback ? 'Hide note' : '+ Add note'}
                        </button>
                        {st.isLoading && <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />}
                      </div>
                    </div>
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

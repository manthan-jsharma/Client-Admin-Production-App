'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadGenRequest } from '@/lib/types';
import {
  Target, CheckCircle2, Clock, XCircle, AlertCircle,
  ThumbsUp, ThumbsDown, Filter, DollarSign, Calendar, FileText,
  ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',   badge: 'bg-amber-500/15 text-amber-400',    icon: Clock },
  approved: { label: 'Approved',  badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected',  badge: 'bg-red-500/15 text-red-400',         icon: XCircle },
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

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getState = (id: string) =>
    actionState[id] ?? { isLoading: false, feedback: '', showFeedback: false };

  const setStateFor = (id: string, patch: Partial<typeof actionState[string]>) =>
    setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

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
      } else {
        notify('error', result.error || 'Action failed');
        setStateFor(id, { isLoading: false });
      }
    } catch {
      notify('error', 'Network error');
      setStateFor(id, { isLoading: false });
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Lead Generation</h1>
            <p className="text-sm text-slate-500 mt-1">Review and action client lead generation requests</p>
          </div>
          {counts.pending > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-400 px-3 py-1.5 rounded-full font-semibold border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" /> {counts.pending} pending review
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Requests', value: counts.all, color: 'text-white' },
            { label: 'Pending Review', value: counts.pending, color: 'text-amber-400' },
            { label: 'Approved', value: counts.approved, color: 'text-emerald-400' },
          ].map(s => (
            <Card key={s.label} className="bg-slate-800/60 border-slate-700/50 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
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
              <Target className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {filter === 'all' ? 'No lead gen requests yet' : `No ${filter} requests`}
            </p>
            <p className="text-slate-600 text-sm">Client requests will appear here for review</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => {
              const sc = STATUS_CONFIG[req.status];
              const StatusIcon = sc.icon;
              const st = getState(req._id!);
              const isExpanded = expandedId === req._id;

              return (
                <Card key={req._id} className={`border transition-all ${req.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' : req.status === 'rejected' ? 'bg-red-500/5 border-red-500/10' : 'bg-slate-800/60 border-slate-700/50'}`}>
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {req.clientName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{req.clientName || 'Client'}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(req.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {req.budget && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50">
                            <DollarSign className="w-3 h-3" /> {req.budget}
                          </span>
                        )}
                        {req.timeline && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-700/60 px-2.5 py-1 rounded-lg border border-slate-600/50">
                            <Calendar className="w-3 h-3" /> {req.timeline}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold ${sc.badge}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mb-4">
                      <p className={`text-sm text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {req.details}
                      </p>
                      {req.details.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req._id!)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
                        >
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}
                    </div>

                    {/* Existing admin feedback */}
                    {req.adminFeedback && (
                      <div className="mb-4 p-3 bg-slate-700/30 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-500 flex items-start gap-1.5">
                          <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Your note: <span className="text-slate-400 ml-1">{req.adminFeedback}</span>
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-700/40 space-y-3">
                      {st.showFeedback && (
                        <div>
                          <label className="text-xs font-medium text-slate-400 block mb-1.5">
                            Note to client (optional)
                          </label>
                          <textarea
                            value={st.feedback}
                            onChange={e => setStateFor(req._id!, { feedback: e.target.value })}
                            placeholder="Next steps, timeline, or any context for the client…"
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-700/80 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs resize-none"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.status !== 'approved' && (
                          <Button
                            onClick={() => handleAction(req._id!, 'approved')}
                            disabled={st.isLoading}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg h-8 px-4 disabled:opacity-60"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Approve
                          </Button>
                        )}
                        {req.status !== 'rejected' && (
                          <Button
                            onClick={() => handleAction(req._id!, 'rejected')}
                            disabled={st.isLoading}
                            className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold rounded-lg h-8 px-4 disabled:opacity-60"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </Button>
                        )}
                        <button
                          onClick={() => setStateFor(req._id!, { showFeedback: !st.showFeedback })}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {st.showFeedback ? 'Hide note' : '+ Add note'}
                        </button>
                        {st.isLoading && <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />}
                      </div>
                    </div>
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

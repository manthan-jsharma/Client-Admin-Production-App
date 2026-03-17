'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaintenanceFeedback } from '@/lib/types';
import {
  Wrench, CheckCircle2, Clock, AlertCircle, Filter,
  MessageSquare, Zap, ChevronDown, ChevronUp, Send,
  User,
} from 'lucide-react';

const STATUS_CONFIG = {
  new:      { label: 'New',      badge: 'bg-blue-500/15 text-blue-400',       icon: Zap,          dot: 'bg-blue-400' },
  open:     { label: 'Open',     badge: 'bg-amber-500/15 text-amber-400',     icon: Clock,        dot: 'bg-amber-400' },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2, dot: 'bg-emerald-400' },
};

const STATUS_OPTIONS = ['new', 'open', 'resolved'] as const;

export default function AdminMaintenancePage() {
  const [items, setItems] = useState<MaintenanceFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'open' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Per-item action state
  const [actionState, setActionState] = useState<Record<string, {
    isLoading: boolean;
    response: string;
    status: 'new' | 'open' | 'resolved';
    isDirty: boolean;
  }>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/maintenance', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
        // Initialize action state
        const init: typeof actionState = {};
        for (const item of result.data as MaintenanceFeedback[]) {
          init[item._id!] = {
            isLoading: false,
            response: item.adminResponse || '',
            status: item.status,
            isDirty: false,
          };
        }
        setActionState(init);
      }
    } catch { notify('error', 'Failed to load submissions'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getState = (id: string) =>
    actionState[id] ?? { isLoading: false, response: '', status: 'new' as const, isDirty: false };

  const patchState = (id: string, patch: Partial<typeof actionState[string]>) =>
    setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const handleSave = async (id: string) => {
    const st = getState(id);
    patchState(id, { isLoading: true });
    try {
      const res = await fetch(`/api/admin/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: st.status,
          adminResponse: st.response.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setItems(prev => prev.map(i => i._id === id ? result.data : i));
        patchState(id, { isLoading: false, isDirty: false });
        notify('success', 'Submission updated successfully.');
      } else {
        notify('error', result.error || 'Update failed');
        patchState(id, { isLoading: false });
      }
    } catch {
      notify('error', 'Network error');
      patchState(id, { isLoading: false });
    }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const counts = {
    all: items.length,
    new: items.filter(i => i.status === 'new').length,
    open: items.filter(i => i.status === 'open').length,
    resolved: items.filter(i => i.status === 'resolved').length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Maintenance Inbox</h1>
            <p className="text-sm text-slate-500 mt-1">Client feedback and issue reports — respond and update status</p>
          </div>
          {counts.new > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-blue-500/15 text-blue-400 px-3 py-1.5 rounded-full font-semibold border border-blue-500/20">
              <Zap className="w-3.5 h-3.5" /> {counts.new} new
            </span>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: counts.all, color: 'text-white' },
            { label: 'New', value: counts.new, color: 'text-blue-400' },
            { label: 'Open', value: counts.open, color: 'text-amber-400' },
            { label: 'Resolved', value: counts.resolved, color: 'text-emerald-400' },
          ].map(s => (
            <Card key={s.label} className="bg-slate-800/60 border-slate-700/50 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
          {(['all', 'new', 'open', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : (
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[f].dot}`} />
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </span>
              )}
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
              {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
            </p>
            <p className="text-slate-600 text-sm">Client feedback will appear here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => {
              const sc = STATUS_CONFIG[item.status];
              const StatusIcon = sc.icon;
              const st = getState(item._id!);
              const isExpanded = expandedId === item._id;

              return (
                <Card key={item._id} className={`border transition-all ${
                  item.status === 'new' ? 'bg-blue-500/5 border-blue-500/20' :
                  item.status === 'resolved' ? 'bg-emerald-500/5 border-emerald-500/15' :
                  'bg-slate-800/60 border-slate-700/50'
                }`}>
                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-600">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.clientName || 'Client'}</p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(item.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    {/* Message */}
                    <div className="mb-4 pl-12">
                      <p className={`text-sm text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`}>
                        {item.message}
                      </p>
                      {item.message.length > 200 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item._id!)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
                        >
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}

                      {/* Existing response preview */}
                      {item.adminResponse && !isExpanded && (
                        <div className="mt-3 p-3 bg-slate-700/40 rounded-lg border border-slate-700/50">
                          <p className="text-[11px] font-semibold text-slate-400 mb-1">Your response</p>
                          <p className="text-xs text-slate-400 line-clamp-2">{item.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    {/* Response form */}
                    <div className="pl-12 pt-4 border-t border-slate-700/40 space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</label>
                        <div className="flex gap-1.5">
                          {STATUS_OPTIONS.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                onClick={() => patchState(item._id!, { status: s, isDirty: true })}
                                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                                  st.status === s
                                    ? `${cfg.badge} border-current`
                                    : 'bg-slate-700/40 border-slate-600/50 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                          Response to client
                        </label>
                        <textarea
                          value={st.response}
                          onChange={e => patchState(item._id!, { response: e.target.value, isDirty: true })}
                          placeholder="Type your response here — the client will be notified by email…"
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none leading-relaxed focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleSave(item._id!)}
                          disabled={st.isLoading || !st.isDirty}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg h-8 px-4 disabled:opacity-50"
                        >
                          {st.isLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          {st.response.trim() ? 'Send & Save' : 'Update Status'}
                        </Button>
                        {!st.isDirty && item.adminResponse && (
                          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Saved
                          </span>
                        )}
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

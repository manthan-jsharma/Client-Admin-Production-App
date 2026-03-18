'use client';

import React, { useState, useEffect } from 'react';
import { MaintenanceFeedback } from '@/lib/types';
import {
  Wrench, CheckCircle2, Clock, AlertCircle, Filter,
  MessageSquare, Zap, ChevronDown, ChevronUp, Send, User,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: 16,
};

const STATUS_CONFIG = {
  new:      { label: 'New',      color: '#3A8DDE', bg: '#eff8ff', border: '#c8dff0', dot: '#3A8DDE', icon: Zap },
  open:     { label: 'Open',     color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', icon: Clock },
  resolved: { label: 'Resolved', color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0', dot: '#6BCF7A', icon: CheckCircle2 },
};

const STATUS_OPTIONS = ['new', 'open', 'resolved'] as const;

export default function AdminMaintenancePage() {
  const [items, setItems] = useState<MaintenanceFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'open' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionState, setActionState] = useState<Record<string, { isLoading: boolean; response: string; status: 'new' | 'open' | 'resolved'; isDirty: boolean }>>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/maintenance', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setItems(result.data);
        const init: typeof actionState = {};
        for (const item of result.data as MaintenanceFeedback[]) {
          init[item._id!] = { isLoading: false, response: item.adminResponse || '', status: item.status, isDirty: false };
        }
        setActionState(init);
      }
    } catch { notify('error', 'Failed to load submissions'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 4000); };
  const getState = (id: string) => actionState[id] ?? { isLoading: false, response: '', status: 'new' as const, isDirty: false };
  const patchState = (id: string, patch: Partial<typeof actionState[string]>) => setActionState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const handleSave = async (id: string) => {
    const st = getState(id);
    patchState(id, { isLoading: true });
    try {
      const res = await fetch(`/api/admin/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: st.status, adminResponse: st.response.trim() || undefined }),
      });
      const result = await res.json();
      if (result.success) { setItems(prev => prev.map(i => i._id === id ? result.data : i)); patchState(id, { isLoading: false, isDirty: false }); notify('success', 'Submission updated.'); }
      else { notify('error', result.error || 'Update failed'); patchState(id, { isLoading: false }); }
    } catch { notify('error', 'Network error'); patchState(id, { isLoading: false }); }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const counts = { all: items.length, new: items.filter(i => i.status === 'new').length, open: items.filter(i => i.status === 'open').length, resolved: items.filter(i => i.status === 'resolved').length };

  return (
    <div className="min-h-screen animate-fade-up" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Maintenance Inbox"
        subtitle="Client feedback and issue reports"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Maintenance' }]}
        heroStrip
        actions={counts.new > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: '#3A8DDE' }} />
            <span className="text-sm font-semibold" style={{ color: '#3A8DDE' }}>{counts.new} new</span>
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
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total',    value: counts.all,      color: '#1E2A32',  accentColor: '#8A97A3' },
            { label: 'New',      value: counts.new,      color: '#3A8DDE',  accentColor: '#3A8DDE' },
            { label: 'Open',     value: counts.open,     color: '#f59e0b',  accentColor: '#f59e0b' },
            { label: 'Resolved', value: counts.resolved, color: '#10b981',  accentColor: '#10b981' },
          ].map(s => (
            <div key={s.label} className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5" style={CARD}>
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${s.accentColor}, ${s.accentColor}88)` }} />
              <div className="p-4">
                <p className="text-xs mb-1.5 font-medium" style={{ color: '#8A97A3' }}>{s.label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
          <Filter className="w-3.5 h-3.5 ml-2 mr-1 flex-shrink-0" style={{ color: '#8A97A3' }} />
          {(['all', 'new', 'open', 'resolved'] as const).map(f => {
            const cfg = f !== 'all' ? STATUS_CONFIG[f] : null;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={filter === f
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#8A97A3' }}
              >
                {f === 'all' ? 'All' : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg?.dot }} />
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </>
                )}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={filter === f
                    ? { background: '#f1f5f9', color: '#5F6B76' }
                    : { background: '#f1f5f9', color: '#8A97A3' }}
                >{counts[f]}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState variant="messages" title="No submissions yet" description="Client maintenance feedback and issue reports will appear here." />
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const sc = STATUS_CONFIG[item.status];
              const StatusIcon = sc.icon;
              const st = getState(item._id!);
              const isExpanded = expandedId === item._id;

              // pill class
              const pillClass = item.status === 'resolved' ? 'pill-info' : item.status === 'open' ? 'pill-pending' : 'pill-active';

              return (
                <div
                  key={item._id}
                  className="overflow-hidden transition-all"
                  style={{
                    ...CARD,
                    borderColor: item.status === 'new' ? '#c8dff0' : item.status === 'resolved' ? '#a7f3d0' : '#DDE5EC',
                  }}
                >
                  {item.status === 'new' && <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }} />}
                  {item.status === 'resolved' && <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />}

                  <div className="p-6">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                          <User className="w-4 h-4" style={{ color: '#8A97A3' }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{item.clientName || 'Client'}</p>
                          <p className="text-[11px]" style={{ color: '#8A97A3' }}>
                            {new Date(item.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`${pillClass} flex items-center gap-1.5 flex-shrink-0`}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                    </div>

                    {/* Message */}
                    <div className="mb-4 pl-12">
                      <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`} style={{ color: '#334155' }}>{item.message}</p>
                      {item.message.length > 200 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : item._id!)} className="flex items-center gap-1 text-xs mt-1.5 transition-colors" style={{ color: '#3A8DDE' }}>
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}

                      {item.adminResponse && !isExpanded && (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                          <p className="text-[11px] font-semibold mb-1" style={{ color: '#8A97A3' }}>Your response</p>
                          <p className="text-xs line-clamp-2" style={{ color: '#5F6B76' }}>{item.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    {/* Response form */}
                    <div className="pl-12 pt-4 space-y-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</label>
                        <div className="flex gap-1.5">
                          {STATUS_OPTIONS.map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                onClick={() => patchState(item._id!, { status: s, isDirty: true })}
                                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all"
                                style={st.status === s
                                  ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }
                                  : { background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC' }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: '#8A97A3' }}>Response to client</label>
                        <textarea
                          value={st.response}
                          onChange={e => patchState(item._id!, { response: e.target.value, isDirty: true })}
                          placeholder="Type your response here — the client will be notified by email…"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none leading-relaxed transition-all"
                          style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(item._id!)}
                          disabled={st.isLoading || !st.isDirty}
                          className="btn-primary flex items-center gap-2 text-xs h-9 px-4 disabled:opacity-40"
                        >
                          {st.isLoading
                            ? <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                            : <Send className="w-3.5 h-3.5" />}
                          {st.response.trim() ? 'Send & Save' : 'Update Status'}
                        </button>
                        {!st.isDirty && item.adminResponse && (
                          <span className="text-[11px] flex items-center gap-1" style={{ color: '#10b981' }}>
                            <CheckCircle2 className="w-3 h-3" /> Saved
                          </span>
                        )}
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

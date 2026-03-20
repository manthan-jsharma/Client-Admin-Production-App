'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Ticket, Project } from '@/lib/types';
import {
  LifeBuoy, Star, Wrench, FolderKanban, MessageSquare,
  CheckCircle2, Clock, RefreshCw, XCircle, ChevronDown, ChevronUp,
  AlertCircle, Plus, Send, Link2, Link2Off, ExternalLink,
} from 'lucide-react';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const STATUS_BADGE: Record<Ticket['status'], React.CSSProperties> = {
  open:        { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' },
  in_progress: { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' },
  resolved:    { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' },
  closed:      { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' },
};
const STATUS_ICON: Record<Ticket['status'], React.ComponentType<{ className?: string }>> = {
  open: Clock, in_progress: RefreshCw, resolved: CheckCircle2, closed: XCircle,
};

type Tab = 'tickets' | 'projects' | 'chat';

export default function SupportAdminPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('tickets');

  // ── Tickets ────────────────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Projects ───────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [projLoading, setProjLoading] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState<{ projectId: string; title: string; description: string; deliveryNumber: string; proofVideoUrl: string }>({ projectId: '', title: '', description: '', deliveryNumber: '', proofVideoUrl: '' });
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [addingDelivery, setAddingDelivery] = useState(false);

  // ── Telegram ───────────────────────────────────────────────────────────────
  const [tgConnected, setTgConnected] = useState(false);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDisconnecting, setTgDisconnecting] = useState(false);

  const h = useCallback(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token]);

  const notify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // Telegram status
  useEffect(() => {
    if (!token) return;
    fetch('/api/telegram/connect', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setTgConnected(d.connected); })
      .catch(() => {});
  }, [token]);

  const handleTgConnect = async () => {
    const win = window.open('', '_blank');
    setTgLoading(true); setTgDeepLink(null);
    try {
      const res = await fetch('/api/telegram/connect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.deepLink) { setTgDeepLink(data.deepLink); if (win) win.location.href = data.deepLink; } else win?.close();
    } catch { win?.close(); } finally { setTgLoading(false); }
  };

  const handleTgDisconnect = async () => {
    setTgDisconnecting(true);
    try {
      await fetch('/api/telegram/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setTgConnected(false); setTgDeepLink(null);
      notify('success', 'Telegram disconnected');
    } catch { notify('error', 'Failed to disconnect'); } finally { setTgDisconnecting(false); }
  };

  // Load tickets
  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/tickets', { headers: h() })
      .then(r => r.json())
      .then(r => { if (r.success) setTickets(r.data); })
      .finally(() => setTicketsLoading(false));
  }, [token, h]);

  // Load projects when tab switches
  useEffect(() => {
    if (tab !== 'projects' || projects.length > 0 || !token) return;
    setProjLoading(true);
    fetch('/api/projects', { headers: h() })
      .then(r => r.json())
      .then(r => { if (r.success) setProjects(r.data); })
      .finally(() => setProjLoading(false));
  }, [tab, token, h, projects.length]);

  const updateTicket = async (ticketId: string, updates: Record<string, unknown>) => {
    setSaving(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, { method: 'PATCH', headers: h(), body: JSON.stringify(updates) });
      const result = await res.json();
      if (result.success) {
        setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, ...updates } as Ticket : t));
        setReplyText(prev => ({ ...prev, [ticketId]: '' }));
        notify('success', 'Ticket updated');
      } else notify('error', result.error || 'Failed');
    } catch { notify('error', 'Network error'); }
    finally { setSaving(null); }
  };

  const addDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryForm.projectId) return;
    setAddingDelivery(true);
    try {
      const res = await fetch(`/api/projects/${deliveryForm.projectId}/deliveries`, {
        method: 'POST', headers: h(),
        body: JSON.stringify({ title: deliveryForm.title, description: deliveryForm.description, deliveryNumber: Number(deliveryForm.deliveryNumber), proofVideoUrl: deliveryForm.proofVideoUrl || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        notify('success', 'Delivery added');
        setDeliveryForm({ projectId: '', title: '', description: '', deliveryNumber: '', proofVideoUrl: '' });
        setShowDeliveryForm(false);
      } else notify('error', result.error || 'Failed');
    } catch { notify('error', 'Network error'); }
    finally { setAddingDelivery(false); }
  };

  const INPUT: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #DDE5EC', background: 'rgba(58,141,222,0.04)', fontSize: 13, color: '#1E2A32', outline: 'none', boxSizing: 'border-box' };

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'tickets',  label: 'Tickets',  icon: LifeBuoy },
    { key: 'projects', label: 'Projects & Deliveries', icon: FolderKanban },
    { key: 'chat',     label: 'Chat',     icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Support Dashboard"
        subtitle="Handle tickets, projects and client communication"
        breadcrumbs={[{ label: 'Support Admin' }]}
        heroStrip
      />

      <div className="p-6 space-y-5">
        {notification && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm font-medium"
            style={notification.type === 'success' ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' } : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit flex-wrap" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={tab === key ? { background: '#3A8DDE', color: '#fff' } : { color: '#5F6B76' }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ── TICKETS TAB ── */}
        {tab === 'tickets' && (
          ticketsLoading ? (
            <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} /></div>
          ) : tickets.length === 0 ? (
            <EmptyState variant="generic" title="No tickets yet" description="Tickets submitted by clients will appear here" />
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const isExpanded = expandedId === ticket._id;
                const Ic = STATUS_ICON[ticket.status];
                return (
                  <div key={ticket._id} style={CARD} className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{ticket.subject}</h3>
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold" style={STATUS_BADGE[ticket.status]}>
                              <Ic className="w-3 h-3" />{ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: '#8A97A3' }}>{ticket.clientName} · {new Date(ticket.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                        <button onClick={() => setExpandedId(isExpanded ? null : ticket._id!)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                          style={{ background: 'rgba(58,141,222,0.06)', color: '#3A8DDE', border: '1px solid #DDE5EC' }}>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isExpanded ? 'Collapse' : 'Respond'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm leading-relaxed" style={{ color: '#5F6B76' }}>{ticket.description}</p>
                          {ticket.adminResponse && (
                            <div className="p-3 rounded-xl text-sm" style={{ background: '#eff8ff', border: '1px solid #c8dff0', color: '#334155' }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#3A8DDE' }}>Previous Response</p>
                              {ticket.adminResponse}
                            </div>
                          )}
                          <textarea
                            value={replyText[ticket._id!] ?? ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [ticket._id!]: e.target.value }))}
                            placeholder="Write your response…"
                            rows={3}
                            className="w-full resize-none focus:outline-none text-sm rounded-xl p-3"
                            style={{ border: '1px solid #DDE5EC', background: 'rgba(58,141,222,0.03)', color: '#1E2A32' }}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            {(['open', 'in_progress', 'resolved'] as const).map(s => (
                              <button key={s} onClick={() => updateTicket(ticket._id!, { status: s })} disabled={saving === ticket._id}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                                style={ticket.status === s ? STATUS_BADGE[s] : { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}>
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                            <button
                              onClick={() => updateTicket(ticket._id!, { adminResponse: replyText[ticket._id!] || ticket.adminResponse })}
                              disabled={saving === ticket._id || !replyText[ticket._id!]?.trim()}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ml-auto disabled:opacity-50"
                              style={{ background: '#3A8DDE', color: '#fff' }}>
                              {saving === ticket._id
                                ? <div className="w-3 h-3 border rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                : <Send className="w-3 h-3" />} Send Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── PROJECTS & DELIVERIES TAB ── */}
        {tab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowDeliveryForm(p => !p)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
                style={showDeliveryForm ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' } : { background: '#3A8DDE', color: '#fff' }}>
                <Plus className="w-4 h-4" />{showDeliveryForm ? 'Cancel' : 'Add Delivery'}
              </button>
            </div>

            {showDeliveryForm && (
              <div style={CARD} className="overflow-hidden">
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(221,229,236,0.5)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Add Delivery to Project</h3>
                </div>
                <form onSubmit={addDelivery} className="p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8A97A3' }}>Project *</label>
                      <select value={deliveryForm.projectId} onChange={e => setDeliveryForm(p => ({ ...p, projectId: e.target.value }))} required style={{ ...INPUT }}>
                        <option value="">— Select project —</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8A97A3' }}>Delivery # *</label>
                      <input type="number" min="1" value={deliveryForm.deliveryNumber} onChange={e => setDeliveryForm(p => ({ ...p, deliveryNumber: e.target.value }))} required style={INPUT} placeholder="e.g. 1" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8A97A3' }}>Title *</label>
                      <input value={deliveryForm.title} onChange={e => setDeliveryForm(p => ({ ...p, title: e.target.value }))} required style={INPUT} placeholder="Delivery title" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8A97A3' }}>Description *</label>
                      <input value={deliveryForm.description} onChange={e => setDeliveryForm(p => ({ ...p, description: e.target.value }))} required style={INPUT} placeholder="Brief description" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#8A97A3' }}>Loom Video URL</label>
                      <input
                        type="url"
                        value={deliveryForm.proofVideoUrl}
                        onChange={e => setDeliveryForm(p => ({ ...p, proofVideoUrl: e.target.value }))}
                        placeholder="https://www.loom.com/share/..."
                        style={INPUT}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={addingDelivery}
                    className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50"
                    style={{ background: '#6BCF7A', color: '#fff' }}>
                    {addingDelivery ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Plus className="w-4 h-4" />}
                    Add Delivery
                  </button>
                </form>
              </div>
            )}

            {projLoading ? (
              <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} /></div>
            ) : projects.length === 0 ? (
              <EmptyState variant="generic" title="No projects" description="No projects available" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map(p => (
                  <div key={p._id} style={CARD} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                        <FolderKanban className="w-4 h-4" style={{ color: '#3A8DDE' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: '#1E2A32' }}>{p.name}</p>
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                          style={{ background: p.status === 'active' ? 'rgba(107,207,122,0.1)' : 'rgba(58,141,222,0.06)', color: p.status === 'active' ? '#6BCF7A' : '#5F6B76', border: `1px solid ${p.status === 'active' ? '#a7f3d0' : '#DDE5EC'}` }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TELEGRAM CONNECT ── */}
        <div style={CARD} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-sky-400 via-sky-200 to-transparent" />
          <div className="p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <Send className="w-4 h-4" style={{ color: '#0ea5e9' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-sm font-bold" style={{ color: '#1E2A32' }}>Telegram Notifications</h2>
                {tgConnected && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs mb-4" style={{ color: '#5F6B76' }}>Connect your Telegram to receive chat and mention notifications.</p>
              {tgConnected ? (
                <button onClick={handleTgDisconnect} disabled={tgDisconnecting}
                  className="flex items-center gap-1.5 text-xs" style={{ color: '#5F6B76' }}>
                  <Link2Off className="w-3.5 h-3.5" />
                  {tgDisconnecting ? 'Disconnecting…' : 'Disconnect Telegram'}
                </button>
              ) : !tgDeepLink ? (
                <button onClick={handleTgConnect} disabled={tgLoading}
                  className="flex items-center gap-2 text-sm font-semibold rounded-xl h-9 px-4 disabled:opacity-50"
                  style={{ background: '#3A8DDE', color: '#fff' }}>
                  <Link2 className="w-3.5 h-3.5" />
                  {tgLoading ? 'Generating link…' : 'Connect Telegram'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: '#5F6B76' }}>Telegram should have opened. If not:</p>
                  <a href={tgDeepLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl h-9 px-4"
                    style={{ background: '#3A8DDE', color: '#fff' }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Open in Telegram
                  </a>
                  <p className="text-xs" style={{ color: '#8A97A3' }}>After sending /start, refresh this page to see connected status.</p>
                  <button onClick={handleTgConnect} className="text-xs underline" style={{ color: '#5F6B76' }}>Regenerate link</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CHAT TAB ── */}
        {tab === 'chat' && (
          <div style={CARD} className="overflow-hidden">
            <div className="p-5 flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                <MessageSquare className="w-6 h-6" style={{ color: '#3A8DDE' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold mb-1" style={{ color: '#1E2A32' }}>Project Chats</h3>
                <p className="text-xs" style={{ color: '#5F6B76' }}>Access all project chat threads</p>
              </div>
              <a href="/dashboard/admin/chats"
                className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl"
                style={{ background: '#3A8DDE', color: '#fff' }}>
                <MessageSquare className="w-4 h-4" /> Open Chat
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

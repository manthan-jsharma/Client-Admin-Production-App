'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Ticket } from '@/lib/types';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, AlertCircle,
  Megaphone, Bug, HeadphonesIcon, CreditCard, Search,
  MessageSquare, ChevronDown, Send, RefreshCw,
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

const typeConfig: Record<Ticket['type'], { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }> = {
  support:         { label: 'Support',  icon: HeadphonesIcon, color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0' },
  feature_request: { label: 'Feature',  icon: Megaphone,      color: '#3A8DDE', bg: '#eff8ff', border: '#c8dff0' },
  bug:             { label: 'Bug',      icon: Bug,            color: '#ef4444', bg: '#fff1f2', border: '#fecaca' },
  billing:         { label: 'Billing',  icon: CreditCard,     color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  general:         { label: 'General',  icon: MessageSquare,  color: '#5F6B76', bg: 'rgba(58,141,222,0.06)', border: '#DDE5EC' },
};

const statusConfig: Record<Ticket['status'], { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  open:        { label: 'Open',        color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: Clock },
  in_progress: { label: 'In Progress', color: '#3A8DDE', bg: '#eff8ff', border: '#c8dff0', icon: RefreshCw },
  resolved:    { label: 'Resolved',    color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0', icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: '#8A97A3', bg: 'rgba(58,141,222,0.06)', border: '#DDE5EC', icon: XCircle },
};

const priorityConfig: Record<Ticket['priority'], { label: string; dot: string; color: string }> = {
  low:    { label: 'Low',    dot: '#8A97A3', color: '#8A97A3' },
  medium: { label: 'Medium', dot: '#f59e0b', color: '#f59e0b' },
  high:   { label: 'High',   dot: '#f97316', color: '#f97316' },
  urgent: { label: 'Urgent', dot: '#ef4444', color: '#ef4444' },
};

export default function AdminRequestsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Ticket['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Ticket['type']>('all');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) setTickets(result.data);
    } catch {
      notify('error', 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const updateStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) { setTickets(prev => prev.map(t => t._id === ticketId ? result.data : t)); notify('success', 'Status updated'); }
    } catch { notify('error', 'Failed to update'); }
  };

  const sendResponse = async (ticketId: string) => {
    if (!responseText.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: responseText, status: 'in_progress' }),
      });
      const result = await res.json();
      if (result.success) {
        setTickets(prev => prev.map(t => t._id === ticketId ? result.data : t));
        setRespondingTo(null); setResponseText('');
        notify('success', 'Response sent');
      }
    } catch { notify('error', 'Failed to send response'); }
    finally { setIsSaving(false); }
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;

  const inputStyle = { background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155', borderRadius: '12px' };

  return (
    <div className="min-h-screen animate-fade-up" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Tickets & Requests"
        subtitle={openCount > 0 ? `${openCount} open ticket${openCount !== 1 ? 's' : ''} awaiting response` : 'All tickets reviewed — great work!'}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Requests' }]}
        heroStrip
        actions={openCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <Clock className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
            <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{openCount} open</span>
          </div>
        ) : undefined}
      />

      <div className="p-8 space-y-5">
        {/* Notification */}
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by subject, client, or description…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none cursor-pointer"
                style={inputStyle}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
            </div>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                className="h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none cursor-pointer"
                style={inputStyle}
              >
                <option value="all">All Types</option>
                <option value="support">Support</option>
                <option value="feature_request">Feature</option>
                <option value="bug">Bug</option>
                <option value="billing">Billing</option>
                <option value="general">General</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading tickets…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(ticket => {
              const type = typeConfig[ticket.type];
              const status = statusConfig[ticket.status];
              const priority = priorityConfig[ticket.priority];
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;
              const isResponding = respondingTo === ticket._id;
              const isUrgent = ticket.priority === 'urgent' || ticket.priority === 'high';

              // pill classes
              const statusPillClass = ticket.status === 'open' ? 'pill-pending'
                : ticket.status === 'in_progress' ? 'pill-active'
                : ticket.status === 'resolved' ? 'pill-info'
                : 'pill-muted';

              return (
                <div
                  key={ticket._id}
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    ...CARD,
                    borderColor: ticket.status === 'open' && isUrgent
                      ? '#fecaca'
                      : ticket.status === 'open'
                      ? '#fde68a'
                      : '#DDE5EC',
                    opacity: ticket.status === 'resolved' || ticket.status === 'closed' ? 0.8 : 1,
                  }}
                >
                  {/* Top accent for open tickets */}
                  {ticket.status === 'open' && (
                    <div
                      className="h-[3px] w-full"
                      style={{ background: isUrgent
                        ? 'linear-gradient(90deg, #ef4444, #fca5a5)'
                        : 'linear-gradient(90deg, #f59e0b, #fcd34d)' }}
                    />
                  )}

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: type.bg, border: `1px solid ${type.border}` }}
                      >
                        <TypeIcon className="w-4 h-4" style={{ color: type.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-4 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ background: type.bg, color: type.color, border: `1px solid ${type.border}` }}
                            >{type.label}</span>
                            <span className={`${statusPillClass} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />{status.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: priority.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: priority.dot }} />
                              {priority.label}
                            </span>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {ticket.status === 'open' && (
                              <button
                                onClick={() => { setRespondingTo(isResponding ? null : ticket._id!); setResponseText(ticket.adminResponse || ''); }}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
                                style={{ background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }}
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Respond
                              </button>
                            )}
                            {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                              <button
                                onClick={() => updateStatus(ticket._id!, 'resolved')}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
                                style={{ background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                              </button>
                            )}
                            {ticket.status === 'resolved' && (
                              <button
                                onClick={() => updateStatus(ticket._id!, 'closed')}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95"
                                style={{ background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}
                              >
                                <XCircle className="w-3.5 h-3.5" /> Archive
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold mb-1" style={{ color: '#1E2A32', fontWeight: 800 }}>{ticket.subject}</h3>
                        <p className="text-xs mb-2" style={{ color: '#8A97A3' }}>
                          From <span className="font-medium" style={{ color: '#334155' }}>{ticket.clientName}</span>
                          {ticket.projectId && <span style={{ color: '#cbd5e1' }}> · #{ticket.projectId.slice(-6)}</span>}
                        </p>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: '#5F6B76' }}>{ticket.description}</p>

                        {ticket.adminResponse && !isResponding && (
                          <div className="mt-2 p-3 rounded-xl" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#3A8DDE' }}>Your response</p>
                            <p className="text-xs leading-relaxed" style={{ color: '#5F6B76' }}>{ticket.adminResponse}</p>
                          </div>
                        )}

                        {isResponding && (
                          <div className="mt-3 space-y-2.5">
                            <textarea
                              value={responseText}
                              onChange={e => setResponseText(e.target.value)}
                              rows={3}
                              placeholder="Write your response to the client…"
                              className="w-full px-3.5 py-2.5 rounded-xl text-sm resize-none focus:outline-none transition-all"
                              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => sendResponse(ticket._id!)}
                                disabled={isSaving || !responseText.trim()}
                                className="btn-primary flex items-center gap-1.5 text-xs h-8 px-4 disabled:opacity-40"
                              >
                                {isSaving ? <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Send className="w-3.5 h-3.5" />}
                                Send Response
                              </button>
                              <button
                                onClick={() => setRespondingTo(null)}
                                className="text-xs font-medium rounded-xl h-8 px-4 transition-all duration-150 active:scale-95"
                                style={{ background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: '#8A97A3' }}>
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {ticket.resolvedAt && <span className="ml-2" style={{ color: '#6BCF7A' }}>· Resolved {new Date(ticket.resolvedAt).toLocaleDateString()}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState variant="generic" title="No tickets yet" description="Client support tickets and requests will appear here." />
        )}
      </div>
    </div>
  );
}

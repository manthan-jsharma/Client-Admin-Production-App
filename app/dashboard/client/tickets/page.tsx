'use client';

import React, { useState, useEffect } from 'react';
import { Ticket } from '@/lib/types';
import {
  LifeBuoy, CheckCircle2, XCircle, Clock, RefreshCw,
  Bug, Zap, HeadphonesIcon, CreditCard, MessageSquare,
  ChevronDown, ChevronUp, AlertCircle,
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

const TYPE_CONFIG: Record<Ticket['type'], { label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; badgeStyle: React.CSSProperties; bgStyle: React.CSSProperties; iconColor: string }> = {
  support:         { label: 'Support',         icon: HeadphonesIcon, badgeStyle: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' },   bgStyle: { background: 'rgba(107,207,122,0.1)' }, iconColor: '#6BCF7A' },
  feature_request: { label: 'Feature Request', icon: Zap,            badgeStyle: { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' },   bgStyle: { background: '#eff8ff' }, iconColor: '#3A8DDE' },
  bug:             { label: 'Bug Report',      icon: Bug,            badgeStyle: { background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca' },   bgStyle: { background: '#fff1f2' }, iconColor: '#ef4444' },
  billing:         { label: 'Billing',         icon: CreditCard,     badgeStyle: { background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' },   bgStyle: { background: '#f5f3ff' }, iconColor: '#8b5cf6' },
  general:         { label: 'General',         icon: MessageSquare,  badgeStyle: { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' },   bgStyle: { background: 'rgba(58,141,222,0.06)' }, iconColor: '#5F6B76' },
};

const STATUS_CONFIG: Record<Ticket['status'], { label: string; badgeStyle: React.CSSProperties; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  open:        { label: 'Open',        badgeStyle: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' },    icon: Clock },
  in_progress: { label: 'In Progress', badgeStyle: { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' },    icon: RefreshCw },
  resolved:    { label: 'Resolved',    badgeStyle: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' },    icon: CheckCircle2 },
  closed:      { label: 'Closed',      badgeStyle: { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' },    icon: XCircle },
};

const PRIORITY_DOT: Record<Ticket['priority'], string> = {
  low: '#8A97A3', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444',
};

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Ticket['status']>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setTickets(result.data);
    } catch { setNotification('Failed to load tickets'); }
    finally { setIsLoading(false); }
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Support Tickets"
        subtitle={counts.open > 0
          ? `${counts.open} open ticket${counts.open !== 1 ? 's' : ''} awaiting response`
          : 'Track your submitted tickets and admin responses'}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Support Tickets' }]}
        heroStrip={true}
      />

      <div className="p-8 space-y-5">
        {notification && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium" style={{ background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{notification}
          </div>
        )}

        {/* Info card */}
        <div style={{ ...CARD, border: '1px solid #c8dff0' }} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-blue-400 via-blue-200 to-transparent" />
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
              <LifeBuoy className="w-5 h-5" style={{ color: '#3A8DDE' }} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#1E2A32', fontWeight: 800 }}>Need to raise a ticket?</p>
              <p className="text-xs leading-relaxed" style={{ color: '#5F6B76' }}>
                Submit bug reports or feature requests via the <strong style={{ color: '#334155' }}>Chat</strong> page using the ticket icon in the message toolbar.
                All responses from our team will appear here and you&apos;ll receive an email notification.
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1 w-fit flex-wrap" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === f
                ? { background: '#3A8DDE', color: '#ffffff' }
                : { color: '#5F6B76' }}>
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

        {/* Ticket list */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#8A97A3' }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="generic"
            title={filter === 'all' ? 'No tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
            description="Submit tickets from the Chat page using the ticket icon"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => {
              const tc = TYPE_CONFIG[ticket.type];
              const sc = STATUS_CONFIG[ticket.status];
              const TypeIcon = tc.icon;
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === ticket._id;
              const hasResponse = !!ticket.adminResponse;
              const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

              return (
                <div key={ticket._id}
                  style={{ ...CARD, border: isResolved ? '1px solid #DDE5EC' : hasResponse ? '1px solid #c8dff0' : '1px solid #DDE5EC' }}
                  className="overflow-hidden transition-all">
                  {hasResponse && !isResolved && <div className="h-[3px] bg-gradient-to-r from-blue-400 via-blue-200 to-transparent" />}
                  {isResolved && <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-emerald-200 to-transparent" />}
                  <div className={`p-5 ${isResolved ? 'opacity-80' : ''}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={tc.bgStyle}>
                        <TypeIcon className="w-4 h-4" style={{ color: tc.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold truncate" style={{ color: '#1E2A32' }}>{ticket.subject}</h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                            <span className={`pill-muted inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold`} style={tc.badgeStyle}>
                              <TypeIcon className="w-3 h-3" />{tc.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                              ticket.status === 'open' || ticket.status === 'in_progress' ? 'pill-active' :
                              ticket.status === 'resolved' ? 'pill-info' :
                              'pill-rejected'
                            }`} style={sc.badgeStyle}>
                              <StatusIcon className="w-3 h-3" />{sc.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: '#5F6B76' }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_DOT[ticket.priority] }} />
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: '#8A97A3' }}>
                          Submitted {new Date(ticket.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {ticket.resolvedAt && <span className="ml-2" style={{ color: '#6BCF7A' }}>· Resolved {new Date(ticket.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="pl-12">
                      <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`} style={{ color: '#5F6B76' }}>{ticket.description}</p>
                      {ticket.description.length > 120 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : ticket._id!)} className="flex items-center gap-1 text-xs mt-1 transition-colors" style={{ color: '#3A8DDE' }}>
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}

                      {ticket.adminResponse && (
                        <div className="mt-3 p-4 rounded-xl" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                          <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: '#3A8DDE' }}>
                            <MessageSquare className="w-3 h-3" /> Team Response
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#334155' }}>{ticket.adminResponse}</p>
                        </div>
                      )}

                      {!ticket.adminResponse && ticket.status === 'open' && (
                        <p className="text-xs flex items-center gap-1 mt-2" style={{ color: '#f59e0b' }}>
                          <Clock className="w-3 h-3" /> Awaiting response from our team
                        </p>
                      )}
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

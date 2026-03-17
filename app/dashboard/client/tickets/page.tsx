'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Ticket } from '@/lib/types';
import {
  LifeBuoy, CheckCircle2, XCircle, Clock, RefreshCw,
  Bug, Zap, HeadphonesIcon, CreditCard, MessageSquare,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';

const TYPE_CONFIG: Record<Ticket['type'], { label: string; icon: React.ComponentType<{ className?: string }>; badge: string }> = {
  support:         { label: 'Support',         icon: HeadphonesIcon, badge: 'bg-emerald-500/15 text-emerald-400' },
  feature_request: { label: 'Feature Request', icon: Zap,            badge: 'bg-blue-500/15 text-blue-400' },
  bug:             { label: 'Bug Report',      icon: Bug,            badge: 'bg-red-500/15 text-red-400' },
  billing:         { label: 'Billing',         icon: CreditCard,     badge: 'bg-purple-500/15 text-purple-400' },
  general:         { label: 'General',         icon: MessageSquare,  badge: 'bg-slate-500/15 text-slate-400' },
};

const STATUS_CONFIG: Record<Ticket['status'], { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  open:        { label: 'Open',        badge: 'bg-amber-500/15 text-amber-400',    icon: Clock },
  in_progress: { label: 'In Progress', badge: 'bg-blue-500/15 text-blue-400',      icon: RefreshCw },
  resolved:    { label: 'Resolved',    badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  closed:      { label: 'Closed',      badge: 'bg-slate-500/15 text-slate-400',    icon: XCircle },
};

const PRIORITY_DOT: Record<Ticket['priority'], string> = {
  low: 'bg-slate-500', medium: 'bg-amber-500', high: 'bg-orange-500', urgent: 'bg-red-500',
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
    } catch {
      setNotification('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
            <p className="text-sm text-slate-500 mt-1">
              {counts.open > 0
                ? <span className="text-amber-400">{counts.open} open ticket{counts.open !== 1 ? 's' : ''} awaiting response</span>
                : 'Track your submitted tickets and admin responses'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {notification && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-red-500/10 border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {notification}
          </div>
        )}

        {/* How to submit info card */}
        <Card className="bg-gradient-to-br from-blue-600/10 via-slate-800/60 to-slate-800/60 border-blue-500/20 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <LifeBuoy className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Need to raise a ticket?</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Submit bug reports or feature requests via the <strong className="text-slate-300">Chat</strong> page using the ticket icon in the message toolbar.
                All responses from our team will appear here and you'll receive an email notification.
              </p>
            </div>
          </div>
        </Card>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit flex-wrap">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f ? 'bg-slate-600 text-slate-300' : 'bg-slate-700/50 text-slate-600'
              }`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-7 h-7 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LifeBuoy className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {filter === 'all' ? 'No tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
            </p>
            <p className="text-slate-600 text-sm">
              Submit tickets from the Chat page using the ticket icon
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => {
              const tc = TYPE_CONFIG[ticket.type];
              const sc = STATUS_CONFIG[ticket.status];
              const TypeIcon = tc.icon;
              const StatusIcon = sc.icon;
              const isExpanded = expandedId === ticket._id;
              const hasResponse = !!ticket.adminResponse;

              return (
                <Card
                  key={ticket._id}
                  className={`border transition-all ${
                    ticket.status === 'resolved' || ticket.status === 'closed'
                      ? 'bg-slate-800/40 border-slate-700/30'
                      : hasResponse
                      ? 'bg-blue-500/5 border-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700/50'
                  }`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.badge.replace('text-', 'bg-').replace('/15', '/10')}`}>
                        <TypeIcon className={`w-4 h-4 ${tc.badge.split(' ').find(c => c.startsWith('text-'))}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-white truncate">{ticket.subject}</h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${tc.badge}`}>
                              <TypeIcon className="w-3 h-3" />
                              {tc.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${sc.badge}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[ticket.priority]}`} />
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">
                          Submitted {new Date(ticket.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {ticket.resolvedAt && (
                            <span className="ml-2 text-emerald-600">
                              · Resolved {new Date(ticket.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="pl-12">
                      <p className={`text-sm text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {ticket.description}
                      </p>
                      {ticket.description.length > 120 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : ticket._id!)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors"
                        >
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}

                      {/* Admin response */}
                      {ticket.adminResponse && (
                        <div className="mt-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" /> Team Response
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{ticket.adminResponse}</p>
                        </div>
                      )}

                      {/* Awaiting response hint */}
                      {!ticket.adminResponse && ticket.status === 'open' && (
                        <p className="text-xs text-amber-400 flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" /> Awaiting response from our team
                        </p>
                      )}
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

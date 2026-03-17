'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket } from '@/lib/types';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, AlertCircle,
  Megaphone, Bug, HeadphonesIcon, CreditCard, Search,
  MessageSquare, ChevronDown, Send, RefreshCw,
} from 'lucide-react';

const typeConfig: Record<Ticket['type'], { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; badge: string }> = {
  support: { label: 'Support', icon: HeadphonesIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/15 text-emerald-400' },
  feature_request: { label: 'Feature', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10', badge: 'bg-blue-500/15 text-blue-400' },
  bug: { label: 'Bug', icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10', badge: 'bg-red-500/15 text-red-400' },
  billing: { label: 'Billing', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10', badge: 'bg-purple-500/15 text-purple-400' },
  general: { label: 'General', icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-500/10', badge: 'bg-slate-500/15 text-slate-400' },
};

const statusConfig: Record<Ticket['status'], { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', badge: 'bg-amber-500/15 text-amber-400', icon: Clock },
  in_progress: { label: 'In Progress', badge: 'bg-blue-500/15 text-blue-400', icon: RefreshCw },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  closed: { label: 'Closed', badge: 'bg-slate-500/15 text-slate-400', icon: XCircle },
};

const priorityConfig: Record<Ticket['priority'], { label: string; dot: string }> = {
  low: { label: 'Low', dot: 'bg-slate-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500' },
  high: { label: 'High', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', dot: 'bg-red-500' },
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

  useEffect(() => {
    fetchTickets();
  }, []);

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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        setTickets(prev => prev.map(t => t._id === ticketId ? result.data : t));
        notify('success', 'Ticket status updated');
      }
    } catch {
      notify('error', 'Failed to update ticket');
    }
  };

  const sendResponse = async (ticketId: string) => {
    if (!responseText.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminResponse: responseText, status: 'in_progress' }),
      });
      const result = await res.json();
      if (result.success) {
        setTickets(prev => prev.map(t => t._id === ticketId ? result.data : t));
        setRespondingTo(null);
        setResponseText('');
        notify('success', 'Response sent');
      }
    } catch {
      notify('error', 'Failed to send response');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = tickets.filter(t => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tickets & Requests</h1>
            <p className="text-sm text-slate-500 mt-1">
              {openCount > 0 ? (
                <span className="text-amber-400">{openCount} open ticket{openCount !== 1 ? 's' : ''}</span>
              ) : (
                'All tickets reviewed'
              )}
            </p>
          </div>
          {openCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">{openCount} awaiting response</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notification.message}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-10 pl-3 pr-8 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            {/* Type filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                className="h-10 pl-3 pr-8 bg-slate-800/60 border border-slate-700/50 text-slate-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="all">All Types</option>
                <option value="support">Support</option>
                <option value="feature_request">Feature Request</option>
                <option value="bug">Bug</option>
                <option value="billing">Billing</option>
                <option value="general">General</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(ticket => {
              const type = typeConfig[ticket.type];
              const status = statusConfig[ticket.status];
              const priority = priorityConfig[ticket.priority];
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;
              const isResponding = respondingTo === ticket._id;

              return (
                <Card key={ticket._id} className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 ${type.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <TypeIcon className={`w-5 h-5 ${type.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${type.badge}`}>
                              {type.label}
                            </span>
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.badge}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                              {priority.label}
                            </span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2 flex-shrink-0">
                            {ticket.status === 'open' && (
                              <Button
                                onClick={() => { setRespondingTo(isResponding ? null : ticket._id!); setResponseText(ticket.adminResponse || ''); }}
                                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-xl h-8 px-3 border border-blue-500/20 flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Respond
                              </Button>
                            )}
                            {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                              <Button
                                onClick={() => updateStatus(ticket._id!, 'resolved')}
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-xl h-8 px-3 border border-emerald-500/20 flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                              </Button>
                            )}
                            {ticket.status === 'resolved' && (
                              <Button
                                onClick={() => updateStatus(ticket._id!, 'closed')}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-xl h-8 px-3 flex items-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Close
                              </Button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-sm font-semibold text-white mb-1">{ticket.subject}</h3>
                        <p className="text-xs text-slate-500 mb-1.5">
                          From <span className="text-slate-400 font-medium">{ticket.clientName}</span>
                          {ticket.projectId && <span className="text-slate-600"> · Project #{ticket.projectId.slice(-6)}</span>}
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">{ticket.description}</p>

                        {/* Admin response display */}
                        {ticket.adminResponse && !isResponding && (
                          <div className="mt-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
                            <p className="text-xs font-medium text-blue-400 mb-1">Your response</p>
                            <p className="text-xs text-slate-400">{ticket.adminResponse}</p>
                          </div>
                        )}

                        {/* Respond form */}
                        {isResponding && (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={responseText}
                              onChange={e => setResponseText(e.target.value)}
                              rows={3}
                              placeholder="Write your response..."
                              className="w-full px-3.5 py-2.5 bg-slate-700/60 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => sendResponse(ticket._id!)}
                                disabled={isSaving || !responseText.trim()}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl h-8 px-4"
                              >
                                {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Send
                              </Button>
                              <Button onClick={() => setRespondingTo(null)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-xl h-8 px-4">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 mt-3 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt!).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                          {ticket.resolvedAt && (
                            <span className="ml-2 text-emerald-600">· Resolved {new Date(ticket.resolvedAt).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No tickets found</p>
            <p className="text-slate-600 text-sm">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your filters' : 'All clear!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

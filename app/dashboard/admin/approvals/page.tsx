'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';

type Tab = 'pending' | 'approved' | 'add';

export default function ApprovalsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', email: '', businessName: '', password: '', phone: '', company: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setClients(result.data);
    } catch {
      console.error('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (clientId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setClients(prev => prev.map(c => c._id === clientId ? { ...c, status: 'approved' as const } : c));
        notify('success', 'Client approved successfully');
      } else {
        notify('error', result.error || 'Failed to approve');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialogId || !rejectFeedback.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clients/${rejectDialogId}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: rejectFeedback })
      });
      const result = await res.json();
      if (result.success) {
        setClients(prev => prev.map(c => c._id === rejectDialogId
          ? { ...c, status: 'rejected' as const, approvalFeedback: rejectFeedback }
          : c
        ));
        setRejectDialogId(null);
        setRejectFeedback('');
        notify('success', 'Client rejected');
      } else {
        notify('error', result.error || 'Failed to reject');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      const result = await res.json();
      if (result.success) {
        setClients(prev => [...prev, result.data]);
        setAddForm({ name: '', email: '', businessName: '', password: '', phone: '', company: '' });
        notify('success', `Client ${result.data.name} added and auto-approved`);
        setActiveTab('approved');
      } else {
        notify('error', result.error || 'Failed to add client');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pending = clients.filter(c => c.status === 'pending');
  const approved = clients.filter(c => c.status === 'approved');
  const rejected = clients.filter(c => c.status === 'rejected');

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'approved', label: 'Approved', count: approved.length },
    { key: 'add', label: 'Add Client' },
  ];

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Client Approvals</h1>
            <p className="text-sm text-slate-500 mt-1">
              {pending.length > 0
                ? <span className="text-amber-400">{pending.length} pending review</span>
                : 'Manage client access to the platform'}
            </p>
          </div>
          {pending.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">{pending.length} awaiting review</span>
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mx-8 mt-4 flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {notification.message}
        </div>
      )}

      <div className="p-8 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Pending Tab ── */}
        {activeTab === 'pending' && (
          isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : pending.length > 0 ? (
            <div className="space-y-4">
              {pending.map((client) => (
                <Card key={client._id} className="bg-slate-800/60 border-slate-700/50">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white">{client.name}</h3>
                            {client.businessName && (
                              <p className="text-xs text-slate-500 mt-0.5">{client.businessName}</p>
                            )}
                          </div>
                          <span className="flex items-center gap-1.5 text-xs font-medium bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-600" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="w-3.5 h-3.5 text-slate-600" />
                              {client.phone}
                            </div>
                          )}
                          {client.company && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Building2 className="w-3.5 h-3.5 text-slate-600" />
                              {client.company}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5" />
                            Applied {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'recently'}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleApprove(client._id!)}
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl h-8 px-3.5 shadow-lg shadow-emerald-600/20"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => { setRejectDialogId(client._id!); setRejectFeedback(''); }}
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 bg-slate-700 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs font-medium rounded-xl h-8 px-3.5 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500/60" />
              </div>
              <p className="text-slate-400 font-medium mb-1.5">No pending requests</p>
              <p className="text-slate-600 text-sm">All client applications have been reviewed</p>
            </Card>
          )
        )}

        {/* ── Approved Tab ── */}
        {activeTab === 'approved' && (
          isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : approved.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approved.map((client) => (
                <Card key={client._id} className="bg-slate-800/60 border-slate-700/50 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{client.name}</h3>
                      <p className="text-xs text-slate-500 truncate">{client.businessName || client.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-400">
                        Approved
                      </span>
                      {client.addedByAdmin && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-400">
                          Manual
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1.5">No approved clients yet</p>
            </Card>
          )
        )}

        {/* ── Add Client Tab ── */}
        {activeTab === 'add' && (
          <Card className="bg-slate-800/60 border-slate-700/50 max-w-2xl">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-base font-semibold text-white">Manually Add Client</h2>
              <p className="text-xs text-slate-500 mt-0.5">Client will be auto-approved and can log in immediately</p>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Full name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Jane Doe"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Business name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      value={addForm.businessName}
                      onChange={e => setAddForm(p => ({ ...p, businessName: e.target.value }))}
                      placeholder="Acme Inc."
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email address <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={addForm.email}
                      onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="jane@acme.com"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="tel"
                      value={addForm.phone}
                      onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 555 0000"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      value={addForm.company}
                      onChange={e => setAddForm(p => ({ ...p, company: e.target.value }))}
                      placeholder="Company name"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    Temporary password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={addForm.password}
                      onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min. 8 chars, uppercase, lowercase, number"
                      className="pl-10 pr-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">Share this password with the client so they can log in.</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add & Approve Client
              </Button>
            </form>
          </Card>
        )}
      </div>

      {/* ── Reject Dialog ── */}
      {rejectDialogId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Reject Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please provide a reason for rejection</p>
              </div>
              <button
                onClick={() => setRejectDialogId(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={rejectFeedback}
              onChange={e => setRejectFeedback(e.target.value)}
              placeholder="e.g. Your business does not match our current client criteria..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                disabled={isSubmitting || rejectFeedback.trim().length < 5}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl h-10 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject Application
              </Button>
              <Button
                onClick={() => setRejectDialogId(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-10 px-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

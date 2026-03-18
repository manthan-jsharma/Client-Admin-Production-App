'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import {
  Users, CheckCircle2, XCircle, Clock, Plus, X,
  Mail, Phone, Building2, Briefcase, Lock, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: '18px',
};

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
  const [addForm, setAddForm] = useState({ name: '', email: '', businessName: '', password: '', phone: '', company: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', { headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setClients(result.data);
    } catch { console.error('Failed to fetch clients'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (clientId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/approve`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) { setClients(prev => prev.map(c => c._id === clientId ? { ...c, status: 'approved' as const } : c)); notify('success', 'Client approved successfully'); }
      else notify('error', result.error || 'Failed to approve');
    } catch { notify('error', 'Network error'); }
    finally { setIsSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectDialogId || !rejectFeedback.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clients/${rejectDialogId}/reject`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ feedback: rejectFeedback }) });
      const result = await res.json();
      if (result.success) {
        setClients(prev => prev.map(c => c._id === rejectDialogId ? { ...c, status: 'rejected' as const, approvalFeedback: rejectFeedback } : c));
        setRejectDialogId(null); setRejectFeedback(''); notify('success', 'Client rejected');
      } else notify('error', result.error || 'Failed to reject');
    } catch { notify('error', 'Network error'); }
    finally { setIsSubmitting(false); }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
      const result = await res.json();
      if (result.success) {
        setClients(prev => [...prev, result.data]);
        setAddForm({ name: '', email: '', businessName: '', password: '', phone: '', company: '' });
        notify('success', `Client ${result.data.name} added and auto-approved`);
        setActiveTab('approved');
      } else notify('error', result.error || 'Failed to add client');
    } catch { notify('error', 'Network error'); }
    finally { setIsSubmitting(false); }
  };

  const pending = clients.filter(c => c.status === 'pending');
  const approved = clients.filter(c => c.status === 'approved');

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Pending', count: pending.length },
    { key: 'approved', label: 'Approved', count: approved.length },
    { key: 'add', label: 'Add Client' },
  ];

  const inputClass = "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none";
  const inputStyle = {
    background: 'rgba(58,141,222,0.06)',
    border: '1px solid #DDE5EC',
    color: '#1E2A32',
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Client Approvals"
        subtitle={pending.length > 0 ? `${pending.length} pending review` : 'Manage client access to the platform'}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Approvals' }]}
        heroStrip
        actions={pending.length > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#f59e0b' }}>
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold">{pending.length} awaiting review</span>
          </div>
        ) : undefined}
      />

      <div className="p-8 space-y-6">
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

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab.key
                ? { background: '#3A8DDE', color: '#ffffff' }
                : { color: '#5F6B76' }}>
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={activeTab === tab.key
                    ? { background: 'rgba(255,255,255,0.25)', color: '#ffffff' }
                    : { background: '#DDE5EC', color: '#5F6B76' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              <p className="text-xs" style={{ color: '#8A97A3' }}>Loading…</p>
            </div>
          ) : pending.length > 0 ? (
            <div className="space-y-4">
              {pending.map(client => (
                <div key={client._id} style={{ ...CARD, border: '1px solid #fde68a' }} className="overflow-hidden">
                  <div className="h-[3px] bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-base font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{client.name}</h3>
                            {client.businessName && <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>{client.businessName}</p>}
                          </div>
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' }}>
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#5F6B76' }}><Mail className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />{client.email}</div>
                          {client.phone && <div className="flex items-center gap-2 text-xs" style={{ color: '#5F6B76' }}><Phone className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />{client.phone}</div>}
                          {client.company && <div className="flex items-center gap-2 text-xs" style={{ color: '#5F6B76' }}><Building2 className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />{client.company}</div>}
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#8A97A3' }}><Clock className="w-3.5 h-3.5" />Applied {client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}</div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleApprove(client._id!)} disabled={isSubmitting}
                            className="flex items-center gap-1.5 disabled:opacity-50 text-white text-xs font-semibold rounded-xl h-9 px-4 transition-colors"
                            style={{ background: '#10b981' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => { setRejectDialogId(client._id!); setRejectFeedback(''); }} disabled={isSubmitting}
                            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl h-9 px-4 transition-all"
                            style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState variant="clients" />
          )
        )}

        {/* Approved Tab */}
        {activeTab === 'approved' && (
          isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            </div>
          ) : approved.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approved.map(client => (
                <div key={client._id} style={CARD} className="p-5 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: '#1E2A32' }}>{client.name}</h3>
                      <p className="text-xs truncate" style={{ color: '#8A97A3' }}>{client.businessName || client.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>Approved</span>
                      {client.addedByAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }}>Manual</span>}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs" style={{ color: '#5F6B76' }}>
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} /><span className="truncate">{client.email}</span></div>
                    {client.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />{client.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState variant="clients" />
          )
        )}

        {/* Add Client Tab */}
        {activeTab === 'add' && (
          <div style={{ ...CARD, maxWidth: '672px' }} className="overflow-hidden">
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Manually Add Client</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Client will be auto-approved and can log in immediately</p>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Full name <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input type="text" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" required
                      className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Business name <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input type="text" value={addForm.businessName} onChange={e => setAddForm(p => ({ ...p, businessName: e.target.value }))} placeholder="Acme Inc." required
                      className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Email address <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@acme.com" required
                      className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input type="tel" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 555 0000"
                      className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input type="text" value={addForm.company} onChange={e => setAddForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name"
                      className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Temporary password <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <input type={showPassword ? 'text' : 'password'} value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 8 chars, uppercase, lowercase, number" required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all focus:outline-none" style={inputStyle} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#8A97A3' }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: '#8A97A3' }}>Share this password with the client so they can log in.</p>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 disabled:opacity-50 text-white font-semibold rounded-xl px-6 h-10 text-sm transition-colors"
                style={{ background: '#3A8DDE' }}>
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Add & Approve Client
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {rejectDialogId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md shadow-2xl rounded-2xl" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.55)' }}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: '#1E2A32' }}>Reject Application</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Please provide a reason for rejection</p>
                </div>
                <button onClick={() => setRejectDialogId(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#8A97A3' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)} placeholder="e.g. Your business does not match our current client criteria..." rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none mb-4 transition-all focus:outline-none"
                style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }} />
              <div className="flex gap-3">
                <button onClick={handleReject} disabled={isSubmitting || rejectFeedback.trim().length < 5}
                  className="flex-1 flex items-center justify-center gap-2 disabled:opacity-50 text-white font-semibold rounded-xl h-10 text-sm transition-colors"
                  style={{ background: '#ef4444' }}>
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject Application
                </button>
                <button onClick={() => setRejectDialogId(null)} className="font-semibold rounded-xl h-10 px-4 text-sm transition-colors"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

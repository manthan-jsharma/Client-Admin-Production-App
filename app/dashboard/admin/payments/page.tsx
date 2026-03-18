'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Payment, Project, User } from '@/lib/types';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Plus,
  Search, ChevronDown, Pencil, Save, X, AlertCircle,
  DollarSign, Calendar, FolderKanban, ArrowUpRight,
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

const statusConfig: Record<Payment['status'], { label: string; color: string; bg: string; border: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid:    { label: 'Paid',    color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981', icon: CheckCircle2 },
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', icon: Clock },
  overdue: { label: 'Overdue', color: '#ef4444', bg: '#fff1f2', border: '#fecaca', dot: '#ef4444', icon: AlertTriangle },
};

const inputStyle = {
  background: 'rgba(58,141,222,0.06)',
  border: '1px solid #DDE5EC',
  color: '#334155',
  borderRadius: '12px',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', status: '', paymentMethod: '', notes: '', dueDate: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ projectId: '', clientId: '', clientName: '', amount: '', currency: 'USD', status: 'pending', notes: '', dueDate: '' });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);

  useEffect(() => { fetchPayments(); fetchProjectsAndClients(); }, []);

  const fetchProjectsAndClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [projRes, clientRes] = await Promise.all([
        fetch('/api/projects', { headers }), fetch('/api/admin/clients', { headers }),
      ]);
      const [projResult, clientResult] = await Promise.all([projRes.json(), clientRes.json()]);
      if (projResult.success) setProjects(projResult.data);
      if (clientResult.success) setClients(clientResult.data);
    } catch { /* ignore */ }
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    if (!project) { setCreateForm(f => ({ ...f, projectId: '', clientName: '', clientId: '' })); return; }
    const client = clients.find(c => c._id === project.clientId);
    setCreateForm(f => ({ ...f, projectId, clientName: client?.name ?? '', clientId: project.clientId }));
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
      const result = await res.json();
      if (result.success) setPayments(result.data);
    } catch { notify('error', 'Failed to load payments'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const openEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditForm({
      amount: String(payment.amount), status: payment.status,
      paymentMethod: payment.paymentMethod || '', notes: payment.notes || '',
      dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
    });
  };

  const handleEditSave = async () => {
    if (!editingPayment) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/payments/${editingPayment._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(editForm.amount), status: editForm.status, paymentMethod: editForm.paymentMethod || undefined, notes: editForm.notes || undefined, dueDate: editForm.dueDate }),
      });
      const result = await res.json();
      if (result.success) { setPayments(prev => prev.map(p => p._id === editingPayment._id ? result.data : p)); setEditingPayment(null); notify('success', 'Payment updated'); }
      else notify('error', result.error || 'Failed to update');
    } catch { notify('error', 'Network error'); }
    finally { setIsSaving(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...createForm, amount: parseFloat(createForm.amount) }),
      });
      const result = await res.json();
      if (result.success) {
        setPayments(prev => [result.data, ...prev]); setShowCreateForm(false);
        setCreateForm({ projectId: '', clientId: '', clientName: '', amount: '', currency: 'USD', status: 'pending', notes: '', dueDate: '' });
        notify('success', 'Payment created');
      } else notify('error', result.error || 'Failed to create');
    } catch { notify('error', 'Network error'); }
    finally { setIsSaving(false); }
  };

  const quickMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      const result = await res.json();
      if (result.success) { setPayments(prev => prev.map(p => p._id === id ? result.data : p)); notify('success', 'Marked as paid'); }
    } catch { notify('error', 'Failed to update'); }
  };

  const filtered = payments.filter(p => {
    const projectName = projects.find(pr => pr._id === p.projectId)?.name ?? '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    paid:    payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="min-h-screen animate-fade-up">
      {/* Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg"
            style={{ background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Edit Payment</h2>
              <button
                onClick={() => setEditingPayment(null)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#8A97A3' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input type="number" min="0" step="0.01" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} className="pl-10 rounded-xl h-10" style={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</label>
                  <div className="relative">
                    <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Payment Method</label>
                  <Input value={editForm.paymentMethod} onChange={e => setEditForm(p => ({ ...p, paymentMethod: e.target.value }))} placeholder="e.g. bank_transfer" className="rounded-xl h-10" style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Due Date</label>
                  <Input type="date" value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} className="rounded-xl h-10" style={inputStyle} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Notes</label>
                  <Input value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes…" className="rounded-xl h-10" style={inputStyle} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleEditSave} disabled={isSaving} className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                  {isSaving ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
                <button onClick={() => setEditingPayment(null)} className="font-medium rounded-xl h-10 px-5 text-sm transition-all duration-150 active:scale-95" style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Payments"
        subtitle={`${payments.length} total payment records`}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Payments' }]}
        heroStrip
        actions={
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 font-medium rounded-xl h-10 px-4 text-sm transition-all duration-150 active:scale-95"
            style={showCreateForm
              ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }
              : { background: '#3A8DDE', color: 'white' }}
          >
            {showCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Payment</>}
          </button>
        }
      />

      <div className="p-8 space-y-5">
        {/* Notification */}
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

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Collected', amount: totals.paid,    icon: CheckCircle2,  iconColor: '#10b981', iconBg: '#ecfdf5', valueColor: '#10b981', accentColor: '#10b981' },
            { label: 'Pending',   amount: totals.pending, icon: Clock,          iconColor: '#f59e0b', iconBg: '#fffbeb', valueColor: '#f59e0b', accentColor: '#f59e0b' },
            { label: 'Overdue',   amount: totals.overdue, icon: AlertTriangle,  iconColor: '#ef4444', iconBg: '#fff1f2', valueColor: '#ef4444', accentColor: '#ef4444' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5" style={CARD}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${stat.accentColor}, ${stat.accentColor}88)` }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.iconBg }}>
                      <Icon className="w-4 h-4" style={{ color: stat.iconColor }} />
                    </div>
                    <ArrowUpRight className="w-4 h-4" style={{ color: '#cbd5e1' }} />
                  </div>
                  <p className="text-xs mb-1 font-medium" style={{ color: '#8A97A3' }}>{stat.label}</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: stat.valueColor }}>${stat.amount.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="overflow-hidden" style={CARD}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Create Payment Record</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Add a new payment for a project</p>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Project <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                    <select value={createForm.projectId} onChange={e => handleProjectSelect(e.target.value)} required className="w-full h-10 pl-9 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                      <option value="">— Select a project —</option>
                      {projects.map(p => { const client = clients.find(c => c._id === p.clientId); return <option key={p._id} value={p._id}>{p.name}{client ? ` · ${client.name}` : ''}</option>; })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                  {createForm.clientName && <p className="text-[11px]" style={{ color: '#8A97A3' }}>Client: <span style={{ color: '#334155' }}>{createForm.clientName}</span></p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Amount <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#8A97A3' }} />
                    <Input type="number" min="0" step="0.01" value={createForm.amount} onChange={e => setCreateForm(p => ({ ...p, amount: e.target.value }))} className="pl-9 rounded-xl h-10 text-sm" style={inputStyle} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</label>
                  <div className="relative">
                    <select value={createForm.status} onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))} className="w-full h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Due Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input type="date" value={createForm.dueDate} onChange={e => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} className="rounded-xl h-10 text-sm" style={inputStyle} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Notes</label>
                  <Input value={createForm.notes} onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional…" className="rounded-xl h-10 text-sm" style={inputStyle} />
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                {isSaving ? <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Plus className="w-3.5 h-3.5" />}
                Create Payment
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by client, project, or notes…" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }} />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
            {(['all', 'paid', 'pending', 'overdue'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={statusFilter === s
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#8A97A3' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading payments…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Client / Project</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Amount</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Due Date</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Notes</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment, idx) => {
                    const sc = statusConfig[payment.status];
                    const StatusIcon = sc.icon;
                    const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
                    const displayConfig = isOverdue ? statusConfig.overdue : sc;
                    const DisplayIcon = displayConfig.icon;

                    return (
                      <tr
                        key={payment._id}
                        className="transition-colors duration-100"
                        style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? 'rgba(58,141,222,0.025)' : 'transparent' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{payment.clientName || 'Unknown'}</p>
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8A97A3' }}>
                            <FolderKanban className="w-3 h-3" />
                            {projects.find(pr => pr._id === payment.projectId)?.name ?? payment.projectId.slice(0, 8) + '…'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold tabular-nums" style={{ color: '#1E2A32' }}>${payment.amount.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: '#8A97A3' }}>{payment.currency}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold"
                            style={{ background: displayConfig.bg, color: displayConfig.color, border: `1px solid ${displayConfig.border}` }}
                          >
                            <DisplayIcon className="w-3 h-3" />
                            {isOverdue ? 'Overdue' : sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm flex items-center gap-1.5" style={{ color: '#334155' }}>
                            <Calendar className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />
                            {new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {payment.paidDate && <p className="text-xs mt-0.5" style={{ color: '#10b981' }}>Paid {new Date(payment.paidDate).toLocaleDateString()}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs max-w-[180px] truncate" style={{ color: '#8A97A3' }}>{payment.notes || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {payment.status !== 'paid' && (
                              <button onClick={() => quickMarkPaid(payment._id!)} className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95" style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>
                                Mark Paid
                              </button>
                            )}
                            <button onClick={() => openEdit(payment)} className="p-1.5 rounded-xl transition-all duration-150 active:scale-95" style={{ background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState variant="payments" />
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Payment, DevPayment, Project, User } from '@/lib/types';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Plus,
  Search, ChevronDown, Pencil, Save, X, AlertCircle,
  DollarSign, Calendar, FolderKanban, ArrowUpRight, Users,
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

const statusConfig: Record<Payment['status'], { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid:    { label: 'Paid',    color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2 },
  pending: { label: 'Pending', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: Clock },
  overdue: { label: 'Overdue', color: '#ef4444', bg: '#fff1f2', border: '#fecaca', icon: AlertTriangle },
};

const inputStyle = {
  background: 'rgba(58,141,222,0.06)',
  border: '1px solid #DDE5EC',
  color: '#334155',
  borderRadius: '12px',
};

const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' });

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<'client' | 'dev'>('client');

  // ── Client payments state ──────────────────────────────────────────────────
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', status: '', paymentMethod: '', notes: '', dueDate: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ projectId: '', clientId: '', clientName: '', amount: '', currency: 'USD', status: 'pending', notes: '', dueDate: '' });

  // ── Dev payments state ─────────────────────────────────────────────────────
  const [devPayments, setDevPayments] = useState<DevPayment[]>([]);
  const [devLoading, setDevLoading] = useState(true);
  const [devSearch, setDevSearch] = useState('');
  const [devStatusFilter, setDevStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [editingDevPayment, setEditingDevPayment] = useState<DevPayment | null>(null);
  const [devEditForm, setDevEditForm] = useState({ amount: '', status: '', paymentMethod: '', notes: '' });
  const [showDevCreateForm, setShowDevCreateForm] = useState(false);
  const [devCreateForm, setDevCreateForm] = useState({ projectId: '', devId: '', amount: '', currency: 'USD', status: 'pending', paymentMethod: '', notes: '' });

  // ── Shared state ───────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [devs, setDevs] = useState<User[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const token = localStorage.getItem('auth_token');
    const h = { Authorization: `Bearer ${token}` };
    const [projRes, clientRes, payRes, devPayRes] = await Promise.all([
      fetch('/api/projects', { headers: h }),
      fetch('/api/admin/clients', { headers: h }),
      fetch('/api/admin/payments', { headers: h }),
      fetch('/api/admin/dev-payments', { headers: h }),
    ]);
    const [proj, cl, pay, dp] = await Promise.all([projRes.json(), clientRes.json(), payRes.json(), devPayRes.json()]);
    if (proj.success) setProjects(proj.data);
    if (cl.success) {
      setClients(cl.data.filter((u: User) => u.role === 'client'));
      setDevs(cl.data.filter((u: User) => u.role === 'dev'));
    }
    if (pay.success) setPayments(pay.data);
    if (dp.success) setDevPayments(dp.data);
    setIsLoading(false);
    setDevLoading(false);
  };

  // Also fetch devs separately since /api/admin/clients filters to clients only
  useEffect(() => {
    const fetchDevs = async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/devs', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setDevs(result.data);
    };
    fetchDevs();
  }, []);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Client payment actions ─────────────────────────────────────────────────
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    if (!project) { setCreateForm(f => ({ ...f, projectId: '', clientName: '', clientId: '' })); return; }
    const client = clients.find(c => c._id === project.clientId);
    setCreateForm(f => ({ ...f, projectId, clientName: client?.name ?? '', clientId: project.clientId }));
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
        method: 'PATCH', headers: authHeader(),
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
      const res = await fetch('/api/admin/payments', { method: 'POST', headers: authHeader(), body: JSON.stringify({ ...createForm, amount: parseFloat(createForm.amount) }) });
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
      const res = await fetch(`/api/admin/payments/${id}`, { method: 'PATCH', headers: authHeader(), body: JSON.stringify({ status: 'paid' }) });
      const result = await res.json();
      if (result.success) { setPayments(prev => prev.map(p => p._id === id ? result.data : p)); notify('success', 'Marked as paid'); }
    } catch { notify('error', 'Failed to update'); }
  };

  // ── Dev payment actions ────────────────────────────────────────────────────
  const openDevEdit = (p: DevPayment) => {
    setEditingDevPayment(p);
    setDevEditForm({ amount: String(p.amount), status: p.status, paymentMethod: p.paymentMethod || '', notes: p.notes || '' });
  };

  const handleDevEditSave = async () => {
    if (!editingDevPayment) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/dev-payments/${editingDevPayment._id}`, {
        method: 'PATCH', headers: authHeader(),
        body: JSON.stringify({ amount: parseFloat(devEditForm.amount), status: devEditForm.status, paymentMethod: devEditForm.paymentMethod || undefined, notes: devEditForm.notes || undefined, paidDate: devEditForm.status === 'paid' ? new Date().toISOString() : undefined }),
      });
      const result = await res.json();
      if (result.success) { setDevPayments(prev => prev.map(p => p._id === editingDevPayment._id ? result.data : p)); setEditingDevPayment(null); notify('success', 'Dev payment updated'); }
      else notify('error', result.error || 'Failed to update');
    } catch { notify('error', 'Network error'); }
    finally { setIsSaving(false); }
  };

  const handleDevCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const res = await fetch('/api/admin/dev-payments', { method: 'POST', headers: authHeader(), body: JSON.stringify({ ...devCreateForm, amount: parseFloat(devCreateForm.amount) }) });
      const result = await res.json();
      if (result.success) {
        setDevPayments(prev => [result.data, ...prev]); setShowDevCreateForm(false);
        setDevCreateForm({ projectId: '', devId: '', amount: '', currency: 'USD', status: 'pending', paymentMethod: '', notes: '' });
        notify('success', 'Dev payment created');
      } else notify('error', result.error || 'Failed to create');
    } catch { notify('error', 'Network error'); }
    finally { setIsSaving(false); }
  };

  const quickMarkDevPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/dev-payments/${id}`, { method: 'PATCH', headers: authHeader(), body: JSON.stringify({ status: 'paid', paidDate: new Date().toISOString() }) });
      const result = await res.json();
      if (result.success) { setDevPayments(prev => prev.map(p => p._id === id ? result.data : p)); notify('success', 'Marked as paid'); }
    } catch { notify('error', 'Failed to update'); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = payments.filter(p => {
    const projectName = projects.find(pr => pr._id === p.projectId)?.name ?? '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || p.status === statusFilter);
  });

  const filteredDev = devPayments.filter(p => {
    const projectName = projects.find(pr => pr._id === p.projectId)?.name ?? '';
    const matchesSearch = projectName.toLowerCase().includes(devSearch.toLowerCase()) ||
      p.devName?.toLowerCase().includes(devSearch.toLowerCase()) ||
      p.notes?.toLowerCase().includes(devSearch.toLowerCase());
    return matchesSearch && (devStatusFilter === 'all' || p.status === devStatusFilter);
  });

  const totals = {
    paid:    payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
  };

  const devTotals = {
    paid:    devPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pending: devPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="min-h-screen animate-fade-up">
      {/* Edit client payment modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg" style={{ background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Edit Payment</h2>
              <button onClick={() => setEditingPayment(null)} className="p-1.5 rounded-lg" style={{ color: '#8A97A3' }}><X className="w-4 h-4" /></button>
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
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Method</label>
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
                <button onClick={handleEditSave} disabled={isSaving} className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 text-sm active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                  {isSaving ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setEditingPayment(null)} className="font-medium rounded-xl h-10 px-5 text-sm" style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit dev payment modal */}
      {editingDevPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md" style={{ background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Edit Dev Payment</h2>
              <button onClick={() => setEditingDevPayment(null)} className="p-1.5 rounded-lg" style={{ color: '#8A97A3' }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input type="number" min="0" step="0.01" value={devEditForm.amount} onChange={e => setDevEditForm(p => ({ ...p, amount: e.target.value }))} className="pl-10 rounded-xl h-10" style={inputStyle} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</label>
                  <div className="relative">
                    <select value={devEditForm.status} onChange={e => setDevEditForm(p => ({ ...p, status: e.target.value }))} className="w-full h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Method</label>
                  <Input value={devEditForm.paymentMethod} onChange={e => setDevEditForm(p => ({ ...p, paymentMethod: e.target.value }))} placeholder="e.g. bank_transfer" className="rounded-xl h-10" style={inputStyle} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Notes</label>
                  <Input value={devEditForm.notes} onChange={e => setDevEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes…" className="rounded-xl h-10" style={inputStyle} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleDevEditSave} disabled={isSaving} className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 text-sm active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                  {isSaving ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setEditingDevPayment(null)} className="font-medium rounded-xl h-10 px-5 text-sm" style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Payments"
        subtitle="Track client revenue and dev payouts"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Payments' }]}
        heroStrip
      />

      <div className="p-8 space-y-5">
        {/* Notification */}
        {notification && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium"
            style={notification.type === 'success' ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' } : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Summary cards — always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Client Revenue', amount: totals.paid,      icon: CheckCircle2, iconColor: '#10b981', iconBg: '#ecfdf5', valueColor: '#10b981', accent: '#10b981' },
            { label: 'Client Pending', amount: totals.pending,   icon: Clock,        iconColor: '#f59e0b', iconBg: '#fffbeb', valueColor: '#f59e0b', accent: '#f59e0b' },
            { label: 'Dev Paid Out',   amount: devTotals.paid,   icon: Users,        iconColor: '#8b5cf6', iconBg: '#f5f3ff', valueColor: '#8b5cf6', accent: '#8b5cf6' },
            { label: 'Dev Pending',    amount: devTotals.pending, icon: Clock,       iconColor: '#64748b', iconBg: '#f1f5f9', valueColor: '#64748b', accent: '#94a3b8' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5" style={CARD}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${stat.accent}, ${stat.accent}88)` }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: stat.iconBg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: stat.iconColor }} />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#cbd5e1' }} />
                  </div>
                  <p className="text-[11px] mb-0.5 font-medium" style={{ color: '#8A97A3' }}>{stat.label}</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: stat.valueColor }}>${stat.amount.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
          {([
            { key: 'client', label: 'Client Payments', icon: CreditCard },
            { key: 'dev',    label: 'Dev Payouts',     icon: Users },
          ] as const).map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setShowCreateForm(false); setShowDevCreateForm(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={tab === t.key ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#8A97A3' }}>
                <Icon className="w-3.5 h-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        {/* ── CLIENT PAYMENTS TAB ─────────────────────────────────────────────── */}
        {tab === 'client' && (
          <>
            <div className="flex justify-end">
              <button onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 font-medium rounded-xl h-10 px-4 text-sm active:scale-95"
                style={showCreateForm ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' } : { background: '#3A8DDE', color: 'white' }}>
                {showCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Payment</>}
              </button>
            </div>

            {showCreateForm && (
              <div className="overflow-hidden" style={CARD}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Create Client Payment</h2>
                </div>
                <form onSubmit={handleCreate} className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Project <span style={{ color: '#ef4444' }}>*</span></label>
                      <div className="relative">
                        <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                        <select value={createForm.projectId} onChange={e => handleProjectSelect(e.target.value)} required className="w-full h-10 pl-9 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                          <option value="">— Select project —</option>
                          {projects.map(p => { const c = clients.find(c => c._id === p.clientId); return <option key={p._id} value={p._id}>{p.name}{c ? ` · ${c.name}` : ''}</option>; })}
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
                          <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
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
                  <button type="submit" disabled={isSaving} className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 text-sm active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                    {isSaving ? <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Plus className="w-3.5 h-3.5" />}
                    Create Payment
                  </button>
                </form>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by client, project, or notes…" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }} />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                {(['all', 'paid', 'pending', 'overdue'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={statusFilter === s ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#8A97A3' }}>{s}</button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-hidden" style={CARD}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                        {['Client / Project', 'Amount', 'Status', 'Due Date', 'Notes', ''].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((payment, idx) => {
                        const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
                        const sc = isOverdue ? statusConfig.overdue : statusConfig[payment.status];
                        const Ic = sc.icon;
                        return (
                          <tr key={payment._id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? 'rgba(58,141,222,0.025)' : 'transparent' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{payment.clientName || 'Unknown'}</p>
                              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8A97A3' }}><FolderKanban className="w-3 h-3" />{projects.find(pr => pr._id === payment.projectId)?.name ?? '—'}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-bold tabular-nums" style={{ color: '#1E2A32' }}>${payment.amount.toLocaleString()}</p>
                              <p className="text-xs" style={{ color: '#8A97A3' }}>{payment.currency}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                <Ic className="w-3 h-3" />{isOverdue ? 'Overdue' : sc.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm flex items-center gap-1.5" style={{ color: '#334155' }}><Calendar className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />{new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              {payment.paidDate && <p className="text-xs mt-0.5" style={{ color: '#10b981' }}>Paid {new Date(payment.paidDate).toLocaleDateString()}</p>}
                            </td>
                            <td className="px-5 py-4"><p className="text-xs max-w-[180px] truncate" style={{ color: '#8A97A3' }}>{payment.notes || '—'}</p></td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 justify-end">
                                {payment.status !== 'paid' && (
                                  <button onClick={() => quickMarkPaid(payment._id!)} className="text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95" style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }}>Mark Paid</button>
                                )}
                                <button onClick={() => openEdit(payment)} className="p-1.5 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}><Pencil className="w-3.5 h-3.5" /></button>
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
          </>
        )}

        {/* ── DEV PAYOUTS TAB ─────────────────────────────────────────────────── */}
        {tab === 'dev' && (
          <>
            <div className="flex justify-end">
              <button onClick={() => setShowDevCreateForm(!showDevCreateForm)}
                className="flex items-center gap-2 font-medium rounded-xl h-10 px-4 text-sm active:scale-95"
                style={showDevCreateForm ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' } : { background: '#3A8DDE', color: 'white' }}>
                {showDevCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Payout</>}
              </button>
            </div>

            {showDevCreateForm && (
              <div className="overflow-hidden" style={CARD}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Record Dev Payout</h2>
                </div>
                <form onSubmit={handleDevCreate} className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Project <span style={{ color: '#ef4444' }}>*</span></label>
                      <div className="relative">
                        <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                        <select value={devCreateForm.projectId} onChange={e => setDevCreateForm(p => ({ ...p, projectId: e.target.value }))} required className="w-full h-10 pl-9 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                          <option value="">— Select project —</option>
                          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Developer <span style={{ color: '#ef4444' }}>*</span></label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                        <select value={devCreateForm.devId} onChange={e => setDevCreateForm(p => ({ ...p, devId: e.target.value }))} required className="w-full h-10 pl-9 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                          <option value="">— Select developer —</option>
                          {devs.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Amount <span style={{ color: '#ef4444' }}>*</span></label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#8A97A3' }} />
                        <Input type="number" min="0" step="0.01" value={devCreateForm.amount} onChange={e => setDevCreateForm(p => ({ ...p, amount: e.target.value }))} className="pl-9 rounded-xl h-10 text-sm" style={inputStyle} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</label>
                      <div className="relative">
                        <select value={devCreateForm.status} onChange={e => setDevCreateForm(p => ({ ...p, status: e.target.value }))} className="w-full h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                          <option value="pending">Pending</option><option value="paid">Paid</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#8A97A3' }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Method</label>
                      <Input value={devCreateForm.paymentMethod} onChange={e => setDevCreateForm(p => ({ ...p, paymentMethod: e.target.value }))} placeholder="e.g. bank_transfer" className="rounded-xl h-10 text-sm" style={inputStyle} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Notes</label>
                      <Input value={devCreateForm.notes} onChange={e => setDevCreateForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional…" className="rounded-xl h-10 text-sm" style={inputStyle} />
                    </div>
                  </div>
                  <button type="submit" disabled={isSaving} className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 text-sm active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                    {isSaving ? <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Plus className="w-3.5 h-3.5" />}
                    Record Payout
                  </button>
                </form>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                <input type="text" value={devSearch} onChange={e => setDevSearch(e.target.value)} placeholder="Search by dev, project, or notes…" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }} />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                {(['all', 'paid', 'pending'] as const).map(s => (
                  <button key={s} onClick={() => setDevStatusFilter(s)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={devStatusFilter === s ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#8A97A3' }}>{s}</button>
                ))}
              </div>
            </div>

            {devLoading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              </div>
            ) : filteredDev.length > 0 ? (
              <div className="overflow-hidden" style={CARD}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                        {['Developer / Project', 'Amount', 'Status', 'Paid Date', 'Method / Notes', ''].map(h => (
                          <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDev.map((p, idx) => (
                        <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? 'rgba(58,141,222,0.025)' : 'transparent' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{p.devName || 'Unknown Dev'}</p>
                            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8A97A3' }}><FolderKanban className="w-3 h-3" />{projects.find(pr => pr._id === p.projectId)?.name ?? '—'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold tabular-nums" style={{ color: '#1E2A32' }}>${p.amount.toLocaleString()}</p>
                            <p className="text-xs" style={{ color: '#8A97A3' }}>{p.currency}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold"
                              style={p.status === 'paid'
                                ? { background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' }
                                : { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' }}>
                              {p.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {p.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {p.paidDate
                              ? <p className="text-sm" style={{ color: '#334155' }}>{new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              : <p className="text-xs" style={{ color: '#8A97A3' }}>—</p>}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-xs" style={{ color: '#5F6B76' }}>{p.paymentMethod || '—'}</p>
                            {p.notes && <p className="text-xs mt-0.5 max-w-[160px] truncate" style={{ color: '#8A97A3' }}>{p.notes}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              {p.status !== 'paid' && (
                                <button onClick={() => quickMarkDevPaid(p._id!)} className="text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95" style={{ background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' }}>Mark Paid</button>
                              )}
                              <button onClick={() => openDevEdit(p)} className="p-1.5 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}><Pencil className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState variant="payments" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

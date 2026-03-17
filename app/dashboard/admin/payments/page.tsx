'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Payment } from '@/lib/types';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, Plus,
  Search, ChevronDown, Pencil, Save, X, AlertCircle,
  DollarSign, Calendar, FolderKanban,
} from 'lucide-react';
import { Project, User } from '@/lib/types';

const statusConfig: Record<Payment['status'], { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: 'Paid', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  pending: { label: 'Pending', badge: 'bg-amber-500/15 text-amber-400', icon: Clock },
  overdue: { label: 'Overdue', badge: 'bg-red-500/15 text-red-400', icon: AlertTriangle },
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
  const [createForm, setCreateForm] = useState({
    projectId: '', clientId: '', clientName: '', amount: '', currency: 'USD', status: 'pending', notes: '', dueDate: '',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);

  useEffect(() => {
    fetchPayments();
    fetchProjectsAndClients();
  }, []);

  const fetchProjectsAndClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };
      const [projRes, clientRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/admin/clients', { headers }),
      ]);
      const [projResult, clientResult] = await Promise.all([projRes.json(), clientRes.json()]);
      if (projResult.success) setProjects(projResult.data);
      if (clientResult.success) setClients(clientResult.data);
    } catch { /* ignore */ }
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    if (!project) {
      setCreateForm(f => ({ ...f, projectId: '', clientName: '', clientId: '' }));
      return;
    }
    const client = clients.find(c => c._id === project.clientId);
    setCreateForm(f => ({
      ...f,
      projectId,
      clientName: client?.name ?? '',
      clientId: project.clientId,
    }));
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) setPayments(result.data);
    } catch {
      notify('error', 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const openEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setEditForm({
      amount: String(payment.amount),
      status: payment.status,
      paymentMethod: payment.paymentMethod || '',
      notes: payment.notes || '',
      dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
    });
  };

  const handleEditSave = async () => {
    if (!editingPayment) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/payments/${editingPayment._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          status: editForm.status,
          paymentMethod: editForm.paymentMethod || undefined,
          notes: editForm.notes || undefined,
          dueDate: editForm.dueDate,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPayments(prev => prev.map(p => p._id === editingPayment._id ? result.data : p));
        setEditingPayment(null);
        notify('success', 'Payment updated');
      } else {
        notify('error', result.error || 'Failed to update payment');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          amount: parseFloat(createForm.amount),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setPayments(prev => [result.data, ...prev]);
        setShowCreateForm(false);
        setCreateForm({ projectId: '', clientId: '', clientName: '', amount: '', currency: 'USD', status: 'pending', notes: '', dueDate: '' });
        notify('success', 'Payment created');
      } else {
        notify('error', result.error || 'Failed to create payment');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const quickMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'paid' }),
      });
      const result = await res.json();
      if (result.success) {
        setPayments(prev => prev.map(p => p._id === id ? result.data : p));
        notify('success', 'Marked as paid');
      }
    } catch {
      notify('error', 'Failed to update payment');
    }
  };

  const filtered = payments.filter(p => {
    const projectName = projects.find(pr => pr._id === p.projectId)?.name ?? '';
    const matchesSearch =
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    paid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0),
  };

  return (
    <div className="min-h-screen">
      {/* Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Edit Payment</h2>
              <button onClick={() => setEditingPayment(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.amount}
                      onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                      className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Status</label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full h-10 pl-3 pr-8 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Payment Method</label>
                  <Input
                    value={editForm.paymentMethod}
                    onChange={e => setEditForm(p => ({ ...p, paymentMethod: e.target.value }))}
                    placeholder="e.g. credit_card, bank_transfer"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Due Date</label>
                  <Input
                    type="date"
                    value={editForm.dueDate}
                    onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Notes</label>
                  <Input
                    value={editForm.notes}
                    onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 px-5"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
                <Button onClick={() => setEditingPayment(null)} className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-10 px-5">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payments</h1>
            <p className="text-sm text-slate-500 mt-1">{payments.length} total payment records</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 px-4">
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'New Payment'}
          </Button>
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

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { label: 'Collected', amount: totals.paid, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Pending', amount: totals.pending, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Overdue', amount: totals.overdue, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          ]).map(stat => (
            <Card key={stat.label} className={`${stat.bg} border ${stat.border} p-5`}>
              <p className="text-xs font-medium text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                ${stat.amount.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-white">Create Payment Record</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Project <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                    <select
                      value={createForm.projectId}
                      onChange={e => handleProjectSelect(e.target.value)}
                      required
                      className="w-full h-9 pl-9 pr-8 bg-slate-700/80 border border-slate-600 text-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="">— Select a project —</option>
                      {projects.map(p => {
                        const client = clients.find(c => c._id === p.clientId);
                        return (
                          <option key={p._id} value={p._id}>
                            {p.name}{client ? ` · ${client.name}` : ''}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                  {createForm.clientName && (
                    <p className="text-[11px] text-slate-500">Client: <span className="text-slate-400">{createForm.clientName}</span></p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Amount <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <Input type="number" min="0" step="0.01" value={createForm.amount} onChange={e => setCreateForm(p => ({ ...p, amount: e.target.value }))}
                      className="pl-9 bg-slate-700/80 border-slate-600 text-white rounded-xl h-9 text-sm" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Status</label>
                  <div className="relative">
                    <select value={createForm.status} onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full h-9 pl-3 pr-8 bg-slate-700/80 border border-slate-600 text-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Due Date <span className="text-red-400">*</span></label>
                  <Input type="date" value={createForm.dueDate} onChange={e => setCreateForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="bg-slate-700/80 border-slate-600 text-white rounded-xl h-9 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400">Notes</label>
                  <Input value={createForm.notes} onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional..."
                    className="bg-slate-700/80 border-slate-600 text-white rounded-xl h-9 text-sm" />
                </div>
              </div>
              <Button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-9 px-5 text-sm">
                {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create Payment
              </Button>
            </form>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by client, project, notes..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            {(['all', 'paid', 'pending', 'overdue'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client / Project</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filtered.map(payment => {
                    const sc = statusConfig[payment.status];
                    const StatusIcon = sc.icon;
                    const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();

                    return (
                      <tr key={payment._id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-white">{payment.clientName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <FolderKanban className="w-3 h-3" />
                            {projects.find(pr => pr._id === payment.projectId)?.name ?? payment.projectId.slice(0, 8) + '…'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-white">${payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">{payment.currency}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium ${isOverdue ? 'bg-red-500/15 text-red-400' : sc.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {isOverdue ? 'Overdue' : sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            {new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {payment.paidDate && (
                            <p className="text-xs text-emerald-500 mt-0.5">Paid {new Date(payment.paidDate).toLocaleDateString()}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-500 max-w-[180px] truncate">{payment.notes || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            {payment.status !== 'paid' && (
                              <Button
                                onClick={() => quickMarkPaid(payment._id!)}
                                className="bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-xs font-medium rounded-xl h-7 px-2.5 border border-emerald-500/20"
                              >
                                Mark Paid
                              </Button>
                            )}
                            <Button
                              onClick={() => openEdit(payment)}
                              className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-xl h-7 w-7 p-0 flex items-center justify-center"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No payments found</p>
            <p className="text-slate-600 text-sm">Create a payment record to get started</p>
          </Card>
        )}
      </div>
    </div>
  );
}

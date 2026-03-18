'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import {
  Users, X, Mail, Phone, Building2, Pencil, Search,
  Globe, CheckCircle2, Clock, XCircle, Save, AlertCircle,
  ChevronDown, FolderKanban,
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

const statusConfig = {
  approved: { label: 'Approved', color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0', icon: CheckCircle2, dot: '#6BCF7A' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: Clock,        dot: '#f59e0b' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fff1f2', border: '#fecaca', icon: XCircle,      dot: '#ef4444' },
};

const avatarGradients = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-violet-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
];

export default function AdminClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', company: '', businessName: '', website: '', about: '', status: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) setClients(result.data);
    } catch {
      notify('error', 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const openEdit = (client: User) => {
    setEditingClient(client);
    setEditForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      businessName: client.businessName || '',
      website: client.website || '',
      about: client.about || '',
      status: client.status || 'approved',
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${editingClient._id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      const result = await res.json();
      if (result.success) {
        setClients(prev => prev.map(c => c._id === editingClient._id ? result.data : c));
        setEditingClient(null);
        notify('success', 'Client updated successfully');
      } else {
        notify('error', result.error || 'Failed to update client');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: clients.length,
    approved: clients.filter(c => c.status === 'approved').length,
    pending: clients.filter(c => c.status === 'pending').length,
    rejected: clients.filter(c => c.status === 'rejected').length,
  };

  const inputStyle = {
    background: 'rgba(58,141,222,0.06)',
    border: '1px solid #DDE5EC',
    color: '#1E2A32',
    borderRadius: '12px',
  };

  return (
    <div className="min-h-screen animate-fade-up">
      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Edit Client</h2>
                <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>{editingClient.name}</p>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#8A97A3' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Full Name</label>
                  <Input
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="rounded-xl h-10 text-sm"
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className="pl-10 rounded-xl h-10 text-sm"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input
                      value={editForm.phone}
                      onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      className="pl-10 rounded-xl h-10 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input
                      value={editForm.company}
                      onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))}
                      className="pl-10 rounded-xl h-10 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Business Name</label>
                  <Input
                    value={editForm.businessName}
                    onChange={e => setEditForm(p => ({ ...p, businessName: e.target.value }))}
                    className="rounded-xl h-10 text-sm"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Status</label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none"
                      style={{ ...inputStyle, color: '#334155' }}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input
                      type="url"
                      value={editForm.website}
                      onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="pl-10 rounded-xl h-10 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>About</label>
                  <textarea
                    value={editForm.about}
                    onChange={e => setEditForm(p => ({ ...p, about: e.target.value }))}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none"
                    style={{ ...inputStyle, color: '#334155' }}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 text-sm font-semibold rounded-xl h-10 px-5 transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: '#3A8DDE', color: 'white' }}
                >
                  {isSaving
                    ? <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Saving…</>
                    : <><Save className="w-4 h-4" /> Save Changes</>
                  }
                </button>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="text-sm font-medium rounded-xl h-10 px-5 transition-all duration-150 active:scale-95"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PageHeader
        title="Clients"
        subtitle={`${clients.length} registered clients`}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Clients' }]}
        heroStrip
      />

      <div className="p-8 space-y-5">
        {/* Notification toast */}
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl text-sm"
            style={notification.type === 'success'
              ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}
          >
            {notification.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {notification.message}
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search clients…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
            {(['all', 'approved', 'pending', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={statusFilter === s
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#8A97A3' }}
              >
                {s} <span className="ml-1 tabular-nums" style={{ opacity: statusFilter === s ? 0.8 : 0.5 }}>{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client, idx) => {
              const sc = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <div
                  key={client._id}
                  className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                  style={CARD}
                >
                  <div className="p-5">
                    {/* Avatar + name row */}
                    <div className="flex items-start gap-3.5 mb-4">
                      {client.profilePicture ? (
                        <img
                          src={client.profilePicture}
                          alt={client.name}
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                          style={{ border: '2px solid #DDE5EC' }}
                        />
                      ) : (
                        <div className={`w-11 h-11 bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <span className="text-base font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold truncate leading-tight" style={{ color: '#1E2A32' }}>{client.name}</h3>
                            {client.businessName && (
                              <p className="text-xs truncate mt-0.5" style={{ color: '#8A97A3' }}>{client.businessName}</p>
                            )}
                          </div>
                          <span
                            className="inline-flex items-center gap-1 flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold"
                            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                          >
                            <StatusIcon className="w-2.5 h-2.5" />
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2.5 text-xs">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                        <span className="truncate" style={{ color: '#334155' }}>{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                          <span style={{ color: '#334155' }}>{client.phone}</span>
                        </div>
                      )}
                      {(client.company || client.businessName) && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                          <span className="truncate" style={{ color: '#334155' }}>{client.company || client.businessName}</span>
                        </div>
                      )}
                      {client.website && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate transition-colors"
                            style={{ color: '#3A8DDE' }}
                          >
                            {client.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    {client.about && (
                      <p className="text-xs rounded-lg px-3 py-2 mb-4 line-clamp-2 leading-relaxed" style={{ color: '#5F6B76', background: 'rgba(58,141,222,0.06)', border: '1px solid #f1f5f9' }}>{client.about}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => openEdit(client)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl h-8 transition-all duration-150 active:scale-95"
                        style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => window.location.href = `/dashboard/admin/projects?clientId=${client._id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl h-8 transition-all duration-150 active:scale-95"
                        style={{ background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }}
                      >
                        <FolderKanban className="w-3 h-3" /> Projects
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState variant="clients" />
        )}
      </div>
    </div>
  );
}

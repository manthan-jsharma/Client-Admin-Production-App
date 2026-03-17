'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import {
  Users, Plus, X, Mail, Phone, Building2, Pencil, Search,
  Globe, CheckCircle2, Clock, XCircle, Save, AlertCircle,
  ChevronDown, FolderKanban,
} from 'lucide-react';

const statusConfig = {
  approved: { label: 'Approved', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  pending: { label: 'Pending', badge: 'bg-amber-500/15 text-amber-400', icon: Clock },
  rejected: { label: 'Rejected', badge: 'bg-red-500/15 text-red-400', icon: XCircle },
};

const avatarGradients = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
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

  // Edit modal state
  const [editingClient, setEditingClient] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', company: '', businessName: '', website: '', about: '', status: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
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

  return (
    <div className="min-h-screen">
      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Edit Client</h2>
              <button onClick={() => setEditingClient(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Full Name</label>
                  <Input
                    value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={editForm.phone}
                      onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      value={editForm.company}
                      onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))}
                      className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Business Name</label>
                  <Input
                    value={editForm.businessName}
                    onChange={e => setEditForm(p => ({ ...p, businessName: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Account Status</label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full h-10 pl-3 pr-8 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="url"
                      value={editForm.website}
                      onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">About</label>
                  <textarea
                    value={editForm.about}
                    onChange={e => setEditForm(p => ({ ...p, about: e.target.value }))}
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 px-5"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
                <Button type="button" onClick={() => setEditingClient(null)} className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-10 px-5">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Clients</h1>
            <p className="text-sm text-slate-500 mt-1">{clients.length} registered clients</p>
          </div>
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

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            {(['all', 'approved', 'pending', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {s} <span className="ml-1 opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client, idx) => {
              const sc = statusConfig[client.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              return (
                <Card key={client._id} className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200">
                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      {client.profilePicture ? (
                        <img src={client.profilePicture} alt={client.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                          <span className="text-base font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{client.name}</h3>
                        {client.businessName && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{client.businessName}</p>
                        )}
                        <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.badge}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {sc.label}
                        </span>
                      </div>
                      {client.addedByAdmin && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-md font-medium flex-shrink-0">Manual</span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        <span className="text-slate-400 truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          <span className="text-slate-400">{client.phone}</span>
                        </div>
                      )}
                      {(client.company || client.businessName) && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          <span className="text-slate-400">{client.company || client.businessName}</span>
                        </div>
                      )}
                      {client.website && (
                        <div className="flex items-center gap-2.5 text-xs">
                          <Globe className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate transition-colors">
                            {client.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    {client.about && (
                      <p className="text-xs text-slate-500 border-t border-slate-700/50 pt-3 mb-4 line-clamp-2">{client.about}</p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                      <Button
                        onClick={() => openEdit(client)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        onClick={() => window.location.href = `/dashboard/admin/projects?clientId=${client._id}`}
                        className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5 border border-blue-500/20"
                      >
                        <FolderKanban className="w-3 h-3" /> Projects
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {searchQuery ? 'No clients match your search' : 'No clients found'}
            </p>
            <p className="text-slate-600 text-sm">Try a different filter or search term</p>
          </Card>
        )}
      </div>
    </div>
  );
}

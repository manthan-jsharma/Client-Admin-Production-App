'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Service } from '@/lib/types';
import { FileUploadField } from '@/components/ui/file-upload-field';
import {
  Package, Plus, X, Pencil, Trash2, Save, AlertCircle,
  CheckCircle2, DollarSign, Tag, ToggleLeft, ToggleRight,
  Search, ChevronDown, Sparkles,
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

const CATEGORIES = ['Marketing', 'Technical', 'Design', 'Content', 'Analytics', 'Consulting', 'Other'];
const emptyForm = { name: '', description: '', price: '', currency: 'USD', category: '', features: [''], isActive: true, imageS3Key: '' };

const CATEGORY_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Marketing:  { color: '#3A8DDE', bg: '#eff8ff',  border: '#c8dff0' },
  Technical:  { color: '#10b981', bg: '#ecfdf5',  border: '#a7f3d0' },
  Design:     { color: '#8b5cf6', bg: '#f5f3ff',  border: '#ddd6fe' },
  Content:    { color: '#f59e0b', bg: '#fffbeb',  border: '#fde68a' },
  Analytics:  { color: '#06b6d4', bg: '#ecfeff',  border: '#a5f3fc' },
  Consulting: { color: '#f97316', bg: '#fff7ed',  border: '#fed7aa' },
  Other:      { color: '#8A97A3', bg: 'rgba(58,141,222,0.06)',  border: '#DDE5EC' },
};

const inputStyle = {
  background: 'rgba(58,141,222,0.06)',
  border: '1px solid #DDE5EC',
  color: '#334155',
  borderRadius: '12px',
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
      const result = await res.json();
      if (result.success) setServices(result.data);
    } catch { notify('error', 'Failed to load services'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 4000); };

  const openCreate = () => { setEditingService(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name, description: service.description, price: String(service.price), currency: service.currency, category: service.category, features: service.features.length > 0 ? service.features : [''], isActive: service.isActive, imageS3Key: service.imageS3Key || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), features: form.features.filter(f => f.trim()), imageS3Key: form.imageS3Key || undefined };
      const url = editingService ? `/api/admin/services/${editingService._id}` : '/api/admin/services';
      const method = editingService ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (result.success) {
        if (editingService) { setServices(prev => prev.map(s => s._id === editingService._id ? result.data : s)); notify('success', 'Service updated'); }
        else { setServices(prev => [result.data, ...prev]); notify('success', 'Service created'); }
        setShowForm(false);
      } else notify('error', result.error || 'Failed to save');
    } catch { notify('error', 'Network error'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
      const result = await res.json();
      if (result.success) { setServices(prev => prev.filter(s => s._id !== id)); notify('success', 'Service deleted'); }
    } catch { notify('error', 'Failed to delete'); }
    finally { setDeleteConfirm(null); }
  };

  const toggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/admin/services/${service._id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !service.isActive }) });
      const result = await res.json();
      if (result.success) setServices(prev => prev.map(s => s._id === service._id ? result.data : s));
    } catch { notify('error', 'Failed to update'); }
  };

  const addFeature = () => setForm(p => ({ ...p, features: [...p.features, ''] }));
  const updateFeature = (i: number, val: string) => setForm(p => ({ ...p, features: p.features.map((f, idx) => idx === i ? val : f) }));
  const removeFeature = (i: number) => setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

  const allCategories = ['all', ...CATEGORIES];
  const filtered = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen animate-fade-up">
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{editingService ? 'Edit Service' : 'New Service'}</h2>
                <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>{editingService ? 'Update service details' : 'Add a new service to your catalog'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#8A97A3' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Service Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. SEO Optimization Package" className="rounded-xl h-10" style={inputStyle} required />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe what this service includes…" className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none" style={inputStyle} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Price <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" className="pl-10 rounded-xl h-10" style={inputStyle} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Currency</label>
                  <div className="relative">
                    <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className="w-full h-10 pl-3 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle}>
                      {['USD', 'EUR', 'GBP', 'CAD'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full h-10 pl-9 pr-8 rounded-xl text-sm appearance-none focus:outline-none" style={inputStyle} required>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#8A97A3' }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FileUploadField label="Service Image" value={form.imageS3Key} onChange={url => setForm(p => ({ ...p, imageS3Key: url }))} folder="services" accept="image/*" maxSizeMB={5} hint="JPEG, PNG, or WebP" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Features</label>
                    <button type="button" onClick={addFeature} className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#3A8DDE' }}>
                      <Plus className="w-3 h-3" /> Add feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input value={f} onChange={e => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} className="rounded-xl h-9 text-sm" style={inputStyle} />
                        {form.features.length > 1 && (
                          <button type="button" onClick={() => removeFeature(i)} className="p-1.5 rounded-lg transition-colors flex-shrink-0" style={{ color: '#8A97A3' }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className="flex items-center gap-2.5 text-sm">
                    {form.isActive
                      ? <ToggleRight className="w-8 h-8" style={{ color: '#10b981' }} />
                      : <ToggleLeft className="w-8 h-8" style={{ color: '#8A97A3' }} />}
                    <span style={{ color: form.isActive ? '#10b981' : '#8A97A3', fontWeight: form.isActive ? 500 : 400 }}>
                      {form.isActive ? 'Active — visible to clients' : 'Inactive — hidden from clients'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 font-semibold rounded-xl h-10 px-5 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50" style={{ background: '#3A8DDE', color: 'white' }}>
                  {isSaving ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Save className="w-4 h-4" />}
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="font-medium rounded-xl h-10 px-5 text-sm transition-all duration-150 active:scale-95" style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="p-6 w-full max-w-sm" style={{ background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fff1f2' }}>
              <Trash2 className="w-6 h-6" style={{ color: '#ef4444' }} />
            </div>
            <h3 className="text-base font-semibold text-center mb-1" style={{ color: '#1E2A32' }}>Delete Service?</h3>
            <p className="text-sm text-center mb-5" style={{ color: '#8A97A3' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 font-semibold rounded-xl h-10 text-sm transition-all duration-150 active:scale-95" style={{ background: '#ef4444', color: 'white' }}>Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 font-medium rounded-xl h-10 text-sm transition-all duration-150 active:scale-95" style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Services Catalog"
        subtitle={`${services.filter(s => s.isActive).length} active · ${services.length} total`}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Services' }]}
        heroStrip
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 font-semibold rounded-xl h-10 px-4 text-sm transition-all duration-150 active:scale-95" style={{ background: '#3A8DDE', color: 'white' }}>
            <Plus className="w-4 h-4" /> New Service
          </button>
        }
      />

      <div className="p-8 space-y-5">
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search services…" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }} />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
            {allCategories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all capitalize"
                style={categoryFilter === cat
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#8A97A3' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading services…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(service => {
              const catStyle = CATEGORY_STYLES[service.category] || CATEGORY_STYLES.Other;
              return (
                <div
                  key={service._id}
                  className="overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
                  style={{ ...CARD, opacity: service.isActive ? 1 : 0.6 }}
                >
                  {/* Image */}
                  <div className="h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'rgba(58,141,222,0.06)' }}>
                    {service.imageS3Key ? (
                      <img src={service.imageS3Key} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: catStyle.bg, border: `1px solid ${catStyle.border}` }}>
                        <Package className="w-6 h-6" style={{ color: catStyle.color }} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}` }}
                      >
                        {service.category}
                      </span>
                    </div>
                    {!service.isActive && (
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC' }}>Inactive</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-bold leading-snug flex-1" style={{ color: '#1E2A32' }}>{service.name}</h3>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold tabular-nums" style={{ color: '#1E2A32' }}>${service.price.toLocaleString()}</p>
                        <p className="text-[10px]" style={{ color: '#8A97A3' }}>{service.currency}/mo</p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed mb-4 line-clamp-2 flex-1" style={{ color: '#5F6B76' }}>{service.description}</p>

                    {service.features.length > 0 && (
                      <ul className="space-y-1 mb-4">
                        {service.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs" style={{ color: '#5F6B76' }}>
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#10b981' }} /> {f}
                          </li>
                        ))}
                        {service.features.length > 3 && <li className="text-xs pl-5" style={{ color: '#8A97A3' }}>+{service.features.length - 3} more</li>}
                      </ul>
                    )}

                    <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => toggleActive(service)} className="p-1.5 rounded-lg transition-colors" title={service.isActive ? 'Deactivate' : 'Activate'}>
                        {service.isActive
                          ? <ToggleRight className="w-5 h-5" style={{ color: '#10b981' }} />
                          : <ToggleLeft className="w-5 h-5" style={{ color: '#8A97A3' }} />}
                      </button>
                      <button onClick={() => openEdit(service)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl h-8 transition-all duration-150 active:scale-95" style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}>
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(service._id!)} className="flex items-center justify-center text-xs font-medium rounded-xl h-8 w-8 transition-all duration-150 active:scale-95" style={{ background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState variant="generic" />
        )}
      </div>
    </div>
  );
}

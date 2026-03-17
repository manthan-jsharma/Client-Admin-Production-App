'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Service } from '@/lib/types';
import {
  Package, Plus, X, Pencil, Trash2, Save, AlertCircle,
  CheckCircle2, DollarSign, Tag, ToggleLeft, ToggleRight,
  Search, ChevronDown,
} from 'lucide-react';

const CATEGORIES = ['Marketing', 'Technical', 'Design', 'Content', 'Analytics', 'Consulting', 'Other'];

const emptyForm = {
  name: '', description: '', price: '', currency: 'USD', category: '',
  features: [''], isActive: true, imageS3Key: '',
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

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) setServices(result.data);
    } catch {
      notify('error', 'Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const openCreate = () => {
    setEditingService(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      currency: service.currency,
      category: service.category,
      features: service.features.length > 0 ? service.features : [''],
      isActive: service.isActive,
      imageS3Key: service.imageS3Key || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        features: form.features.filter(f => f.trim()),
        imageS3Key: form.imageS3Key || undefined,
      };

      const url = editingService ? `/api/admin/services/${editingService._id}` : '/api/admin/services';
      const method = editingService ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        if (editingService) {
          setServices(prev => prev.map(s => s._id === editingService._id ? result.data : s));
          notify('success', 'Service updated');
        } else {
          setServices(prev => [result.data, ...prev]);
          notify('success', 'Service created');
        }
        setShowForm(false);
      } else {
        notify('error', result.error || 'Failed to save service');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) {
        setServices(prev => prev.filter(s => s._id !== id));
        notify('success', 'Service deleted');
      }
    } catch {
      notify('error', 'Failed to delete service');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const res = await fetch(`/api/admin/services/${service._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const result = await res.json();
      if (result.success) setServices(prev => prev.map(s => s._id === service._id ? result.data : s));
    } catch {
      notify('error', 'Failed to update service');
    }
  };

  const addFeature = () => setForm(p => ({ ...p, features: [...p.features, ''] }));
  const updateFeature = (i: number, val: string) =>
    setForm(p => ({ ...p, features: p.features.map((f, idx) => idx === i ? val : f) }));
  const removeFeature = (i: number) =>
    setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

  const allCategories = ['all', ...CATEGORIES];
  const filtered = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">
                {editingService ? 'Edit Service' : 'New Service'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Service Name <span className="text-red-400">*</span></label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. SEO Optimization Package"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe what this service includes..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Price <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="0.00"
                      className="pl-10 bg-slate-800 border-slate-700 text-white rounded-xl h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Currency</label>
                  <div className="relative">
                    <select
                      value={form.currency}
                      onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                      className="w-full h-10 pl-3 pr-8 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Category <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full h-10 pl-9 pr-8 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      required
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Image S3 Key</label>
                  <Input
                    value={form.imageS3Key}
                    onChange={e => setForm(p => ({ ...p, imageS3Key: e.target.value }))}
                    placeholder="services/image-name.jpg"
                    className="bg-slate-800 border-slate-700 text-white rounded-xl h-10 text-xs font-mono"
                  />
                  <p className="text-xs text-slate-600">S3 key for the service image (connect AWS S3 later)</p>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Features</label>
                    <button type="button" onClick={addFeature} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={f}
                          onChange={e => updateFeature(i, e.target.value)}
                          placeholder={`Feature ${i + 1}`}
                          className="bg-slate-800 border-slate-700 text-white rounded-xl h-9 text-sm"
                        />
                        {form.features.length > 1 && (
                          <button type="button" onClick={() => removeFeature(i)} className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))} className="flex items-center gap-2 text-sm">
                    {form.isActive ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-500" />
                    )}
                    <span className={form.isActive ? 'text-emerald-400' : 'text-slate-500'}>
                      {form.isActive ? 'Active — visible to clients' : 'Inactive — hidden from clients'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 px-5">
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingService ? 'Save Changes' : 'Create Service'}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-10 px-5">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Delete Service?</h3>
            <p className="text-sm text-slate-400 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl h-9 text-sm">Delete</Button>
              <Button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-9 text-sm">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Services Catalog</h1>
            <p className="text-sm text-slate-500 mt-1">
              {services.filter(s => s.isActive).length} active · {services.length} total services
            </p>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 px-4 shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> New Service
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-x-auto">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                  categoryFilter === cat ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(service => (
              <Card key={service._id} className={`border transition-all duration-200 ${
                service.isActive ? 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600' : 'bg-slate-800/30 border-slate-700/30 opacity-60'
              }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-full font-medium">
                          {service.category}
                        </span>
                        {!service.isActive && (
                          <span className="text-[10px] px-2 py-0.5 bg-slate-700 text-slate-500 rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{service.name}</h3>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-lg font-bold text-white">${service.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{service.currency}/mo</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{service.description}</p>

                  {service.features.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {service.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-xs text-slate-600 pl-5">+{service.features.length - 3} more</li>
                      )}
                    </ul>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-700/50">
                    <button
                      onClick={() => toggleActive(service)}
                      className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                      title={service.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {service.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <Button onClick={() => openEdit(service)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    <Button onClick={() => setDeleteConfirm(service._id!)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-xl h-8 w-8 flex items-center justify-center border border-red-500/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No services found</p>
            <p className="text-slate-600 text-sm mb-5">Create your first service offering</p>
            <Button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl h-9 px-4">
              <Plus className="w-4 h-4" /> New Service
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

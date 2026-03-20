'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project, User } from '@/lib/types';
import { FileUploadField } from '@/components/ui/file-upload-field';
import {
  FolderKanban, Plus, X, Calendar, User2, Search,
  Brain, Film, DollarSign, ChevronRight, AlertCircle,
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

const TYPE_STYLES = {
  ai_saas: { label: 'AI SaaS', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', accentFrom: '#8b5cf6', accentTo: '#3A8DDE', icon: Brain },
  content_distribution: { label: 'Content Dist.', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', accentFrom: '#f59e0b', accentTo: '#f97316', icon: Film },
};

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  active:    { color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0' },
  completed: { color: '#3A8DDE', bg: '#eff8ff', border: '#c8dff0' },
  planning:  { color: '#8A97A3', bg: 'rgba(58,141,222,0.06)', border: '#DDE5EC' },
  'on-hold': { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSupportAdmin = user?.role === 'support_admin';
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ai_saas' | 'content_distribution'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '', description: '', clientId: '',
    type: 'ai_saas' as 'ai_saas' | 'content_distribution',
    totalPrice: '', contractPDF: '', scopePDF: '',
    startDate: '', endDate: '', status: 'planning',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, clientRes] = await Promise.all([
          fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const projResult = await projRes.json();
        const clientResult = await clientRes.json();
        if (projResult.success) setProjects(projResult.data);
        if (clientResult.success) setClients(clientResult.data.filter((c: User) => c.status === 'approved'));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          totalPrice: formData.totalPrice ? Number(formData.totalPrice) : undefined,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setProjects(prev => [...prev, result.data]);
        setShowCreateForm(false);
        setFormData({ name: '', description: '', clientId: '', type: 'ai_saas', totalPrice: '', contractPDF: '', scopePDF: '', startDate: '', endDate: '', status: 'planning' });
        router.push(`/dashboard/admin/projects/${result.data._id}`);
      } else {
        setFormError(result.error || 'Failed to create project');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const inputStyle = { background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155', borderRadius: '12px' };

  return (
    <div className="min-h-screen animate-fade-up">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} total projects`}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Projects' }]}
        heroStrip
        actions={
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 text-sm font-semibold rounded-xl h-9 px-4 transition-all duration-150 active:scale-95"
            style={showCreateForm
              ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }
              : { background: '#3A8DDE', color: 'white' }}
          >
            {showCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Project</>}
          </button>
        }
      />

      <div className="p-8 space-y-5">
        {/* Create Form */}
        {showCreateForm && (
          <div className="overflow-hidden" style={CARD}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafcff' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>New Project</h2>
                <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Fill in the details below to create a project</p>
                {isSupportAdmin && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' }}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Confirm with your admin that you will be creating a new project for a client
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3" style={{ color: '#ef4444', background: '#fff1f2', border: '1px solid #fecaca' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Type selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Project Type <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ai_saas', 'content_distribution'] as const).map(t => {
                    const ts = TYPE_STYLES[t];
                    const Icon = ts.icon;
                    const selected = formData.type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, type: t }))}
                        className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                        style={selected
                          ? { border: `1px solid ${ts.border}`, background: ts.bg }
                          : { border: '1px solid #DDE5EC', background: '#ffffff' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: ts.bg }}>
                          <Icon className="w-4 h-4" style={{ color: ts.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{ts.label}</p>
                          <p className="text-[11px]" style={{ color: '#8A97A3' }}>
                            {t === 'ai_saas' ? '14-day roadmap + deliveries' : '7-day scope + AI clone'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Project Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. SaaS Dashboard Build"
                    className="rounded-xl h-10 text-sm"
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Client <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    value={formData.clientId}
                    onChange={e => setFormData(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl focus:outline-none text-sm"
                    style={inputStyle}
                    required
                  >
                    <option value="">Select a client…</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Description <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the project scope and goals…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm resize-none focus:outline-none"
                  style={inputStyle}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Total Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                    <Input
                      type="number"
                      value={formData.totalPrice}
                      onChange={e => setFormData(f => ({ ...f, totalPrice: e.target.value }))}
                      placeholder="0"
                      className="pl-8 rounded-xl h-10 text-sm"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                    className="rounded-xl h-10 text-sm"
                    style={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>End Date <span style={{ color: '#ef4444' }}>*</span></label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                    className="rounded-xl h-10 text-sm"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadField
                  label="Contract PDF"
                  value={formData.contractPDF}
                  onChange={url => setFormData(f => ({ ...f, contractPDF: url }))}
                  folder="contracts" accept=".pdf,application/pdf" maxSizeMB={20} hint="PDF"
                />
                <FileUploadField
                  label="Scope PDF"
                  value={formData.scopePDF}
                  onChange={url => setFormData(f => ({ ...f, scopePDF: url }))}
                  folder="contracts" accept=".pdf,application/pdf" maxSizeMB={20} hint="PDF"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-sm font-semibold rounded-xl px-6 h-10 transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: '#3A8DDE', color: 'white' }}
                >
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Creating…</>
                  ) : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-sm font-medium rounded-xl px-6 h-10 transition-all duration-150 active:scale-95"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
            {(['all', 'ai_saas', 'content_distribution'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={typeFilter === t
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#8A97A3' }}
              >
                {t === 'all' ? 'All' : t === 'ai_saas' ? 'AI SaaS' : 'Content'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(project => {
              const ts = TYPE_STYLES[project.type] ?? TYPE_STYLES.ai_saas;
              const Icon = ts.icon;
              const statusStyle = STATUS_STYLES[project.status] ?? STATUS_STYLES.planning;
              const clientName = clients.find(c => c._id === project.clientId)?.name ?? '—';
              const completedDays = project.roadmap?.filter(r => r.completed).length ?? 0;
              const totalDays = project.roadmap?.length ?? 0;
              const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

              return (
                <div
                  key={project._id}
                  className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
                  style={CARD}
                  onClick={() => router.push(`/dashboard/admin/projects/${project._id}`)}
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${ts.accentFrom}, ${ts.accentTo})` }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ts.bg }}>
                        <Icon className="w-4 h-4" style={{ color: ts.color }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}
                        >
                          {ts.label}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}
                        >
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold mb-1 leading-snug" style={{ color: '#1E2A32' }}>{project.name}</h3>
                    <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: '#8A97A3' }}>{project.description}</p>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-xs">
                        <User2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                        <span style={{ color: '#334155' }}>{clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                        <span style={{ color: '#8A97A3' }}>
                          {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {project.totalPrice && (
                        <div className="flex items-center gap-2 text-xs">
                          <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                          <span className="font-medium" style={{ color: '#334155' }}>${project.totalPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {project.type === 'ai_saas' && totalDays > 0 && (
                      <div className="mb-4 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[11px]" style={{ color: '#8A97A3' }}>Roadmap</span>
                          <span className="text-[11px] font-semibold tabular-nums" style={{ color: '#1E2A32' }}>{progress}%</span>
                        </div>
                        <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#f1f5f9' }}>
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                      <span className="text-[11px]" style={{ color: '#8A97A3' }}>
                        {project.type === 'ai_saas' ? `${completedDays}/${totalDays} days` : '7-day scope'}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: '#8A97A3' }}>
                        Manage <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState variant="projects" />
        )}
      </div>
    </div>
  );
}

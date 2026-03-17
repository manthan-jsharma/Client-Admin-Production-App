'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project, User } from '@/lib/types';
import { FileUploadField } from '@/components/ui/file-upload-field';
import {
  FolderKanban, Plus, X, Calendar, User2, Search,
  ExternalLink, Brain, Film, DollarSign, ChevronRight,
} from 'lucide-react';

const TYPE_STYLES = {
  ai_saas: { label: 'AI SaaS', bg: 'bg-violet-500/15', text: 'text-violet-400', icon: Brain },
  content_distribution: { label: 'Content Distribution', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Film },
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-blue-500/15 text-blue-400',
  planning: 'bg-slate-600/50 text-slate-400',
  'on-hold': 'bg-amber-500/15 text-amber-400',
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ai_saas' | 'content_distribution'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    type: 'ai_saas' as 'ai_saas' | 'content_distribution',
    totalPrice: '',
    contractPDF: '',
    scopePDF: '',
    startDate: '',
    endDate: '',
    status: 'planning',
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
        if (clientResult.success) {
          setClients(clientResult.data.filter((c: User) => c.status === 'approved'));
        }
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-500 mt-1">{projects.length} total projects</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
              showCreateForm
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {showCreateForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Project</>}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-base font-semibold text-white">Create New Project</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {formError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{formError}</p>
              )}

              {/* Division Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Project Division <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ai_saas', 'content_distribution'] as const).map(t => {
                    const ts = TYPE_STYLES[t];
                    const Icon = ts.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, type: t }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                          formData.type === t
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ts.bg}`}>
                          <Icon className={`w-4.5 h-4.5 ${ts.text}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{ts.label}</p>
                          <p className="text-[11px] text-slate-500">
                            {t === 'ai_saas' ? '14-day roadmap + deliveries' : '7-day scope + AI clone'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Project Name <span className="text-red-400">*</span></label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. SaaS Dashboard Build"
                    className="bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Client <span className="text-red-400">*</span></label>
                  <select
                    value={formData.clientId}
                    onChange={e => setFormData(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full h-10 px-3 bg-slate-700/80 border border-slate-600 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="">Select a client...</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the project scope and goals..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700/80 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Total Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="number"
                      value={formData.totalPrice}
                      onChange={e => setFormData(f => ({ ...f, totalPrice: e.target.value }))}
                      placeholder="0"
                      className="pl-8 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Start Date <span className="text-red-400">*</span></label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                    className="bg-slate-700/80 border-slate-600 text-white focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">End Date <span className="text-red-400">*</span></label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                    className="bg-slate-700/80 border-slate-600 text-white focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FileUploadField
                  label="Contract PDF"
                  value={formData.contractPDF}
                  onChange={url => setFormData(f => ({ ...f, contractPDF: url }))}
                  folder="contracts"
                  accept=".pdf,application/pdf"
                  maxSizeMB={20}
                  hint="PDF"
                />
                <FileUploadField
                  label="Scope PDF"
                  value={formData.scopePDF}
                  onChange={url => setFormData(f => ({ ...f, scopePDF: url }))}
                  folder="contracts"
                  accept=".pdf,application/pdf"
                  maxSizeMB={20}
                  hint="PDF"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20 disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl px-6 h-10"
                >
                  Cancel
                </Button>
              </div>
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
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl">
            {(['all', 'ai_saas', 'content_distribution'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                  typeFilter === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {t === 'all' ? 'All' : t === 'ai_saas' ? 'AI SaaS' : 'Content Dist.'}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(project => {
              const ts = TYPE_STYLES[project.type] ?? TYPE_STYLES.ai_saas;
              const Icon = ts.icon;
              const clientName = clients.find(c => c._id === project.clientId)?.name ?? project.clientId;
              const completedDays = project.roadmap?.filter(r => r.completed).length ?? 0;
              const totalDays = project.roadmap?.length ?? 0;
              const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

              return (
                <Card
                  key={project._id}
                  className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200 group cursor-pointer"
                  onClick={() => router.push(`/dashboard/admin/projects/${project._id}`)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 ${ts.bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${ts.text}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${ts.bg} ${ts.text}`}>
                          {ts.label}
                        </span>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[project.status] ?? 'bg-slate-700 text-slate-400'}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1.5">{project.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{project.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User2 className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-slate-300">{clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                      {project.totalPrice && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-slate-300">${project.totalPrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {project.type === 'ai_saas' && totalDays > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs text-slate-500">Roadmap Progress</span>
                          <span className="text-xs font-medium text-blue-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <span className="text-xs text-slate-500">
                        {project.type === 'ai_saas'
                          ? `${completedDays}/${totalDays} days complete`
                          : '7-day scope'
                        }
                      </span>
                      <span className="flex items-center gap-1 text-xs text-blue-400 font-medium group-hover:gap-2 transition-all">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {searchQuery ? 'No projects match your search' : 'No projects yet'}
            </p>
            <p className="text-slate-600 text-sm">
              {searchQuery ? 'Try a different search term' : 'Click "New Project" to get started'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

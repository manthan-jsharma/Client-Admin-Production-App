'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { Project, Delivery, SetupItem } from '@/lib/types';
import {
  ArrowLeft, Brain, Film, Calendar, DollarSign, User2,
  CheckCircle2, Clock, Circle, Video, Plus, Save, Trash2,
  FileText, Github, ExternalLink, AlertCircle, Check, X,
  ChevronDown, ChevronUp, Package, Settings2, RefreshCw, Pencil,
} from 'lucide-react';

type Tab = 'overview' | 'roadmap' | 'deliveries' | 'content' | 'setup';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-600/50 text-slate-400',
  submitted: 'bg-blue-500/15 text-blue-400',
  client_reviewing: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  revision_requested: 'bg-red-500/15 text-red-400',
};

const REVIEW_COLORS: Record<string, string> = {
  pending_review: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  revision_requested: 'bg-red-500/15 text-red-400',
};

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const [project, setProject] = useState<Project | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Roadmap editing state — per day
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayForm, setDayForm] = useState({ title: '', description: '', videoUrl: '', adminNotes: '', completed: false });
  const [savingDay, setSavingDay] = useState(false);

  // Delivery form
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ title: '', description: '', deliveryNumber: '', proofS3Key: '', adminNotes: '' });
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Overview edit state
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({ name: '', description: '', status: '', totalPrice: '', contractPDF: '', scopePDF: '', proofOfCodeS3Key: '', startDate: '', endDate: '' });
  const [savingOverview, setSavingOverview] = useState(false);

  // Content (Div B) review state
  const [contentForm, setContentForm] = useState({
    hdPhotoStatus: '', hdPhotoAdminFeedback: '',
    teamSelfieVideoStatus: '', teamSelfieVideoAdminFeedback: '',
    aiCloneSampleS3Key: '',
  });
  const [savingContent, setSavingContent] = useState(false);

  // Setup items state
  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [initializingSetup, setInitializingSetup] = useState(false);
  const [initializingRoadmap, setInitializingRoadmap] = useState(false);
  const [newSetupTitle, setNewSetupTitle] = useState('');
  const [addingSetupItem, setAddingSetupItem] = useState(false);
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);
  const [editSetupForm, setEditSetupForm] = useState({ title: '', value: '' });

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
        setOverviewForm({
          name: result.data.name,
          description: result.data.description,
          status: result.data.status,
          totalPrice: result.data.totalPrice?.toString() ?? '',
          contractPDF: result.data.contractPDF ?? '',
          scopePDF: result.data.scopePDF ?? '',
          proofOfCodeS3Key: result.data.proofOfCodeS3Key ?? '',
          startDate: new Date(result.data.startDate).toISOString().split('T')[0],
          endDate: new Date(result.data.endDate).toISOString().split('T')[0],
        });
        setContentForm({
          hdPhotoStatus: result.data.hdPhotoStatus ?? '',
          hdPhotoAdminFeedback: result.data.hdPhotoAdminFeedback ?? '',
          teamSelfieVideoStatus: result.data.teamSelfieVideoStatus ?? '',
          teamSelfieVideoAdminFeedback: result.data.teamSelfieVideoAdminFeedback ?? '',
          aiCloneSampleS3Key: result.data.aiCloneSampleS3Key ?? '',
        });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  }, [projectId, token]);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setDeliveries(result.data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  }, [projectId, token]);

  const fetchSetupItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/setup-items`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setSetupItems(result.data);
    } catch { /* ignore */ }
  }, [projectId, token]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchProject(), fetchDeliveries(), fetchSetupItems()]);
      setIsLoading(false);
    };
    load();
  }, [fetchProject, fetchDeliveries, fetchSetupItems]);

  const initializeSetup = async () => {
    setInitializingSetup(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/setup-items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaults: true }),
      });
      const result = await res.json();
      if (result.success) setSetupItems(result.data);
    } catch { /* ignore */ } finally {
      setInitializingSetup(false);
    }
  };

  const initializeRoadmap = async () => {
    setInitializingRoadmap(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/roadmap/init`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        await fetchProject(); // re-fetch project to get the new roadmap items
      }
    } catch { /* ignore */ } finally {
      setInitializingRoadmap(false);
    }
  };

  const toggleSetupItem = async (itemId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !current }),
      });
      const result = await res.json();
      if (result.success) setSetupItems(prev => prev.map(i => i._id === itemId ? result.data : i));
    } catch { /* ignore */ }
  };

  const saveSetupEdit = async (itemId: string) => {
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editSetupForm.title, value: editSetupForm.value || null }),
      });
      const result = await res.json();
      if (result.success) {
        setSetupItems(prev => prev.map(i => i._id === itemId ? result.data : i));
        setEditingSetupId(null);
      }
    } catch { /* ignore */ }
  };

  const addSetupItem = async () => {
    if (!newSetupTitle.trim()) return;
    setAddingSetupItem(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/setup-items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSetupTitle.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setSetupItems(prev => [...prev, result.data]);
        setNewSetupTitle('');
      }
    } catch { /* ignore */ } finally {
      setAddingSetupItem(false);
    }
  };

  // Poll deliveries while on the deliveries tab so client sign-offs appear in real time
  const deliveryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activeTab === 'deliveries') {
      deliveryPollRef.current = setInterval(fetchDeliveries, 8000);
    } else {
      if (deliveryPollRef.current) clearInterval(deliveryPollRef.current);
    }
    return () => { if (deliveryPollRef.current) clearInterval(deliveryPollRef.current); };
  }, [activeTab, fetchDeliveries]);

  const openDayEdit = (day: number) => {
    const item = project?.roadmap.find(r => r.day === day);
    if (!item) return;
    setDayForm({ title: item.title, description: item.description, videoUrl: item.videoUrl ?? '', adminNotes: item.adminNotes ?? '', completed: item.completed });
    setEditingDay(day);
  };

  const saveDay = async () => {
    if (!editingDay) return;
    setSavingDay(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/roadmap/${editingDay}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dayForm),
      });
      const result = await res.json();
      if (result.success) {
        setProject(prev => {
          if (!prev) return prev;
          return { ...prev, roadmap: prev.roadmap.map(r => r.day === editingDay ? { ...r, ...dayForm } : r) };
        });
        setEditingDay(null);
      }
    } catch (error) {
      console.error('Error saving day:', error);
    } finally {
      setSavingDay(false);
    }
  };

  const saveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOverview(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...overviewForm, totalPrice: overviewForm.totalPrice ? Number(overviewForm.totalPrice) : undefined }),
      });
      const result = await res.json();
      if (result.success) { setProject(result.data); setEditingOverview(false); }
    } catch (error) {
      console.error('Error saving overview:', error);
    } finally {
      setSavingOverview(false);
    }
  };

  const createDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDelivery(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...deliveryForm, deliveryNumber: Number(deliveryForm.deliveryNumber) }),
      });
      const result = await res.json();
      if (result.success) {
        setDeliveries(prev => [...prev, result.data]);
        setDeliveryForm({ title: '', description: '', deliveryNumber: '', proofS3Key: '', adminNotes: '' });
        setShowDeliveryForm(false);
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
    } finally {
      setSavingDelivery(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (result.success) setDeliveries(prev => prev.map(d => d._id === deliveryId ? result.data : d));
    } catch (error) {
      console.error('Error updating delivery:', error);
    }
  };

  const saveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(contentForm),
      });
      const result = await res.json();
      if (result.success) { setProject(result.data); }
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSavingContent(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Project not found.</p>
        <Button onClick={() => router.push('/dashboard/admin/projects')} className="mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
          Back to Projects
        </Button>
      </div>
    );
  }

  const typeLabel = project.type === 'ai_saas' ? 'AI SaaS' : 'Content Distribution';
  const TypeIcon = project.type === 'ai_saas' ? Brain : Film;
  const typeColor = project.type === 'ai_saas' ? 'text-violet-400' : 'text-amber-400';
  const typeBg = project.type === 'ai_saas' ? 'bg-violet-500/15' : 'bg-amber-500/15';

  const completedDays = project.roadmap.filter(r => r.completed).length;
  const totalDays = project.roadmap.length;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...(project.type === 'ai_saas' ? [{ id: 'roadmap' as Tab, label: totalDays > 0 ? `Roadmap (${completedDays}/${totalDays})` : 'Roadmap' }] : []),
    { id: 'deliveries', label: `Deliveries (${deliveries.length})` },
    ...(project.type === 'content_distribution' ? [{ id: 'content' as Tab, label: 'Content Uploads' }] : []),
    { id: 'setup', label: `Setup (${setupItems.length})` },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <button
          onClick={() => router.push('/dashboard/admin/projects')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 ${typeBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <TypeIcon className={`w-5.5 h-5.5 ${typeColor}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBg} ${typeColor}`}>{typeLabel}</span>
                <span className="text-xs text-slate-500">{project.clientId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-slate-800 -mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                activeTab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Project Details</h2>
                <Button
                  onClick={() => setEditingOverview(!editingOverview)}
                  className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-8 px-3 text-xs"
                >
                  {editingOverview ? 'Cancel' : 'Edit'}
                </Button>
              </div>
              {editingOverview ? (
                <form onSubmit={saveOverview} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Project Name</label>
                      <Input value={overviewForm.name} onChange={e => setOverviewForm(f => ({ ...f, name: e.target.value }))} className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Status</label>
                      <select value={overviewForm.status} onChange={e => setOverviewForm(f => ({ ...f, status: e.target.value }))} className="w-full h-9 px-3 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Total Price (USD)</label>
                      <Input type="number" value={overviewForm.totalPrice} onChange={e => setOverviewForm(f => ({ ...f, totalPrice: e.target.value }))} className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <FileUploadField
                        label="Contract PDF"
                        value={overviewForm.contractPDF}
                        onChange={url => setOverviewForm(f => ({ ...f, contractPDF: url }))}
                        folder="contracts"
                        accept=".pdf,application/pdf"
                        maxSizeMB={20}
                        hint="PDF only"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FileUploadField
                        label="Scope PDF"
                        value={overviewForm.scopePDF}
                        onChange={url => setOverviewForm(f => ({ ...f, scopePDF: url }))}
                        folder="scopes"
                        accept=".pdf,application/pdf"
                        maxSizeMB={20}
                        hint="PDF only"
                      />
                    </div>
                    {project.type === 'ai_saas' && (
                      <div className="space-y-1.5">
                        <FileUploadField
                          label="Proof of Code"
                          value={overviewForm.proofOfCodeS3Key}
                          onChange={url => setOverviewForm(f => ({ ...f, proofOfCodeS3Key: url }))}
                          folder="proof-of-code"
                          accept=".zip,.tar.gz,.pdf,application/pdf,application/zip"
                          maxSizeMB={100}
                          hint="ZIP archive or PDF"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Start Date</label>
                      <Input type="date" value={overviewForm.startDate} onChange={e => setOverviewForm(f => ({ ...f, startDate: e.target.value }))} className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">End Date</label>
                      <Input type="date" value={overviewForm.endDate} onChange={e => setOverviewForm(f => ({ ...f, endDate: e.target.value }))} className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Description</label>
                    <textarea value={overviewForm.description} onChange={e => setOverviewForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                  </div>
                  <Button type="submit" disabled={savingOverview} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm">
                    {savingOverview ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              ) : (
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-5">
                  <Stat label="Status" value={project.status} />
                  <Stat label="Total Price" value={project.totalPrice ? `$${project.totalPrice.toLocaleString()}` : 'Not set'} />
                  <Stat label="Start Date" value={new Date(project.startDate).toLocaleDateString()} />
                  <Stat label="End Date" value={new Date(project.endDate).toLocaleDateString()} />
                  <FileLink label="Contract PDF" url={project.contractPDF} />
                  <FileLink label="Scope PDF" url={project.scopePDF} />
                  {project.type === 'ai_saas' && (
                    <>
                      <Stat label="GitHub Username" value={project.githubUsername ?? 'Not submitted'} />
                      <FileLink label="Demo Video" url={project.demoVideoS3Key} />
                      <FileLink label="Proof of Code" url={project.proofOfCodeS3Key} />
                    </>
                  )}
                </div>
              )}
            </Card>

            <Card className="bg-slate-800/60 border-slate-700/50 p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>
            </Card>
          </div>
        )}

        {/* ROADMAP TAB (AI SaaS only) */}
        {activeTab === 'roadmap' && project.type === 'ai_saas' && (
          <div className="space-y-3">
            {project.roadmap.length === 0 ? (
              <Card className="bg-slate-800/60 border-slate-700/50 p-12 text-center">
                <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Video className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium mb-1.5">Roadmap not initialised</p>
                <p className="text-slate-600 text-sm mb-5">Create the 14-day roadmap so you can add video URLs and progress updates for the client.</p>
                <Button
                  onClick={initializeRoadmap}
                  disabled={initializingRoadmap}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-5 text-sm flex items-center gap-2 mx-auto"
                >
                  {initializingRoadmap
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Initialising…</>
                    : <><Plus className="w-3.5 h-3.5" /> Initialise 14-Day Roadmap</>}
                </Button>
              </Card>
            ) : (
              <>
                <p className="text-xs text-slate-500">Click any day to edit its title, description, video URL, and mark it complete. The client can watch the video on their Roadmap page.</p>
            {project.roadmap.map(item => (
              <Card key={item.day} className={`border transition-all duration-200 ${item.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.completed
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        : <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                      }
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">DAY {item.day}</span>
                          {item.videoUrl && <Video className="w-3 h-3 text-blue-400" />}
                        </div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        {item.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => editingDay === item.day ? setEditingDay(null) : openDayEdit(item.day)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors flex-shrink-0"
                    >
                      {editingDay === item.day ? <><ChevronUp className="w-4 h-4" /> Close</> : <><ChevronDown className="w-4 h-4" /> Edit</>}
                    </button>
                  </div>

                  {editingDay === item.day && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Title</label>
                          <Input value={dayForm.title} onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Video URL</label>
                          <Input value={dayForm.videoUrl} onChange={e => setDayForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtu.be/..." className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm placeholder-slate-600" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Description</label>
                        <textarea value={dayForm.description} onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Admin Notes (internal)</label>
                        <Input value={dayForm.adminNotes} onChange={e => setDayForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Internal notes..." className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm placeholder-slate-600" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dayForm.completed}
                            onChange={e => setDayForm(f => ({ ...f, completed: e.target.checked }))}
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                          <span className="text-sm text-slate-300">Mark as completed</span>
                        </label>
                        <Button onClick={saveDay} disabled={savingDay} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-8 px-4 text-xs flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5" />{savingDay ? 'Saving...' : 'Save Day'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
              </>
            )}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">Per-delivery approval cards. Client reviews and signs off on each delivery.</p>
              <Button
                onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm"
              >
                <Plus className="w-4 h-4" /> Add Delivery
              </Button>
            </div>

            {showDeliveryForm && (
              <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-700/50 bg-slate-700/20">
                  <h3 className="text-sm font-semibold text-white">New Delivery Card</h3>
                </div>
                <form onSubmit={createDelivery} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Delivery # (e.g. 3 for D3)</label>
                      <Input type="number" value={deliveryForm.deliveryNumber} onChange={e => setDeliveryForm(f => ({ ...f, deliveryNumber: e.target.value }))} placeholder="1" className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" required />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Title</label>
                      <Input value={deliveryForm.title} onChange={e => setDeliveryForm(f => ({ ...f, title: e.target.value }))} placeholder="Core Auth System" className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Description</label>
                    <textarea value={deliveryForm.description} onChange={e => setDeliveryForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What's included in this delivery..." className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FileUploadField
                        label="Proof file (optional)"
                        value={deliveryForm.proofS3Key}
                        onChange={url => setDeliveryForm(f => ({ ...f, proofS3Key: url }))}
                        folder="deliveries"
                        accept=".zip,.pdf,video/*,image/*,application/pdf,application/zip"
                        maxSizeMB={100}
                        hint="ZIP, PDF, video, or image"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Admin Notes (internal)</label>
                      <Input value={deliveryForm.adminNotes} onChange={e => setDeliveryForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Notes for yourself..." className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm placeholder-slate-600" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={savingDelivery} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm">
                      {savingDelivery ? 'Creating...' : 'Create Delivery'}
                    </Button>
                    <Button type="button" onClick={() => setShowDeliveryForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-9 px-4 text-sm">Cancel</Button>
                  </div>
                </form>
              </Card>
            )}

            {deliveries.length === 0 ? (
              <Card className="bg-slate-800/60 border-slate-700/50 p-12 text-center">
                <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No deliveries yet. Add the first delivery card above.</p>
              </Card>
            ) : (
              deliveries.map(d => (
                <Card key={d._id} className="bg-slate-800/60 border-slate-700/50">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-400">D{d.deliveryNumber}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] ?? 'bg-slate-600/50 text-slate-400'}`}>
                            {d.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {d.status === 'pending' && (
                          <Button onClick={() => updateDeliveryStatus(d._id!, { status: 'client_reviewing', proofS3Key: d.proofS3Key })} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-7 px-3 text-xs">Send for Review</Button>
                        )}
                        {d.status === 'revision_requested' && (
                          <Button onClick={() => updateDeliveryStatus(d._id!, { status: 'client_reviewing' })} className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl h-7 px-3 text-xs">Re-send</Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{d.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {d.proofS3Key && (
                      <div className="text-slate-500">
                        Proof:{' '}
                        <a href={d.proofS3Key} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-mono text-[11px]">
                          {d.proofS3Key.split('/').pop()}↗
                        </a>
                      </div>
                    )}
                      {d.adminNotes && <div className="text-slate-500">Notes: <span className="text-slate-400">{d.adminNotes}</span></div>}
                      {d.clientFeedback && <div className="col-span-2 text-slate-500">Client feedback: <span className="text-slate-300">"{d.clientFeedback}"</span></div>}
                      {d.signedOffAt && <div className="text-emerald-500">Signed off: {new Date(d.signedOffAt).toLocaleDateString()}</div>}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* CONTENT UPLOADS TAB (Content Distribution only) */}
        {activeTab === 'content' && project.type === 'content_distribution' && (
          <div className="space-y-6">
            <form onSubmit={saveContent} className="space-y-5">
              {/* Client Upload Review */}
              <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
                  <h2 className="text-sm font-semibold text-white">Client Uploads — Review</h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* HD Photo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">HD Photo</label>
                      {project.hdPhotoS3Key
                        ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_COLORS[project.hdPhotoStatus ?? 'pending_review'] ?? 'bg-slate-600/50 text-slate-400'}`}>{project.hdPhotoStatus ?? 'pending_review'}</span>
                        : <span className="text-xs text-slate-600">Not uploaded</span>
                      }
                    </div>
                    {project.hdPhotoS3Key && (
                      <a href={project.hdPhotoS3Key} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-3 bg-slate-700/40 rounded-lg px-3 py-1.5 transition-colors">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-mono">{project.hdPhotoS3Key.split('/').pop()}</span>
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Status</label>
                        <select value={contentForm.hdPhotoStatus} onChange={e => setContentForm(f => ({ ...f, hdPhotoStatus: e.target.value }))} className="w-full h-9 px-3 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" disabled={!project.hdPhotoS3Key}>
                          <option value="">Awaiting upload</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="approved">Approved</option>
                          <option value="revision_requested">Revision Requested</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Feedback to client</label>
                        <Input value={contentForm.hdPhotoAdminFeedback} onChange={e => setContentForm(f => ({ ...f, hdPhotoAdminFeedback: e.target.value }))} placeholder="e.g. Please use better lighting" className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm placeholder-slate-600" disabled={!project.hdPhotoS3Key} />
                      </div>
                    </div>
                  </div>

                  {/* Team Selfie Video */}
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">Team Selfie Video</label>
                      {project.teamSelfieVideoS3Key
                        ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_COLORS[project.teamSelfieVideoStatus ?? 'pending_review'] ?? 'bg-slate-600/50 text-slate-400'}`}>{project.teamSelfieVideoStatus ?? 'pending_review'}</span>
                        : <span className="text-xs text-slate-600">Not uploaded</span>
                      }
                    </div>
                    {project.teamSelfieVideoS3Key && (
                      <a href={project.teamSelfieVideoS3Key} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-3 bg-slate-700/40 rounded-lg px-3 py-1.5 transition-colors">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-mono">{project.teamSelfieVideoS3Key.split('/').pop()}</span>
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Status</label>
                        <select value={contentForm.teamSelfieVideoStatus} onChange={e => setContentForm(f => ({ ...f, teamSelfieVideoStatus: e.target.value }))} className="w-full h-9 px-3 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" disabled={!project.teamSelfieVideoS3Key}>
                          <option value="">Awaiting upload</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="approved">Approved</option>
                          <option value="revision_requested">Revision Requested</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Feedback to client</label>
                        <Input value={contentForm.teamSelfieVideoAdminFeedback} onChange={e => setContentForm(f => ({ ...f, teamSelfieVideoAdminFeedback: e.target.value }))} placeholder="e.g. Video needs to be HD" className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm placeholder-slate-600" disabled={!project.teamSelfieVideoS3Key} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI Clone Sample Upload */}
              <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
                  <h2 className="text-sm font-semibold text-white">AI Clone Sample</h2>
                </div>
                <div className="p-6 space-y-3">
                  <FileUploadField
                    label="AI Clone Sample Video"
                    value={contentForm.aiCloneSampleS3Key}
                    onChange={url => setContentForm(f => ({ ...f, aiCloneSampleS3Key: url }))}
                    folder="ai-clone-samples"
                    accept="video/mp4,video/webm,video/quicktime"
                    maxSizeMB={500}
                    hint="MP4, WebM, or MOV · sent to client for review"
                  />
                  {project.aiCloneSampleS3Key && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">Client review status:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REVIEW_COLORS[project.aiCloneApprovalStatus ?? 'pending_review'] ?? 'bg-slate-600/50 text-slate-400'}`}>
                        {project.aiCloneApprovalStatus ?? 'Awaiting upload'}
                      </span>
                    </div>
                  )}
                  {project.aiCloneClientFeedback && (
                    <p className="text-xs text-slate-400">Client feedback: <span className="text-slate-300">"{project.aiCloneClientFeedback}"</span></p>
                  )}
                </div>
              </Card>

              {/* Client Branding Info */}
              {(project.domainName || project.designPreferences || project.logoS3Key) && (
                <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
                    <h2 className="text-sm font-semibold text-white">Client Branding Info</h2>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-5">
                    <Stat label="Domain Name" value={project.domainName ?? 'Not provided'} />
                    <FileLink label="Logo" url={project.logoS3Key} />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Design Preferences</p>
                      <p className="text-sm text-slate-300">{project.designPreferences ?? 'Not provided'}</p>
                    </div>
                  </div>
                </Card>
              )}

              <Button type="submit" disabled={savingContent} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-5 text-sm shadow-lg shadow-blue-600/20">
                {savingContent ? 'Saving...' : 'Save Content Review'}
              </Button>
            </form>
          </div>
        )}

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Manage setup checklist items for this project. Clients can check items off from their Setup page.</p>
              {setupItems.length === 0 && (
                <Button
                  onClick={initializeSetup}
                  disabled={initializingSetup}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-8 px-3 text-xs"
                >
                  {initializingSetup
                    ? <><RefreshCw className="w-3 h-3 animate-spin" /> Initialising…</>
                    : <><RefreshCw className="w-3 h-3" /> Initialise Defaults</>}
                </Button>
              )}
            </div>

            {setupItems.length > 0 ? (
              <div className="space-y-2">
                {setupItems.map(item => (
                  <Card key={item._id} className={`border transition-all ${item.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <div className="p-4">
                      {editingSetupId === item._id ? (
                        <div className="space-y-2">
                          <Input
                            value={editSetupForm.title}
                            onChange={e => setEditSetupForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Item title"
                            className="bg-slate-700 border-slate-600 text-white rounded-xl h-8 text-sm"
                          />
                          <Input
                            value={editSetupForm.value}
                            onChange={e => setEditSetupForm(f => ({ ...f, value: e.target.value }))}
                            placeholder="Description / value (optional)"
                            className="bg-slate-700 border-slate-600 text-white rounded-xl h-8 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => saveSetupEdit(item._id!)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-7 px-3 text-xs flex items-center gap-1">
                              <Save className="w-3 h-3" /> Save
                            </Button>
                            <Button onClick={() => setEditingSetupId(null)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-7 px-3 text-xs">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSetupItem(item._id!, item.completed)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${item.completed ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-700 border border-slate-600 hover:border-blue-500'}`}
                          >
                            {item.completed ? <Check className="w-4 h-4 text-white" /> : <span className="text-xs font-bold text-slate-400">{item.itemNumber}</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>{item.title}</p>
                            {item.value && <p className="text-xs text-slate-500 mt-0.5">{item.value}</p>}
                          </div>
                          <button
                            onClick={() => { setEditingSetupId(item._id!); setEditSetupForm({ title: item.title, value: item.value ?? '' }); }}
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/60 border-slate-700/50 p-10 text-center">
                <Settings2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">No setup items yet</p>
                <p className="text-slate-600 text-xs">Use "Initialise Defaults" to add the 5 standard checklist items, or add custom ones below.</p>
              </Card>
            )}

            {/* Add new item */}
            <div className="flex gap-2 pt-1">
              <Input
                value={newSetupTitle}
                onChange={e => setNewSetupTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSetupItem(); } }}
                placeholder="Add a custom setup item…"
                className="bg-slate-800 border-slate-700 text-white rounded-xl h-9 text-sm flex-1"
              />
              <Button
                onClick={addSetupItem}
                disabled={addingSetupItem || !newSetupTitle.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm text-slate-300 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</p>
    </div>
  );
}

function FileLink({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono">
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{url.split('/').pop()}</span>
        </a>
      ) : (
        <p className="text-sm text-slate-500">Not uploaded</p>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Project, Delivery, SetupItem } from '@/lib/types';
import {
  ArrowLeft, Brain, Film, Calendar, DollarSign, User2,
  CheckCircle2, Clock, Circle, Video, Plus, Save, Trash2,
  FileText, Github, ExternalLink, AlertCircle, Check, X,
  ChevronDown, ChevronUp, Package, Settings2, RefreshCw, Pencil,
} from 'lucide-react';

type Tab = 'overview' | 'roadmap' | 'deliveries' | 'content' | 'setup';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  pending: { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
  submitted: { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
  client_reviewing: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
  approved: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
  revision_requested: { background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
};

const REVIEW_BADGE: Record<string, React.CSSProperties> = {
  pending_review: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
  approved: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
  revision_requested: { background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 },
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
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: '#5F6B76' }}>Project not found.</p>
        <Button
          onClick={() => router.push('/dashboard/admin/projects')}
          className="mt-4 btn-primary rounded-xl"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  const typeLabel = project.type === 'ai_saas' ? 'AI SaaS' : 'Content Distribution';
  const TypeIcon = project.type === 'ai_saas' ? Brain : Film;
  const typeIconStyle: React.CSSProperties = project.type === 'ai_saas'
    ? { color: '#8b5cf6' }
    : { color: '#f59e0b' };
  const typeBadgeStyle: React.CSSProperties = project.type === 'ai_saas'
    ? { background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }
    : { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 };
  const typeIconBg = project.type === 'ai_saas' ? '#f5f3ff' : '#fffbeb';

  const completedDays = project.roadmap.filter(r => r.completed).length;
  const totalDays = project.roadmap.length;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...(project.type === 'ai_saas' ? [{ id: 'roadmap' as Tab, label: totalDays > 0 ? `Roadmap (${completedDays}/${totalDays})` : 'Roadmap' }] : []),
    { id: 'deliveries', label: `Deliveries (${deliveries.length})` },
    ...(project.type === 'content_distribution' ? [{ id: 'content' as Tab, label: 'Content Uploads' }] : []),
    { id: 'setup', label: setupItems.length > 0 ? `Setup (${setupItems.filter(s => s.completed).length}/${setupItems.length})` : 'Setup' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title={project?.name || 'Project'}
        subtitle="Project details and deliverables"
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Projects', href: '/dashboard/admin/projects' },
          { label: project?.name || 'Project' },
        ]}
        heroStrip
      />

      {/* Sub-header: type badge + tab bar */}
      <div className="px-8 pb-6 pt-4" style={{ background: '#ffffff', borderBottom: '1px solid #DDE5EC' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: typeIconBg }}
          >
            <TypeIcon className="w-4 h-4" style={typeIconStyle} />
          </div>
          <div className="flex items-center gap-2">
            <span style={typeBadgeStyle}>{typeLabel}</span>
            <span className="text-xs" style={{ color: '#8A97A3' }}>{project.clientId}</span>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1"
          style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', borderRadius: '12px', display: 'inline-flex' }}
        >
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={
                activeTab === t.id
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#8A97A3' }
              }
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
            <div style={{ ...CARD, overflow: 'hidden' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>Project Details</h2>
                <button
                  onClick={() => setEditingOverview(!editingOverview)}
                  className="rounded-xl h-8 px-3 text-xs font-medium transition-all active:scale-95"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                >
                  {editingOverview ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingOverview ? (
                <form onSubmit={saveOverview} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Project Name</label>
                      <Input value={overviewForm.name} onChange={e => setOverviewForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Status</label>
                      <select
                        value={overviewForm.status}
                        onChange={e => setOverviewForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full h-9 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                        style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                      >
                        <option value="planning">Planning</option>
                        <option value="active">Active</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Total Price (USD)</label>
                      <Input type="number" value={overviewForm.totalPrice} onChange={e => setOverviewForm(f => ({ ...f, totalPrice: e.target.value }))} className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
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
                      <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Start Date</label>
                      <Input type="date" value={overviewForm.startDate} onChange={e => setOverviewForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>End Date</label>
                      <Input type="date" value={overviewForm.endDate} onChange={e => setOverviewForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: '#5F6B76' }}>Description</label>
                    <textarea
                      value={overviewForm.description}
                      onChange={e => setOverviewForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
                      style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingOverview}
                    className="btn-primary rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                  >
                    {savingOverview ? 'Saving...' : 'Save Changes'}
                  </button>
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
            </div>

            <div style={{ ...CARD, padding: '24px' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#8A97A3' }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{project.description}</p>
            </div>
          </div>
        )}

        {/* ROADMAP TAB (AI SaaS only) */}
        {activeTab === 'roadmap' && project.type === 'ai_saas' && (
          <div className="space-y-3">
            {project.roadmap.length === 0 ? (
              <div style={{ ...CARD, padding: '48px', textAlign: 'center' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f1f5f9' }}>
                  <Video className="w-7 h-7" style={{ color: '#8A97A3' }} />
                </div>
                <p className="font-medium mb-1.5" style={{ color: '#5F6B76' }}>Roadmap not initialised</p>
                <p className="text-sm mb-5" style={{ color: '#8A97A3' }}>Create the 14-day roadmap so you can add video URLs and progress updates for the client.</p>
                <button
                  onClick={initializeRoadmap}
                  disabled={initializingRoadmap}
                  className="btn-primary rounded-xl h-9 px-5 text-sm font-medium flex items-center gap-2 mx-auto transition-all active:scale-95 disabled:opacity-60"
                >
                  {initializingRoadmap
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Initialising…</>
                    : <><Plus className="w-3.5 h-3.5" /> Initialise 14-Day Roadmap</>}
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs" style={{ color: '#8A97A3' }}>Click any day to edit its title, description, video URL, and mark it complete. The client can watch the video on their Roadmap page.</p>
                {project.roadmap.map(item => (
                  <div
                    key={item.day}
                    style={{
                      background: item.completed ? '#f0fdf4' : '#ffffff',
                      border: item.completed ? '1px solid #a7f3d0' : '1px solid #DDE5EC',
                      borderLeft: item.completed ? '3px solid #6BCF7A' : '3px solid #DDE5EC',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      borderRadius: '16px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.completed
                            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#6BCF7A' }} />
                            : <Circle className="w-5 h-5 flex-shrink-0" style={{ color: '#DDE5EC' }} />
                          }
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: '#8A97A3' }}>DAY {item.day}</span>
                              {item.videoUrl && <Video className="w-3 h-3" style={{ color: '#3A8DDE' }} />}
                            </div>
                            <p className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{item.title}</p>
                            {item.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#8A97A3' }}>{item.description}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => editingDay === item.day ? setEditingDay(null) : openDayEdit(item.day)}
                          className="flex items-center gap-1 text-xs transition-colors flex-shrink-0"
                          style={{ color: '#8A97A3' }}
                        >
                          {editingDay === item.day ? <><ChevronUp className="w-4 h-4" /> Close</> : <><ChevronDown className="w-4 h-4" /> Edit</>}
                        </button>
                      </div>

                      {editingDay === item.day && (
                        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Title</label>
                              <Input value={dayForm.title} onChange={e => setDayForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                            </div>
                            <div>
                              <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Video URL</label>
                              <Input value={dayForm.videoUrl} onChange={e => setDayForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtu.be/..." className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Description</label>
                            <textarea
                              value={dayForm.description}
                              onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))}
                              rows={2}
                              className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
                              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                            />
                          </div>
                          <div>
                            <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Admin Notes (internal)</label>
                            <Input value={dayForm.adminNotes} onChange={e => setDayForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Internal notes..." className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={dayForm.completed}
                                onChange={e => setDayForm(f => ({ ...f, completed: e.target.checked }))}
                                className="w-4 h-4 rounded accent-emerald-500"
                              />
                              <span className="text-sm" style={{ color: '#334155' }}>Mark as completed</span>
                            </label>
                            <button
                              onClick={saveDay}
                              disabled={savingDay}
                              className="btn-primary rounded-xl h-8 px-4 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                            >
                              <Save className="w-3.5 h-3.5" />{savingDay ? 'Saving...' : 'Save Day'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <p className="text-xs" style={{ color: '#8A97A3' }}>Per-delivery approval cards. Client reviews and signs off on each delivery.</p>
              <button
                onClick={() => setShowDeliveryForm(!showDeliveryForm)}
                className="btn-primary flex items-center gap-2 rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Delivery
              </button>
            </div>

            {showDeliveryForm && (
              <div style={{ ...CARD, overflow: 'hidden' }}>
                <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>New Delivery Card</h3>
                </div>
                <form onSubmit={createDelivery} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#5F6B76' }}>Delivery # (e.g. 3 for D3)</label>
                      <Input type="number" value={deliveryForm.deliveryNumber} onChange={e => setDeliveryForm(f => ({ ...f, deliveryNumber: e.target.value }))} placeholder="1" className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} required />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: '#5F6B76' }}>Title</label>
                      <Input value={deliveryForm.title} onChange={e => setDeliveryForm(f => ({ ...f, title: e.target.value }))} placeholder="Core Auth System" className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: '#5F6B76' }}>Description</label>
                    <textarea
                      value={deliveryForm.description}
                      onChange={e => setDeliveryForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="What's included in this delivery..."
                      className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
                      style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                      required
                    />
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
                      <label className="text-xs mb-1 block" style={{ color: '#5F6B76' }}>Admin Notes (internal)</label>
                      <Input value={deliveryForm.adminNotes} onChange={e => setDeliveryForm(f => ({ ...f, adminNotes: e.target.value }))} placeholder="Notes for yourself..." className="rounded-xl h-9 text-sm" style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={savingDelivery}
                      className="btn-primary rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                    >
                      {savingDelivery ? 'Creating...' : 'Create Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryForm(false)}
                      className="rounded-xl h-9 px-4 text-sm font-medium transition-all active:scale-95"
                      style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {deliveries.length === 0 ? (
              <EmptyState
                icon={<Package className="w-8 h-8" style={{ color: '#8A97A3' }} />}
                title="No deliveries yet"
                description="Add the first delivery card above."
              />
            ) : (
              deliveries.map(d => (
                <div key={d._id} style={{ ...CARD, transition: 'all 0.2s' }} className="hover:-translate-y-0.5">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: '#3A8DDE' }}>D{d.deliveryNumber}</span>
                          {d.status === 'approved' || d.status === 'completed'
                            ? <span className="pill-info">{d.status.replace('_', ' ')}</span>
                            : d.status === 'pending'
                            ? <span className="pill-pending">{d.status.replace('_', ' ')}</span>
                            : d.status === 'revision_requested'
                            ? <span className="pill-rejected">{d.status.replace('_', ' ')}</span>
                            : <span className="pill-muted">{d.status.replace('_', ' ')}</span>
                          }
                        </div>
                        <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{d.title}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {d.status === 'pending' && (
                          <button
                            onClick={() => updateDeliveryStatus(d._id!, { status: 'client_reviewing', proofS3Key: d.proofS3Key })}
                            className="btn-primary rounded-xl h-7 px-3 text-xs font-medium transition-all active:scale-95"
                          >
                            Send for Review
                          </button>
                        )}
                        {d.status === 'revision_requested' && (
                          <button
                            onClick={() => updateDeliveryStatus(d._id!, { status: 'client_reviewing' })}
                            className="rounded-xl h-7 px-3 text-xs font-medium transition-all active:scale-95"
                            style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' }}
                          >
                            Re-send
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#5F6B76' }}>{d.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {d.proofS3Key && (
                        <div style={{ color: '#8A97A3' }}>
                          Proof:{' '}
                          <a href={d.proofS3Key} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] transition-colors" style={{ color: '#3A8DDE' }}>
                            {d.proofS3Key.split('/').pop()}↗
                          </a>
                        </div>
                      )}
                      {d.adminNotes && <div style={{ color: '#8A97A3' }}>Notes: <span style={{ color: '#5F6B76' }}>{d.adminNotes}</span></div>}
                      {d.clientFeedback && <div className="col-span-2" style={{ color: '#8A97A3' }}>Client feedback: <span style={{ color: '#334155' }}>"{d.clientFeedback}"</span></div>}
                      {d.signedOffAt && <div style={{ color: '#6BCF7A' }}>Signed off: {new Date(d.signedOffAt).toLocaleDateString()}</div>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CONTENT UPLOADS TAB (Content Distribution only) */}
        {activeTab === 'content' && project.type === 'content_distribution' && (
          <div className="space-y-6">
            <form onSubmit={saveContent} className="space-y-5">
              {/* Client Upload Review */}
              <div style={{ ...CARD, overflow: 'hidden' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>Client Uploads — Review</h2>
                </div>
                <div className="p-6 space-y-5">
                  {/* HD Photo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium" style={{ color: '#334155' }}>HD Photo</label>
                      {project.hdPhotoS3Key
                        ? <span style={REVIEW_BADGE[project.hdPhotoStatus ?? 'pending_review'] ?? REVIEW_BADGE.pending_review}>{project.hdPhotoStatus ?? 'pending_review'}</span>
                        : <span className="text-xs" style={{ color: '#8A97A3' }}>Not uploaded</span>
                      }
                    </div>
                    {project.hdPhotoS3Key && (
                      <a
                        href={project.hdPhotoS3Key}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs mb-3 rounded-lg px-3 py-1.5 transition-colors"
                        style={{ color: '#3A8DDE', background: '#eff8ff' }}
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-mono">{project.hdPhotoS3Key.split('/').pop()}</span>
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Status</label>
                        <select
                          value={contentForm.hdPhotoStatus}
                          onChange={e => setContentForm(f => ({ ...f, hdPhotoStatus: e.target.value }))}
                          disabled={!project.hdPhotoS3Key}
                          className="w-full h-9 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                          style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                        >
                          <option value="">Awaiting upload</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="approved">Approved</option>
                          <option value="revision_requested">Revision Requested</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Feedback to client</label>
                        <Input
                          value={contentForm.hdPhotoAdminFeedback}
                          onChange={e => setContentForm(f => ({ ...f, hdPhotoAdminFeedback: e.target.value }))}
                          placeholder="e.g. Please use better lighting"
                          disabled={!project.hdPhotoS3Key}
                          className="rounded-xl h-9 text-sm"
                          style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Team Selfie Video */}
                  <div className="pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium" style={{ color: '#334155' }}>Team Selfie Video</label>
                      {project.teamSelfieVideoS3Key
                        ? <span style={REVIEW_BADGE[project.teamSelfieVideoStatus ?? 'pending_review'] ?? REVIEW_BADGE.pending_review}>{project.teamSelfieVideoStatus ?? 'pending_review'}</span>
                        : <span className="text-xs" style={{ color: '#8A97A3' }}>Not uploaded</span>
                      }
                    </div>
                    {project.teamSelfieVideoS3Key && (
                      <a
                        href={project.teamSelfieVideoS3Key}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs mb-3 rounded-lg px-3 py-1.5 transition-colors"
                        style={{ color: '#3A8DDE', background: '#eff8ff' }}
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate font-mono">{project.teamSelfieVideoS3Key.split('/').pop()}</span>
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Status</label>
                        <select
                          value={contentForm.teamSelfieVideoStatus}
                          onChange={e => setContentForm(f => ({ ...f, teamSelfieVideoStatus: e.target.value }))}
                          disabled={!project.teamSelfieVideoS3Key}
                          className="w-full h-9 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                          style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
                        >
                          <option value="">Awaiting upload</option>
                          <option value="pending_review">Pending Review</option>
                          <option value="approved">Approved</option>
                          <option value="revision_requested">Revision Requested</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#8A97A3' }}>Feedback to client</label>
                        <Input
                          value={contentForm.teamSelfieVideoAdminFeedback}
                          onChange={e => setContentForm(f => ({ ...f, teamSelfieVideoAdminFeedback: e.target.value }))}
                          placeholder="e.g. Video needs to be HD"
                          disabled={!project.teamSelfieVideoS3Key}
                          className="rounded-xl h-9 text-sm"
                          style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Clone Sample Upload */}
              <div style={{ ...CARD, overflow: 'hidden' }}>
                <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                  <h2 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>AI Clone Sample</h2>
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
                      <span className="text-xs" style={{ color: '#8A97A3' }}>Client review status:</span>
                      <span style={REVIEW_BADGE[project.aiCloneApprovalStatus ?? 'pending_review'] ?? REVIEW_BADGE.pending_review}>
                        {project.aiCloneApprovalStatus ?? 'Awaiting upload'}
                      </span>
                    </div>
                  )}
                  {project.aiCloneClientFeedback && (
                    <p className="text-xs" style={{ color: '#5F6B76' }}>Client feedback: <span style={{ color: '#334155' }}>"{project.aiCloneClientFeedback}"</span></p>
                  )}
                </div>
              </div>

              {/* Client Branding Info */}
              {(project.domainName || project.designPreferences || project.logoS3Key) && (
                <div style={{ ...CARD, overflow: 'hidden' }}>
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                    <h2 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>Client Branding Info</h2>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-5">
                    <Stat label="Domain Name" value={project.domainName ?? 'Not provided'} />
                    <FileLink label="Logo" url={project.logoS3Key} />
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#8A97A3' }}>Design Preferences</p>
                      <p className="text-sm" style={{ color: '#334155' }}>{project.designPreferences ?? 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingContent}
                className="btn-primary rounded-xl h-10 px-5 text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
              >
                {savingContent ? 'Saving...' : 'Save Content Review'}
              </button>
            </form>
          </div>
        )}

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: '#8A97A3' }}>
                {project.type === 'ai_saas' ? '14-Day Scope' : '7-Day Scope'} — manage the onboarding checklist. Clients see and complete these from their Setup tab.
              </p>
              {setupItems.length === 0 && (
                <button
                  onClick={initializeSetup}
                  disabled={initializingSetup}
                  className="btn-primary flex items-center gap-1.5 rounded-xl h-8 px-3 text-xs font-medium transition-all active:scale-95 disabled:opacity-60"
                >
                  {initializingSetup
                    ? <><RefreshCw className="w-3 h-3 animate-spin" /> Initialising…</>
                    : <><RefreshCw className="w-3 h-3" /> Initialise Defaults</>}
                </button>
              )}
            </div>

            {setupItems.length > 0 ? (
              <div className="space-y-2">
                {setupItems.map(item => (
                  <div
                    key={item._id}
                    style={{
                      background: item.completed ? '#f0fdf4' : '#ffffff',
                      border: item.completed ? '1px solid #a7f3d0' : '1px solid #DDE5EC',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div className="p-4">
                      {editingSetupId === item._id ? (
                        <div className="space-y-2">
                          <Input
                            value={editSetupForm.title}
                            onChange={e => setEditSetupForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Item title"
                            className="rounded-xl h-8 text-sm"
                            style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }}
                          />
                          <Input
                            value={editSetupForm.value}
                            onChange={e => setEditSetupForm(f => ({ ...f, value: e.target.value }))}
                            placeholder="Description / value (optional)"
                            className="rounded-xl h-8 text-sm"
                            style={{ background: 'rgba(58,141,222,0.06)', borderColor: '#DDE5EC', color: '#1E2A32' }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveSetupEdit(item._id!)}
                              className="btn-primary rounded-xl h-7 px-3 text-xs font-medium flex items-center gap-1 transition-all active:scale-95"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                              onClick={() => setEditingSetupId(null)}
                              className="rounded-xl h-7 px-3 text-xs font-medium transition-all active:scale-95"
                              style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSetupItem(item._id!, item.completed)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                            style={item.completed
                              ? { background: '#6BCF7A' }
                              : { background: '#ffffff', border: '1px solid #DDE5EC' }
                            }
                          >
                            {item.completed
                              ? <Check className="w-4 h-4 text-white" />
                              : <span className="text-xs font-bold" style={{ color: '#8A97A3' }}>{item.itemNumber}</span>
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: item.completed ? '#8A97A3' : '#1E2A32', textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</p>
                            {item.value && <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>{item.value}</p>}
                          </div>
                          <button
                            onClick={() => { setEditingSetupId(item._id!); setEditSetupForm({ title: item.title, value: item.value ?? '' }); }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: '#8A97A3' }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Settings2 className="w-8 h-8" style={{ color: '#8A97A3' }} />}
                title="No setup items yet"
                description={`Use "Initialise Defaults" to add the ${project.type === 'ai_saas' ? '5 AI SaaS onboarding items (GitHub, hosting, domain, tech stack, API keys)' : '5 content distribution items (brand guidelines, logo, content audit, etc.)'}, or add custom ones below.`}
              />
            )}

            {/* Add new item */}
            <div className="flex gap-2 pt-1">
              <Input
                value={newSetupTitle}
                onChange={e => setNewSetupTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSetupItem(); } }}
                placeholder="Add a custom setup item…"
                className="rounded-xl h-9 text-sm flex-1"
                style={{ background: '#ffffff', border: '1px solid #DDE5EC', color: '#1E2A32' }}
              />
              <button
                onClick={addSetupItem}
                disabled={addingSetupItem || !newSetupTitle.trim()}
                className="btn-primary rounded-xl h-9 px-4 text-sm font-medium flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
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
      <p className="text-xs mb-0.5" style={{ color: '#8A97A3' }}>{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono text-xs' : ''}`} style={{ color: '#334155' }}>{value}</p>
    </div>
  );
}

function FileLink({ label, url }: { label: string; url?: string | null }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: '#8A97A3' }}>{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs transition-colors font-mono"
          style={{ color: '#3A8DDE' }}
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{url.split('/').pop()}</span>
        </a>
      ) : (
        <p className="text-sm" style={{ color: '#8A97A3' }}>Not uploaded</p>
      )}
    </div>
  );
}

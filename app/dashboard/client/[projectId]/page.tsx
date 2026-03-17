'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { Project, Delivery, SetupItem } from '@/lib/types';
import {
  ArrowLeft, Brain, Film, CheckCircle2, Circle, Video,
  Github, Upload, Check, X, ThumbsUp, ThumbsDown,
  FileText, Package, AlertCircle, Globe, Palette, Image, ExternalLink,
  ClipboardList, Pencil, Save,
} from 'lucide-react';

type Tab = 'overview' | 'roadmap' | 'deliveries' | 'content' | 'setup';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-600/50 text-slate-400',
  submitted: 'bg-blue-500/15 text-blue-400',
  client_reviewing: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  revision_requested: 'bg-red-500/15 text-red-400',
};

const UPLOAD_COLORS: Record<string, string> = {
  pending_review: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  revision_requested: 'bg-red-500/15 text-red-400',
};

export default function ClientProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const [project, setProject] = useState<Project | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Delivery sign-off state
  const [signingOff, setSigningOff] = useState<string | null>(null);
  const [signOffFeedback, setSignOffFeedback] = useState('');
  const [submittingSignOff, setSubmittingSignOff] = useState(false);

  // GitHub submission
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [submittingGithub, setSubmittingGithub] = useState(false);

  // Content uploads (Div B)
  const [contentForm, setContentForm] = useState({
    hdPhotoS3Key: '',
    teamSelfieVideoS3Key: '',
    domainName: '',
    designPreferences: '',
    logoS3Key: '',
  });
  const [aiCloneForm, setAiCloneForm] = useState({ action: '' as 'approved' | 'rejected' | '', feedback: '' });
  const [submittingContent, setSubmittingContent] = useState(false);
  const [submittingAiClone, setSubmittingAiClone] = useState(false);

  // Setup items state
  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [editingSetupId, setEditingSetupId] = useState<string | null>(null);
  const [editSetupValue, setEditSetupValue] = useState('');
  const [savingSetupId, setSavingSetupId] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) {
        setProject(result.data);
        if (result.data.githubUsername) setGithubUsername(result.data.githubUsername);
        setContentForm({
          hdPhotoS3Key: result.data.hdPhotoS3Key ?? '',
          teamSelfieVideoS3Key: result.data.teamSelfieVideoS3Key ?? '',
          domainName: result.data.domainName ?? '',
          designPreferences: result.data.designPreferences ?? '',
          logoS3Key: result.data.logoS3Key ?? '',
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
    } catch (error) {
      console.error('Error fetching setup items:', error);
    }
  }, [projectId, token]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchProject(), fetchDeliveries(), fetchSetupItems()]);
      setIsLoading(false);
    };
    load();
  }, [fetchProject, fetchDeliveries, fetchSetupItems]);

  const toggleSetupItem = async (itemId: string, current: boolean) => {
    setSavingSetupId(itemId);
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: !current }),
      });
      const result = await res.json();
      if (result.success) setSetupItems(prev => prev.map(s => s._id === itemId ? result.data : s));
    } catch (error) {
      console.error('Error toggling setup item:', error);
    } finally {
      setSavingSetupId(null);
    }
  };

  const saveSetupValue = async (itemId: string) => {
    setSavingSetupId(itemId);
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: editSetupValue }),
      });
      const result = await res.json();
      if (result.success) {
        setSetupItems(prev => prev.map(s => s._id === itemId ? result.data : s));
        setEditingSetupId(null);
      }
    } catch (error) {
      console.error('Error saving setup value:', error);
    } finally {
      setSavingSetupId(null);
    }
  };

  const handleSignOff = async (deliveryId: string, action: 'approve' | 'request_revision') => {
    setSubmittingSignOff(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, clientFeedback: signOffFeedback }),
      });
      const result = await res.json();
      if (result.success) {
        setDeliveries(prev => prev.map(d => d._id === deliveryId ? result.data : d));
        setSigningOff(null);
        setSignOffFeedback('');
      }
    } catch (error) {
      console.error('Error signing off:', error);
    } finally {
      setSubmittingSignOff(false);
    }
  };

  const submitGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGithub(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ githubUsername }),
      });
      const result = await res.json();
      if (result.success) { setProject(result.data); setShowGithubForm(false); }
    } catch (error) {
      console.error('Error submitting github:', error);
    } finally {
      setSubmittingGithub(false);
    }
  };

  const submitContentUploads = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingContent(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(contentForm),
      });
      const result = await res.json();
      if (result.success) { setProject(result.data); }
    } catch (error) {
      console.error('Error submitting content:', error);
    } finally {
      setSubmittingContent(false);
    }
  };

  const submitAiCloneReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCloneForm.action) return;
    setSubmittingAiClone(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ aiCloneApprovalStatus: aiCloneForm.action, aiCloneClientFeedback: aiCloneForm.feedback }),
      });
      const result = await res.json();
      if (result.success) { setProject(result.data); }
    } catch (error) {
      console.error('Error submitting AI clone review:', error);
    } finally {
      setSubmittingAiClone(false);
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
        <Button onClick={() => router.push('/dashboard/client/projects')} className="mt-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">Back</Button>
      </div>
    );
  }

  const typeLabel = project.type === 'ai_saas' ? 'AI SaaS' : 'Content Distribution';
  const TypeIcon = project.type === 'ai_saas' ? Brain : Film;
  const typeColor = project.type === 'ai_saas' ? 'text-violet-400' : 'text-amber-400';
  const typeBg = project.type === 'ai_saas' ? 'bg-violet-500/15' : 'bg-amber-500/15';

  const completedDays = project.roadmap.filter(r => r.completed).length;
  const totalDays = project.roadmap.length;
  const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const pendingDeliveries = deliveries.filter(d => d.status === 'client_reviewing').length;

  const completedSetup = setupItems.filter(s => s.completed).length;
  const totalSetup = setupItems.length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    ...(project.type === 'ai_saas' ? [{ id: 'roadmap' as Tab, label: 'Roadmap' }] : []),
    { id: 'deliveries', label: 'Deliveries', badge: pendingDeliveries },
    ...(project.type === 'content_distribution' ? [{ id: 'content' as Tab, label: 'My Uploads' }] : []),
    { id: 'setup', label: totalSetup > 0 ? `Setup (${completedSetup}/${totalSetup})` : 'Setup' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <button
          onClick={() => router.push('/dashboard/client/projects')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> My Projects
        </button>
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 ${typeBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-5 h-5 ${typeColor}`} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBg} ${typeColor}`}>{typeLabel}</span>
              <span className="text-xs text-slate-500">{project.status}</span>
            </div>
          </div>
          {project.type === 'ai_saas' && totalDays > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Roadmap progress</p>
              <p className="text-2xl font-bold text-white">{progress}%</p>
              <p className="text-xs text-slate-600">{completedDays}/{totalDays} days</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-slate-800 -mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                activeTab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Status" value={project.status} />
              <StatCard label="Start Date" value={new Date(project.startDate).toLocaleDateString()} />
              <StatCard label="End Date" value={new Date(project.endDate).toLocaleDateString()} />
              {project.totalPrice && <StatCard label="Total Price" value={`$${project.totalPrice.toLocaleString()}`} />}
            </div>

            <Card className="bg-slate-800/60 border-slate-700/50 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">About This Project</p>
              <p className="text-sm text-slate-300 leading-relaxed">{project.description}</p>
            </Card>

            {/* Contract & Scope documents */}
            {(project.contractPDF || project.scopePDF) && (
              <Card className="bg-slate-800/60 border-slate-700/50 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Documents</p>
                <div className="flex gap-3">
                  {project.contractPDF && (
                    <a
                      href={project.contractPDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 text-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-slate-300">Contract PDF</span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </a>
                  )}
                  {project.scopePDF && (
                    <a
                      href={project.scopePDF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 text-xs transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300">Scope PDF</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* GitHub submission (AI SaaS) */}
            {project.type === 'ai_saas' && (
              <Card className="bg-slate-800/60 border-slate-700/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-slate-400" />
                    <p className="text-sm font-semibold text-white">GitHub Username</p>
                  </div>
                  {!project.githubUsername && (
                    <Button onClick={() => setShowGithubForm(!showGithubForm)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-8 px-3 text-xs">
                      {showGithubForm ? 'Cancel' : 'Submit'}
                    </Button>
                  )}
                </div>
                {project.githubUsername ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-slate-300 font-mono">@{project.githubUsername}</span>
                  </div>
                ) : showGithubForm ? (
                  <form onSubmit={submitGithub} className="flex gap-3">
                    <Input
                      value={githubUsername}
                      onChange={e => setGithubUsername(e.target.value)}
                      placeholder="your-github-username"
                      className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm flex-1"
                      required
                    />
                    <Button type="submit" disabled={submittingGithub} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm">
                      {submittingGithub ? 'Saving...' : 'Save'}
                    </Button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-500">Submit your GitHub username so the admin can deliver code to your repository.</p>
                )}
              </Card>
            )}
          </div>
        )}

        {/* ROADMAP TAB (AI SaaS) */}
        {activeTab === 'roadmap' && project.type === 'ai_saas' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-4">14-day project roadmap. Each completed day includes a progress video from your admin.</p>
            {project.roadmap.map(item => (
              <Card key={item.day} className={`border transition-all ${item.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    {item.completed
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      : <Circle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500">DAY {item.day}</span>
                        {item.completed && <span className="text-xs text-emerald-500">Complete</span>}
                        {!item.completed && item.videoUrl && <span className="text-xs text-slate-500">Video available</span>}
                      </div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      {item.description && <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>}

                      {/* Video embed */}
                      {item.videoUrl && item.completed && (
                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs text-blue-400 font-medium">Progress Video</span>
                          </div>
                          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700/50">
                            <iframe
                              width="100%"
                              height="100%"
                              src={item.videoUrl.replace('youtu.be/', 'youtube.com/embed/').replace('watch?v=', 'embed/')}
                              title={`Day ${item.day} Progress`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* DELIVERIES TAB */}
        {activeTab === 'deliveries' && (
          <div className="space-y-5">
            {pendingDeliveries > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300">You have <strong>{pendingDeliveries}</strong> delivery{pendingDeliveries > 1 ? 'ies' : ''} awaiting your review and sign-off.</p>
              </div>
            )}

            {deliveries.length === 0 ? (
              <Card className="bg-slate-800/60 border-slate-700/50 p-12 text-center">
                <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No deliveries yet. Your admin will add delivery cards as work progresses.</p>
              </Card>
            ) : (
              deliveries.map(d => (
                <Card key={d._id} className={`border transition-all ${d.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' : d.status === 'client_reviewing' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-800/60 border-slate-700/50'}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-blue-400">D{d.deliveryNumber}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status] ?? 'bg-slate-600/50 text-slate-400'}`}>
                            {d.status === 'client_reviewing' ? 'Awaiting Your Review' : d.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{d.title}</h3>
                      </div>
                      {d.status === 'approved' && (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium">Signed Off</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mb-4">{d.description}</p>

                    {d.proofS3Key && (
                      <a
                        href={d.proofS3Key}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg px-3 py-2 mb-4 text-xs transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-slate-400 flex-1 truncate">{d.proofS3Key.split('/').pop()}</span>
                        <ExternalLink className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      </a>
                    )}

                    {d.clientFeedback && (
                      <p className="text-xs text-slate-400 mb-3">Your feedback: <span className="text-slate-300">"{d.clientFeedback}"</span></p>
                    )}

                    {d.signedOffAt && (
                      <p className="text-xs text-emerald-500">Signed off on {new Date(d.signedOffAt).toLocaleDateString()}</p>
                    )}

                    {/* Sign-off panel */}
                    {d.status === 'client_reviewing' && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        {signingOff === d._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={signOffFeedback}
                              onChange={e => setSignOffFeedback(e.target.value)}
                              placeholder="Add feedback (optional)..."
                              rows={2}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleSignOff(d._id!, 'approve')}
                                disabled={submittingSignOff}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 px-4 text-sm"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" /> Approve & Sign Off
                              </Button>
                              <Button
                                onClick={() => handleSignOff(d._id!, 'request_revision')}
                                disabled={submittingSignOff}
                                className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white rounded-xl h-9 px-4 text-sm"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" /> Request Revision
                              </Button>
                              <Button onClick={() => setSigningOff(null)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-9 px-3 text-sm">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setSigningOff(d._id!)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Review & Sign Off
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* CONTENT UPLOADS TAB (Content Distribution) */}
        {activeTab === 'content' && project.type === 'content_distribution' && (
          <div className="space-y-6">
            {/* Client Uploads */}
            <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
                <h2 className="text-sm font-semibold text-white">Your Uploads</h2>
                <p className="text-xs text-slate-500 mt-0.5">Upload your files below — they'll be stored and delivered securely</p>
              </div>
              <form onSubmit={submitContentUploads} className="p-6 space-y-5">
                {/* HD Photo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-slate-400" />
                      <label className="text-sm font-medium text-slate-300">HD Photo of Yourself</label>
                    </div>
                    {project.hdPhotoStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${UPLOAD_COLORS[project.hdPhotoStatus] ?? 'bg-slate-600/50 text-slate-400'}`}>
                        {project.hdPhotoStatus.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <FileUploadField
                    value={contentForm.hdPhotoS3Key}
                    onChange={url => setContentForm(f => ({ ...f, hdPhotoS3Key: url }))}
                    folder="content/hd-photos"
                    accept="image/*"
                    maxSizeMB={20}
                    hint="JPEG, PNG, or WebP · High resolution recommended"
                  />
                  {project.hdPhotoAdminFeedback && (
                    <p className="text-xs text-amber-400 mt-1.5 flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Admin feedback: {project.hdPhotoAdminFeedback}
                    </p>
                  )}
                </div>

                {/* Team Selfie Video */}
                <div className="pt-4 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-slate-400" />
                      <label className="text-sm font-medium text-slate-300">Team Selfie Video</label>
                    </div>
                    {project.teamSelfieVideoStatus && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${UPLOAD_COLORS[project.teamSelfieVideoStatus] ?? 'bg-slate-600/50 text-slate-400'}`}>
                        {project.teamSelfieVideoStatus.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <FileUploadField
                    value={contentForm.teamSelfieVideoS3Key}
                    onChange={url => setContentForm(f => ({ ...f, teamSelfieVideoS3Key: url }))}
                    folder="content/team-selfies"
                    accept="video/mp4,video/webm,video/quicktime"
                    maxSizeMB={100}
                    hint="MP4, WebM, or MOV"
                  />
                  {project.teamSelfieVideoAdminFeedback && (
                    <p className="text-xs text-amber-400 mt-1.5 flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Admin feedback: {project.teamSelfieVideoAdminFeedback}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={submittingContent} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm">
                  {submittingContent ? 'Saving...' : 'Save Uploads'}
                </Button>
              </form>
            </Card>

            {/* AI Clone Review */}
            {project.aiCloneSampleS3Key && (
              <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
                  <h2 className="text-sm font-semibold text-white">AI Clone Sample — Your Review</h2>
                </div>
                <div className="p-6 space-y-4">
                  <a
                    href={project.aiCloneSampleS3Key}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg px-3 py-2 text-xs transition-colors group"
                  >
                    <Video className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-slate-300 flex-1 truncate font-mono">{project.aiCloneSampleS3Key.split('/').pop()}</span>
                    <span className="text-blue-400 group-hover:text-blue-300 text-[11px]">View sample ↗</span>
                  </a>

                  {project.aiCloneApprovalStatus && project.aiCloneApprovalStatus !== 'pending_review' ? (
                    <div className={`flex items-center gap-2 ${project.aiCloneApprovalStatus === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {project.aiCloneApprovalStatus === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span className="text-sm font-medium">You {project.aiCloneApprovalStatus} this AI clone sample.</span>
                    </div>
                  ) : (
                    <form onSubmit={submitAiCloneReview} className="space-y-3">
                      <textarea
                        value={aiCloneForm.feedback}
                        onChange={e => setAiCloneForm(f => ({ ...f, feedback: e.target.value }))}
                        placeholder="Your feedback on the AI clone sample..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setAiCloneForm(f => ({ ...f, action: 'approved' }))}
                          className={`flex items-center gap-1.5 rounded-xl h-9 px-4 text-sm transition-all ${aiCloneForm.action === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setAiCloneForm(f => ({ ...f, action: 'rejected' }))}
                          className={`flex items-center gap-1.5 rounded-xl h-9 px-4 text-sm transition-all ${aiCloneForm.action === 'rejected' ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" /> Reject
                        </Button>
                        <Button
                          type="submit"
                          disabled={!aiCloneForm.action || submittingAiClone}
                          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm disabled:opacity-50"
                        >
                          {submittingAiClone ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </Card>
            )}

            {/* Branding Info */}
            <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
                <h2 className="text-sm font-semibold text-white">Branding & Delivery Info</h2>
              </div>
              <form onSubmit={submitContentUploads} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <label className="text-xs font-medium text-slate-300">Domain Name</label>
                    </div>
                    <Input
                      value={contentForm.domainName}
                      onChange={e => setContentForm(f => ({ ...f, domainName: e.target.value }))}
                      placeholder="yourdomain.com"
                      className="bg-slate-700 border-slate-600 text-white rounded-xl h-9 text-sm placeholder-slate-600"
                    />
                  </div>
                  <div>
                    <FileUploadField
                      label="Logo"
                      value={contentForm.logoS3Key}
                      onChange={url => setContentForm(f => ({ ...f, logoS3Key: url }))}
                      folder="content/logos"
                      accept="image/*"
                      maxSizeMB={5}
                      hint="PNG or SVG preferred"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    <label className="text-xs font-medium text-slate-300">Design Preferences</label>
                  </div>
                  <textarea
                    value={contentForm.designPreferences}
                    onChange={e => setContentForm(f => ({ ...f, designPreferences: e.target.value }))}
                    placeholder="e.g. Modern dark theme, primary color #0066FF, minimalist style..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none placeholder-slate-600"
                  />
                </div>
                <Button type="submit" disabled={submittingContent} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm">
                  {submittingContent ? 'Saving...' : 'Save Branding Info'}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  {project.type === 'ai_saas' ? 'Project Setup — 14-Day Scope' : 'Project Setup — 7-Day Scope'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {totalSetup > 0
                    ? `${completedSetup} of ${totalSetup} items completed`
                    : 'Your admin will add setup items for this project shortly.'}
                </p>
              </div>
              {totalSetup > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-32 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${totalSetup > 0 ? Math.round((completedSetup / totalSetup) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium w-8 text-right">
                    {totalSetup > 0 ? Math.round((completedSetup / totalSetup) * 100) : 0}%
                  </span>
                </div>
              )}
            </div>

            {setupItems.length === 0 ? (
              <Card className="bg-slate-800/60 border-slate-700/50 p-12 text-center">
                <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No setup items yet</p>
                <p className="text-slate-600 text-xs mt-1">Your admin will populate this checklist — check back soon.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {setupItems.map(item => (
                  <Card key={item._id} className={`border transition-all ${item.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Completion toggle */}
                        <button
                          onClick={() => toggleSetupItem(item._id!, item.completed)}
                          disabled={savingSetupId === item._id}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            item.completed
                              ? 'bg-emerald-500 hover:bg-emerald-400'
                              : 'bg-slate-700 border border-slate-600 hover:border-emerald-500'
                          }`}
                        >
                          {item.completed
                            ? <Check className="w-4 h-4 text-white" />
                            : <span className="text-xs font-bold text-slate-400">{item.itemNumber}</span>
                          }
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                            {item.title}
                          </p>

                          {editingSetupId === item._id ? (
                            <div className="mt-2 flex gap-2">
                              <Input
                                value={editSetupValue}
                                onChange={e => setEditSetupValue(e.target.value)}
                                placeholder="Your response…"
                                className="bg-slate-700 border-slate-600 text-white rounded-xl h-8 text-sm flex-1"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') saveSetupValue(item._id!); if (e.key === 'Escape') setEditingSetupId(null); }}
                              />
                              <Button
                                onClick={() => saveSetupValue(item._id!)}
                                disabled={savingSetupId === item._id}
                                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-8 px-3 text-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" /> Save
                              </Button>
                              <Button onClick={() => setEditingSetupId(null)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-8 px-3 text-xs">
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-400 flex-1">{item.value ?? '—'}</p>
                              {!item.completed && (
                                <button
                                  onClick={() => { setEditingSetupId(item._id!); setEditSetupValue(item.value ?? ''); }}
                                  className="p-1 hover:bg-slate-700 rounded text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
                                  title="Edit response"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {item.completed && item.completedAt && (
                          <span className="text-[10px] text-emerald-600 flex-shrink-0 mt-1">
                            {new Date(item.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white capitalize">{value}</p>
    </div>
  );
}

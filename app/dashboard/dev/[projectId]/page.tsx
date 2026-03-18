'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Project, Delivery, SetupItem } from '@/lib/types';
import {
  Package, Plus, X, CheckCircle2, Clock, AlertCircle,
  Eye, RotateCcw, Info, Video, Save, Calendar, DollarSign,
  User2, CheckSquare, Square, Film,
} from 'lucide-react';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 14px', borderRadius: 10,
  border: '1px solid #DDE5EC', background: 'rgba(58,141,222,0.04)',
  fontSize: 13, color: '#1E2A32', outline: 'none', boxSizing: 'border-box',
};

type Tab = 'overview' | 'roadmap' | 'deliveries' | 'setup';

type DeliveryStatus = Delivery['status'];
const D_STATUS: Record<DeliveryStatus, { label: string; style: React.CSSProperties; icon: React.ElementType }> = {
  pending:          { label: 'Pending',          icon: Clock,         style: { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 } },
  submitted:        { label: 'Submitted',         icon: Package,       style: { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 } },
  client_reviewing: { label: 'Client Reviewing',  icon: Eye,           style: { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 } },
  approved:         { label: 'Approved',           icon: CheckCircle2,  style: { background: 'rgba(107,207,122,0.12)', color: '#16a34a', border: '1px solid rgba(107,207,122,0.3)', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 } },
  revision_requested: { label: 'Revision Needed', icon: RotateCcw,     style: { background: '#fff1f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 } },
};

export default function DevProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [setupItems, setSetupItems] = useState<SetupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delivery form
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ title: '', description: '', proofS3Key: '' });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Roadmap video editing
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [projRes, delRes, setupRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`,            { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`/api/projects/${projectId}/deliveries`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`/api/projects/${projectId}/setup-items`,{ headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      if (projRes.success)  setProject(projRes.data);
      if (delRes.success)   setDeliveries(delRes.data);
      if (setupRes.success) setSetupItems(setupRes.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [projectId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryForm.title.trim()) return;
    setSubmittingDelivery(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deliveries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: deliveryForm.title, description: deliveryForm.description, deliveryNumber: deliveries.length + 1, proofS3Key: deliveryForm.proofS3Key || undefined }),
      });
      const result = await res.json();
      if (result.success) {
        notify('success', 'Delivery submitted for admin review');
        setDeliveryForm({ title: '', description: '', proofS3Key: '' });
        setShowDeliveryForm(false);
        fetchData();
      } else { notify('error', result.error || 'Failed to submit delivery'); }
    } catch { notify('error', 'Network error'); }
    finally { setSubmittingDelivery(false); }
  };

  const openVideoEdit = (day: number) => {
    const item = project?.roadmap.find(r => r.day === day);
    setVideoUrl(item?.videoUrl ?? '');
    setEditingDay(day);
  };

  const saveVideoUrl = async () => {
    if (!editingDay) return;
    setSavingVideo(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/roadmap/${editingDay}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      const result = await res.json();
      if (result.success) {
        setProject(prev => prev ? { ...prev, roadmap: prev.roadmap.map(r => r.day === editingDay ? { ...r, videoUrl } : r) } : prev);
        setEditingDay(null);
        notify('success', 'Video URL saved');
      } else { notify('error', result.error || 'Failed to save'); }
    } catch { notify('error', 'Network error'); }
    finally { setSavingVideo(false); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'roadmap',    label: 'Roadmap' },
    { id: 'deliveries', label: `Deliveries (${deliveries.length})` },
    { id: 'setup',      label: 'Setup' },
  ];

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(107,207,122,0.2)', borderTopColor: '#6BCF7A' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2' }}>
      <PageHeader
        title={project?.name || 'Project'}
        subtitle={project?.type?.replace(/_/g, ' ')}
        breadcrumbs={[{ label: 'Dev Portal', href: '/dashboard/dev' }, { label: project?.name || 'Project' }]}
        heroStrip
      />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Notification */}
        {notification && (
          <div style={notification.type === 'success'
            ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13 }
            : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13 }}>
            {notification.type === 'success' ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} /> : <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 12, border: '1px solid rgba(221,229,236,0.6)', width: 'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab.id ? '#6BCF7A' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#5F6B76',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(107,207,122,0.25)' : 'none',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && project && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[
              { icon: User2,       label: 'Type',        value: project.type.replace(/_/g, ' ') },
              { icon: CheckCircle2,label: 'Status',      value: project.status.replace(/-/g, ' ') },
              { icon: Calendar,    label: 'Start Date',  value: project.startDate ? new Date(project.startDate).toLocaleDateString() : '—' },
              { icon: Calendar,    label: 'End Date',    value: project.endDate ? new Date(project.endDate).toLocaleDateString() : '—' },
              { icon: DollarSign,  label: 'Total Price', value: project.totalPrice ? `$${project.totalPrice.toLocaleString()}` : '—' },
            ].map(row => (
              <div key={row.label} style={{ ...CARD, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(107,207,122,0.1)', border: '1px solid rgba(107,207,122,0.2)', flexShrink: 0 }}>
                  <row.icon style={{ width: 16, height: 16, color: '#6BCF7A' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3' }}>{row.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1E2A32', textTransform: 'capitalize' }}>{row.value}</p>
                </div>
              </div>
            ))}
            {project.description && (
              <div style={{ ...CARD, padding: '16px 20px', gridColumn: '1 / -1' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 8 }}>Description</p>
                <p style={{ fontSize: 13, color: '#5F6B76', lineHeight: 1.6 }}>{project.description}</p>
              </div>
            )}
          </div>
        )}

        {/* ── ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div>
            {(!project?.roadmap || project.roadmap.length === 0) ? (
              <div style={CARD}><EmptyState variant="projects" title="No roadmap yet" description="The admin hasn't initialized the roadmap for this project." /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(107,207,122,0.07)', border: '1px solid rgba(107,207,122,0.2)', marginBottom: 4 }}>
                  <Info style={{ width: 13, height: 13, color: '#16a34a', flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: '#5F6B76' }}>You can add video URLs to each day. All other fields are managed by the admin.</p>
                </div>
                {project.roadmap.map(item => (
                  <div key={item.day} style={{ ...CARD, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: item.completed ? 'rgba(107,207,122,0.12)' : 'rgba(58,141,222,0.08)', border: `1px solid ${item.completed ? 'rgba(107,207,122,0.3)' : 'rgba(58,141,222,0.2)'}` }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: item.completed ? '#16a34a' : '#3A8DDE' }}>D{item.day}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>{item.title}</h3>
                          {item.completed && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'rgba(107,207,122,0.12)', border: '1px solid rgba(107,207,122,0.25)', borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>Done</span>
                          )}
                        </div>
                        {item.description && <p style={{ fontSize: 12, color: '#5F6B76', lineHeight: 1.5, marginBottom: 8 }}>{item.description}</p>}

                        {/* Video URL area */}
                        {editingDay === item.day ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                            <input
                              type="url"
                              value={videoUrl}
                              onChange={e => setVideoUrl(e.target.value)}
                              placeholder="https://youtube.com/watch?v=..."
                              style={{ ...INPUT, flex: 1 }}
                              autoFocus
                            />
                            <button onClick={saveVideoUrl} disabled={savingVideo}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 9, background: '#6BCF7A', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                              {savingVideo ? <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Save style={{ width: 12, height: 12 }} />}
                              Save
                            </button>
                            <button onClick={() => setEditingDay(null)}
                              style={{ padding: '7px 10px', borderRadius: 9, background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', cursor: 'pointer', color: '#5F6B76' }}>
                              <X style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                            {item.videoUrl ? (
                              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#3A8DDE', textDecoration: 'none' }}>
                                <Film style={{ width: 12, height: 12 }} /> Watch Video
                              </a>
                            ) : (
                              <span style={{ fontSize: 11, color: '#8A97A3', fontStyle: 'italic' }}>No video yet</span>
                            )}
                            <button onClick={() => openVideoEdit(item.day)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#6BCF7A', background: 'rgba(107,207,122,0.08)', border: '1px solid rgba(107,207,122,0.2)', borderRadius: 7, padding: '3px 10px', cursor: 'pointer' }}>
                              <Video style={{ width: 11, height: 11 }} />
                              {item.videoUrl ? 'Edit URL' : 'Add Video'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DELIVERIES ── */}
        {activeTab === 'deliveries' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>Deliveries</h2>
                <p style={{ fontSize: 11, color: '#8A97A3', marginTop: 1 }}>{deliveries.length} deliver{deliveries.length !== 1 ? 'ies' : 'y'}</p>
              </div>
              <button onClick={() => setShowDeliveryForm(p => !p)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, background: '#6BCF7A', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {showDeliveryForm ? <X style={{ width: 13, height: 13 }} /> : <Plus style={{ width: 13, height: 13 }} />}
                {showDeliveryForm ? 'Cancel' : 'Add Delivery'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', border: '1px solid rgba(58,141,222,0.15)' }}>
              <Info style={{ width: 13, height: 13, color: '#3A8DDE', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: '#5F6B76', lineHeight: 1.5 }}>Deliveries go to admin for review before the client sees them.</p>
            </div>

            {showDeliveryForm && (
              <div style={{ ...CARD, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid rgba(221,229,236,0.5)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>New Delivery #{deliveries.length + 1}</h3>
                </div>
                <form onSubmit={submitDelivery} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 5 }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" value={deliveryForm.title} onChange={e => setDeliveryForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Initial prototype, Feature v1.2" required style={INPUT} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 5 }}>Description</label>
                    <textarea value={deliveryForm.description} onChange={e => setDeliveryForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what was delivered…" rows={3} style={{ ...INPUT, resize: 'vertical' }} />
                  </div>
                  <div>
                    <FileUploadField
                      label="Proof file (optional)"
                      value={deliveryForm.proofS3Key}
                      onChange={url => setDeliveryForm(p => ({ ...p, proofS3Key: url }))}
                      folder="deliveries"
                      accept=".zip,.pdf,video/*,image/*,application/pdf,application/zip"
                      maxSizeMB={100}
                      hint="ZIP, PDF, video, or image"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" disabled={submittingDelivery || !deliveryForm.title.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 10, background: '#6BCF7A', color: '#fff', border: 'none', cursor: 'pointer', opacity: (submittingDelivery || !deliveryForm.title.trim()) ? 0.6 : 1 }}>
                      {submittingDelivery ? <><div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Submitting…</> : <><Plus style={{ width: 13, height: 13 }} /> Submit Delivery</>}
                    </button>
                    <button type="button" onClick={() => { setShowDeliveryForm(false); setDeliveryForm({ title: '', description: '', proofS3Key: '' }); }}
                      style={{ fontSize: 13, fontWeight: 500, padding: '9px 18px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {deliveries.length === 0 && !showDeliveryForm ? (
              <div style={CARD}><EmptyState variant="projects" title="No deliveries yet" description="Click 'Add Delivery' to submit your first delivery." /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {deliveries.map((d, idx) => {
                  const sc = D_STATUS[d.status] || D_STATUS.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={d._id || idx} className="animate-fade-up" style={{ ...CARD, overflow: 'hidden', animationDelay: `${idx * 60}ms` }}>
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(107,207,122,0.1)', border: '1px solid rgba(107,207,122,0.2)' }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#6BCF7A' }}>D{d.deliveryNumber}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>{d.title}</h3>
                            <span style={{ ...sc.style, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                              <StatusIcon style={{ width: 9, height: 9 }} />{sc.label}
                            </span>
                          </div>
                          {d.description && <p style={{ fontSize: 12, color: '#5F6B76', lineHeight: 1.5 }}>{d.description}</p>}
                          {d.adminNotes && (
                            <p style={{ fontSize: 11, color: '#5F6B76', fontStyle: 'italic', marginTop: 6, padding: '6px 10px', background: 'rgba(58,141,222,0.06)', borderRadius: 8, border: '1px solid rgba(58,141,222,0.1)' }}>
                              Admin note: {d.adminNotes}
                            </p>
                          )}
                          {d.createdAt && <p style={{ fontSize: 10, color: '#8A97A3', marginTop: 6 }}>{new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SETUP ── */}
        {activeTab === 'setup' && (
          <div>
            {setupItems.length === 0 ? (
              <div style={CARD}><EmptyState variant="projects" title="No setup items" description="The admin hasn't added setup items for this project yet." /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {setupItems.map(item => (
                  <div key={item._id} style={{ ...CARD, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>
                      {item.completed
                        ? <CheckSquare style={{ width: 16, height: 16, color: '#6BCF7A' }} />
                        : <Square style={{ width: 16, height: 16, color: '#DDE5EC' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: item.completed ? '#1E2A32' : '#8A97A3' }}>{item.title}</p>
                      {item.completed && item.value ? (
                        <p style={{ fontSize: 12, color: '#334155', marginTop: 4, padding: '5px 10px', background: 'rgba(107,207,122,0.08)', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                          <span style={{ color: '#6BCF7A', fontWeight: 600, fontSize: 11 }}>Client: </span>{item.value}
                        </p>
                      ) : (
                        <p style={{ fontSize: 11, color: '#8A97A3', marginTop: 3, fontStyle: 'italic' }}>Awaiting client response</p>
                      )}
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: '#8A97A3', marginTop: 4 }}>
                  {setupItems.filter(i => i.completed).length}/{setupItems.length} items completed
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

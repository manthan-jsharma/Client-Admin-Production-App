'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Project } from '@/lib/types';
import {
  Code2, Plus, X, ChevronDown, ChevronUp, CheckCircle2, AlertCircle,
  Mail, Calendar, FolderKanban, UserPlus, Check, Search, Trash2, Pencil, Save,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: 18,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  borderRadius: 10,
  border: '1px solid #DDE5EC',
  background: 'rgba(58,141,222,0.04)',
  fontSize: 13,
  color: '#1E2A32',
  outline: 'none',
  boxSizing: 'border-box',
};

const avatarGradients = [
  'linear-gradient(135deg,#3A8DDE,#2F6FB2)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  'linear-gradient(135deg,#6BCF7A,#16a34a)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ec4899,#db2777)',
];

interface DevWithProjects extends User {
  assignedProjects?: string[];
}

export default function AdminDevsPage() {
  const [devs, setDevs] = useState<DevWithProjects[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedDevId, setExpandedDevId] = useState<string | null>(null);
  const [devProjects, setDevProjects] = useState<Record<string, string[]>>({});
  const [loadingDevProjects, setLoadingDevProjects] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editDev, setEditDev] = useState<{ id: string; name: string; email: string; password: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [assigningProject, setAssigningProject] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' });
  const [isAdding, setIsAdding] = useState(false);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const getToken = () => localStorage.getItem('auth_token');

  const fetchDevs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/devs', { headers: { Authorization: `Bearer ${getToken()}` } });
      const result = await res.json();
      if (result.success) setDevs(result.data);
    } catch {
      notify('error', 'Failed to load developers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllProjects = useCallback(async () => {
    try {
      const [projRes, clientRes] = await Promise.all([
        fetch('/api/projects', { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
        fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${getToken()}` } }).then(r => r.json()),
      ]);
      if (projRes.success) setAllProjects(projRes.data);
      if (clientRes.success) {
        const map: Record<string, string> = {};
        for (const c of clientRes.data) map[c._id] = c.name;
        setClientNames(map);
      }
    } catch {
      console.error('Failed to load projects');
    }
  }, []);

  useEffect(() => {
    fetchDevs();
    fetchAllProjects();
  }, [fetchDevs, fetchAllProjects]);

  const handleAddDev = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/devs', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const result = await res.json();
      if (result.success) {
        notify('success', 'Developer account created');
        setAddForm({ name: '', email: '', password: '' });
        setShowAddForm(false);
        fetchDevs();
      } else {
        notify('error', result.error || 'Failed to create developer');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsAdding(false);
    }
  };

  const loadDevProjects = async (devId: string) => {
    if (devProjects[devId]) return;
    setLoadingDevProjects(devId);
    try {
      const res = await fetch(`/api/admin/devs/${devId}/projects`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const result = await res.json();
      if (result.success) {
        const ids: string[] = (result.data as Project[]).map((p: Project) => p._id as string);
        setDevProjects(prev => ({ ...prev, [devId]: ids }));
      }
    } catch {
      console.error('Failed to load dev projects');
    } finally {
      setLoadingDevProjects(null);
    }
  };

  const handleToggleExpand = (devId: string) => {
    if (expandedDevId === devId) {
      setExpandedDevId(null);
    } else {
      setExpandedDevId(devId);
      setProjectSearch('');
      loadDevProjects(devId);
    }
  };

  const handleAssignProject = async (devId: string, projectId: string) => {
    setAssigningProject(projectId);
    try {
      const res = await fetch(`/api/admin/devs/${devId}/projects`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const result = await res.json();
      if (result.success) {
        setDevProjects(prev => ({
          ...prev,
          [devId]: [...(prev[devId] || []), projectId],
        }));
        notify('success', 'Project assigned successfully');
      } else {
        notify('error', result.error || 'Failed to assign project');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setAssigningProject(null);
    }
  };

  const handleUnassignProject = async (devId: string, projectId: string) => {
    setAssigningProject(projectId);
    try {
      const res = await fetch(`/api/admin/devs/${devId}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();
      if (result.success) {
        setDevProjects(prev => ({
          ...prev,
          [devId]: (prev[devId] || []).filter(id => id !== projectId),
        }));
        notify('success', 'Project unassigned');
      } else {
        notify('error', result.error || 'Failed to unassign project');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setAssigningProject(null);
    }
  };

  const handleEditDev = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDev) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/devs/${editDev.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editDev.name, email: editDev.email, ...(editDev.password && { password: editDev.password }) }),
      });
      const result = await res.json();
      if (result.success) {
        setDevs(prev => prev.map(d => d._id === editDev.id ? { ...d, name: editDev.name, email: editDev.email } : d));
        notify('success', 'Developer updated');
        setEditDev(null);
      } else notify('error', result.error || 'Failed to update');
    } catch { notify('error', 'Network error'); }
    finally { setIsSavingEdit(false); }
  };

  const handleDeleteDev = async (devId: string) => {
    try {
      const res = await fetch(`/api/admin/devs/${devId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const result = await res.json();
      if (result.success) { setDevs(prev => prev.filter(d => d._id !== devId)); notify('success', 'Developer removed'); }
      else notify('error', result.error || 'Failed to remove developer');
    } catch { notify('error', 'Network error'); }
    finally { setConfirmDeleteId(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2' }} className="animate-fade-up">
      <PageHeader
        title="Developer Team"
        subtitle="Manage dev access and project assignments"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Developers' }]}
        heroStrip
        actions={
          <button
            onClick={() => setShowAddForm(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, background: showAddForm ? '#ef4444' : '#3A8DDE', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
          >
            {showAddForm ? <X style={{ width: 14, height: 14 }} /> : <UserPlus style={{ width: 14, height: 14 }} />}
            {showAddForm ? 'Cancel' : 'Add Developer'}
          </button>
        }
      />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Notification */}
        {notification && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13,
            ...(notification.type === 'success'
              ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }),
          }}>
            {notification.type === 'success'
              ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
              : <AlertCircle  style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {notification.message}
          </div>
        )}

        {/* Add Developer Form */}
        {showAddForm && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(107,207,122,0.1)', border: '1px solid rgba(107,207,122,0.2)' }}>
                <Code2 style={{ width: 14, height: 14, color: '#6BCF7A' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>Add Developer</h3>
                <p style={{ fontSize: 11, color: '#8A97A3', marginTop: 1 }}>Create a new developer account</p>
              </div>
            </div>
            <form onSubmit={handleAddDev} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 6 }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Alex Johnson"
                    required
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 6 }}>
                    Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="dev@company.com"
                    required
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 6 }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Temporary password"
                    required
                    minLength={8}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={isAdding}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 10, background: '#6BCF7A', color: '#fff', border: 'none', cursor: isAdding ? 'not-allowed' : 'pointer', opacity: isAdding ? 0.6 : 1 }}
                >
                  {isAdding
                    ? <><div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Creating…</>
                    : <><Plus style={{ width: 14, height: 14 }} /> Create Developer</>}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddForm({ name: '', email: '', password: '' }); }}
                  style={{ fontSize: 13, fontWeight: 500, padding: '9px 18px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team Members section */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Team Members</h2>
            <p style={{ fontSize: 11, marginTop: 1, color: '#8A97A3' }}>
              {devs.length} developer{devs.length !== 1 ? 's' : ''} on your team
            </p>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            </div>
          ) : devs.length === 0 ? (
            <div style={CARD}>
              <EmptyState
                variant="clients"
                title="No developers yet"
                description="Add your first developer using the button above."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {devs.map((dev, idx) => {
                const isExpanded = expandedDevId === dev._id;
                const assignedIds = devProjects[dev._id as string] || [];

                return (
                  <div key={dev._id} className="animate-fade-up" style={{ ...CARD, overflow: 'hidden', animationDelay: `${idx * 60}ms` }}>
                    {/* Dev row */}
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Avatar */}
                      <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: avatarGradients[idx % avatarGradients.length], border: '2px solid rgba(255,255,255,0.8)' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                          {dev.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E2A32' }}>{dev.name}</h3>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(107,207,122,0.12)', color: '#6BCF7A', border: '1px solid rgba(107,207,122,0.25)' }}>
                            Dev
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5F6B76' }}>
                            <Mail style={{ width: 12, height: 12, color: '#8A97A3' }} />
                            {dev.email}
                          </div>
                          {dev.createdAt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5F6B76' }}>
                              <Calendar style={{ width: 12, height: 12, color: '#8A97A3' }} />
                              Joined {new Date(dev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5F6B76' }}>
                            <FolderKanban style={{ width: 12, height: 12, color: '#8A97A3' }} />
                            {assignedIds.length} project{assignedIds.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {/* Manage button */}
                        <button
                          onClick={() => handleToggleExpand(dev._id as string)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 9, background: isExpanded ? 'rgba(58,141,222,0.1)' : 'rgba(58,141,222,0.06)', color: '#3A8DDE', border: '1px solid rgba(58,141,222,0.2)', cursor: 'pointer', transition: 'all 0.12s' }}
                        >
                          {isExpanded ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                          Manage
                        </button>
                        {/* Edit button */}
                        <button
                          onClick={() => setEditDev({ id: dev._id as string, name: dev.name, email: dev.email, password: '' })}
                          title="Edit developer"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 9px', borderRadius: 9, background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC', cursor: 'pointer', transition: 'all 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eff8ff'; (e.currentTarget as HTMLElement).style.color = '#3A8DDE'; (e.currentTarget as HTMLElement).style.borderColor = '#c8dff0'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; (e.currentTarget as HTMLElement).style.color = '#8A97A3'; (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'; }}
                        >
                          <Pencil style={{ width: 13, height: 13 }} />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => setConfirmDeleteId(dev._id as string)}
                          title="Remove developer"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 9px', borderRadius: 9, background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC', cursor: 'pointer', transition: 'all 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff1f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = '#fecaca'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; (e.currentTarget as HTMLElement).style.color = '#8A97A3'; (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'; }}
                        >
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded project assignment panel */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid rgba(221,229,236,0.6)', padding: '16px 20px', background: 'rgba(233,238,242,0.4)' }}>
                        <div style={{ marginBottom: 12 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Project Assignments</h4>
                          <p style={{ fontSize: 11, color: '#8A97A3', marginTop: 2 }}>Check to assign; uncheck to remove</p>
                        </div>

                        {/* Search bar */}
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#8A97A3', pointerEvents: 'none' }} />
                          <input
                            type="text"
                            value={projectSearch}
                            onChange={e => setProjectSearch(e.target.value)}
                            placeholder="Search by project or client name…"
                            style={{ ...INPUT_STYLE, paddingLeft: 30, fontSize: 12 }}
                          />
                        </div>

                        {loadingDevProjects === dev._id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
                            <span style={{ fontSize: 12, color: '#8A97A3' }}>Loading projects…</span>
                          </div>
                        ) : allProjects.length === 0 ? (
                          <p style={{ fontSize: 12, color: '#8A97A3', fontStyle: 'italic' }}>No projects available to assign.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {allProjects.filter(p => {
                              const q = projectSearch.toLowerCase();
                              if (!q) return true;
                              const nameMatch = p.name.toLowerCase().includes(q);
                              const clientMatch = (clientNames[p.clientId] ?? p.clientId).toLowerCase().includes(q);
                              return nameMatch || clientMatch;
                            }).map(project => {
                              const isAssigned = assignedIds.includes(project._id as string);
                              const isCurrentlyChanging = assigningProject === project._id;
                              return (
                                <div
                                  key={project._id}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: isAssigned ? 'rgba(107,207,122,0.07)' : 'rgba(255,255,255,0.7)', border: `1px solid ${isAssigned ? 'rgba(107,207,122,0.25)' : '#DDE5EC'}`, transition: 'all 0.12s' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isAssigned ? 'rgba(107,207,122,0.12)' : 'rgba(58,141,222,0.08)', border: `1px solid ${isAssigned ? 'rgba(107,207,122,0.2)' : 'rgba(58,141,222,0.15)'}`, flexShrink: 0 }}>
                                      <FolderKanban style={{ width: 12, height: 12, color: isAssigned ? '#6BCF7A' : '#3A8DDE' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E2A32', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</p>
                                      <p style={{ fontSize: 11, color: '#8A97A3' }}>{clientNames[project.clientId] ?? 'Unknown client'} · {project.status}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => isAssigned
                                      ? handleUnassignProject(dev._id as string, project._id as string)
                                      : handleAssignProject(dev._id as string, project._id as string)
                                    }
                                    disabled={isCurrentlyChanging}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 8, flexShrink: 0, cursor: isCurrentlyChanging ? 'not-allowed' : 'pointer', opacity: isCurrentlyChanging ? 0.5 : 1, transition: 'all 0.12s',
                                      ...(isAssigned
                                        ? { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
                                        : { background: 'rgba(107,207,122,0.1)', color: '#16a34a', border: '1px solid rgba(107,207,122,0.25)' }),
                                    }}
                                  >
                                    {isCurrentlyChanging
                                      ? <div className="w-3 h-3 border border-current rounded-full animate-spin" style={{ borderTopColor: 'transparent' }} />
                                      : isAssigned
                                      ? <X style={{ width: 11, height: 11 }} />
                                      : <Check style={{ width: 11, height: 11 }} />}
                                    {isAssigned ? 'Remove' : 'Assign'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {/* Edit modal */}
      {editDev && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...CARD, maxWidth: 380, width: '100%', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E2A32' }}>Edit Developer</h3>
              <button onClick={() => setEditDev(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A97A3' }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <form onSubmit={handleEditDev} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A97A3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Name</label>
                <input value={editDev.name} onChange={e => setEditDev(p => p && ({ ...p, name: e.target.value }))} required style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A97A3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
                <input type="email" value={editDev.email} onChange={e => setEditDev(p => p && ({ ...p, email: e.target.value }))} required style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A97A3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>New Password <span style={{ color: '#8A97A3', fontWeight: 400, textTransform: 'none' }}>(leave blank to keep)</span></label>
                <input type="password" value={editDev.password} onChange={e => setEditDev(p => p && ({ ...p, password: e.target.value }))} placeholder="Enter new password" style={INPUT_STYLE} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={isSavingEdit} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 0', borderRadius: 10, background: '#3A8DDE', color: '#fff', border: 'none', cursor: 'pointer', opacity: isSavingEdit ? 0.6 : 1 }}>
                  <Save style={{ width: 13, height: 13 }} />{isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditDev(null)} style={{ fontSize: 13, fontWeight: 500, padding: '9px 16px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...CARD, maxWidth: 380, width: '100%', padding: 28, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2', border: '1px solid #fecaca', margin: '0 auto 16px' }}>
              <Trash2 style={{ width: 22, height: 22, color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E2A32', marginBottom: 8 }}>Remove Developer?</h3>
            <p style={{ fontSize: 13, color: '#5F6B76', lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently delete the developer account and all associated data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => handleDeleteDev(confirmDeleteId)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 10, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                <Trash2 style={{ width: 13, height: 13 }} /> Delete
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

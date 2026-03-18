'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Project, SetupItem } from '@/lib/types';
import {
  Settings2, CheckCircle2, Clock, Lightbulb, Check,
  Brain, Film, Pencil, Save, ClipboardList,
} from 'lucide-react';
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

const TYPE_STYLES = {
  ai_saas: { label: 'AI SaaS · 14-Day Scope', badgeBg: '#f5f3ff', badgeColor: '#8b5cf6', badgeBorder: '#ddd6fe', icon: Brain },
  content_distribution: { label: 'Content Distribution · 7-Day Scope', badgeBg: '#fffbeb', badgeColor: '#f59e0b', badgeBorder: '#fde68a', icon: Film },
};

export default function SetupPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [setupByProject, setSetupByProject] = useState<Record<string, SetupItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchSetupForProject = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/setup-items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setSetupByProject(prev => ({ ...prev, [projectId]: result.data }));
      }
    } catch (error) {
      console.error('Error fetching setup items:', error);
    }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          setProjects(result.data);
          const firstId = result.data[0]._id!;
          setActiveProjectId(firstId);
          await Promise.all(result.data.map((p: Project) => fetchSetupForProject(p._id!)));
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, fetchSetupForProject]);

  const toggleItem = async (itemId: string, current: boolean) => {
    setSavingId(itemId);
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed: !current }),
      });
      const result = await res.json();
      if (result.success && activeProjectId) {
        setSetupByProject(prev => ({
          ...prev,
          [activeProjectId]: prev[activeProjectId].map(s => s._id === itemId ? result.data : s),
        }));
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    } finally {
      setSavingId(null);
    }
  };

  const saveValue = async (itemId: string) => {
    setSavingId(itemId);
    try {
      const res = await fetch(`/api/setup-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: editValue }),
      });
      const result = await res.json();
      if (result.success && activeProjectId) {
        setSetupByProject(prev => ({
          ...prev,
          [activeProjectId]: prev[activeProjectId].map(s => s._id === itemId ? result.data : s),
        }));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving value:', error);
    } finally {
      setSavingId(null);
    }
  };

  const activeItems = activeProjectId ? (setupByProject[activeProjectId] ?? []) : [];
  const completedCount = activeItems.filter(s => s.completed).length;
  const progress = activeItems.length > 0 ? Math.round((completedCount / activeItems.length) * 100) : 0;

  const tips = [
    'Complete items in order for the smoothest project onboarding.',
    'Click the pencil icon to fill in your response for each item.',
    'Mark an item complete once you\'ve provided the required info.',
    'Reach out via chat if you need clarification on any item.',
  ];

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Project Setup"
        subtitle="Complete the onboarding checklist for each of your projects"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Project Setup' }]}
        heroStrip={true}
      />

      <div className="p-4 sm:p-6 md:p-8 space-y-6 animate-fade-up">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            variant="generic"
            title="No projects yet"
            description="Your admin will create projects and setup checklists for you."
          />
        ) : (
          <>
            {/* Project tab switcher */}
            <div className="flex gap-2 flex-wrap">
              {projects.map(p => {
                const ts = TYPE_STYLES[p.type as keyof typeof TYPE_STYLES];
                const TypeIcon = ts?.icon ?? Brain;
                const items = setupByProject[p._id!] ?? [];
                const done = items.filter(s => s.completed).length;
                const isActive = activeProjectId === p._id;
                return (
                  <button
                    key={p._id}
                    onClick={() => setActiveProjectId(p._id!)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200"
                    style={isActive
                      ? { background: '#eff8ff', border: '1px solid #c8dff0', color: '#3A8DDE' }
                      : { background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#5F6B76' }
                    }
                  >
                    <TypeIcon className="w-3.5 h-3.5" style={{ color: ts?.badgeColor ?? '#5F6B76' }} />
                    <span className="truncate max-w-[160px]">{p.name}</span>
                    {items.length > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={done === items.length
                          ? { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A' }
                          : { background: '#f1f5f9', color: '#5F6B76' }
                        }
                      >
                        {done}/{items.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active project header */}
            {activeProjectId && (() => {
              const proj = projects.find(p => p._id === activeProjectId)!;
              const ts = TYPE_STYLES[proj.type as keyof typeof TYPE_STYLES];
              return (
                <div className="p-5" style={CARD}>
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {ts && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: ts.badgeBg, color: ts.badgeColor, border: `1px solid ${ts.badgeBorder}` }}
                          >
                            {ts.label}
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-semibold truncate" style={{ color: '#1E2A32', fontWeight: 800 }}>{proj.name}</h2>
                      <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>{completedCount} of {activeItems.length} items completed</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className="text-3xl font-bold"
                        style={{ color: progress === 100 ? '#6BCF7A' : '#3A8DDE' }}
                      >
                        {progress}%
                      </div>
                      {progress === 100 && (
                        <p className="text-xs mt-0.5 flex items-center justify-end gap-1" style={{ color: '#6BCF7A' }}>
                          <CheckCircle2 className="w-3 h-3" /> Complete!
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full rounded-full h-2" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: progress === 100
                          ? 'linear-gradient(90deg, #059669, #6BCF7A)'
                          : 'linear-gradient(90deg, #3A8DDE, #52b7f4)',
                      }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Setup items for active project */}
            <div className="space-y-2">
              {activeItems.length === 0 ? (
                <EmptyState
                  variant="generic"
                  title="No setup items yet"
                  description="Your admin will populate this checklist shortly."
                />
              ) : (
                activeItems.map((item, index) => (
                  <div
                    key={item._id}
                    className="transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      ...CARD,
                      border: item.completed ? '1px solid #a7f3d0' : '1px solid #DDE5EC',
                      background: item.completed ? '#f0fdf4' : 'rgba(255,255,255,0.72)',
                    }}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                      {/* Toggle / checkmark */}
                      <button
                        onClick={() => toggleItem(item._id!, item.completed)}
                        disabled={savingId === item._id}
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95"
                        style={item.completed
                          ? { background: '#6BCF7A', border: 'none' }
                          : { background: 'rgba(58,141,222,0.06)', border: '2px solid #DDE5EC' }
                        }
                        onMouseEnter={e => { if (!item.completed) (e.currentTarget as HTMLButtonElement).style.borderColor = '#3A8DDE'; }}
                        onMouseLeave={e => { if (!item.completed) (e.currentTarget as HTMLButtonElement).style.borderColor = '#DDE5EC'; }}
                      >
                        {item.completed
                          ? <Check className="w-5 h-5 text-white" />
                          : <span className="text-sm font-bold" style={{ color: '#5F6B76' }}>{index + 1}</span>
                        }
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-sm font-semibold mb-1"
                          style={item.completed
                            ? { color: '#8A97A3', textDecoration: 'line-through', textDecorationColor: '#a7f3d0' }
                            : { color: '#1E2A32', fontWeight: 800 }
                          }
                        >
                          {item.title}
                        </h3>

                        {editingId === item._id ? (
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              placeholder="Your response…"
                              className="flex-1 min-w-0 rounded-xl h-8 px-3 text-sm focus:outline-none"
                              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32', minWidth: '120px' }}
                              autoFocus
                              onFocus={e => { e.currentTarget.style.borderColor = '#3A8DDE'; }}
                              onBlur={e => { e.currentTarget.style.borderColor = '#DDE5EC'; }}
                              onKeyDown={e => { if (e.key === 'Enter') saveValue(item._id!); if (e.key === 'Escape') setEditingId(null); }}
                            />
                            <button
                              onClick={() => saveValue(item._id!)}
                              disabled={savingId === item._id}
                              className="rounded-xl h-8 px-3 text-xs flex items-center gap-1 font-semibold flex-shrink-0"
                              style={{ background: '#3A8DDE', color: '#fff' }}
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-xl h-8 px-3 text-xs transition-all duration-150 active:scale-95 flex-shrink-0"
                              style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xs flex-1" style={{ color: '#5F6B76' }}>{item.value ?? '—'}</p>
                            {!item.completed && (
                              <button
                                onClick={() => { setEditingId(item._id!); setEditValue(item.value ?? ''); }}
                                className="p-1 rounded transition-colors flex-shrink-0"
                                style={{ color: '#8A97A3' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#8A97A3'; }}
                                title="Edit response"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {item.completedAt && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#6BCF7A' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            Completed {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="hidden sm:block flex-shrink-0">
                        {item.completed ? (
                          <span className="pill-info flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium"
                            style={{ background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0', borderRadius: '9999px' }}
                          >
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="pill-pending flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium"
                            style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: '9999px' }}
                          >
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tips */}
            <div style={CARD}>
              <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <Lightbulb className="w-4 h-4" style={{ color: '#f59e0b' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>Setup Tips</h3>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#334155' }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#c8dff0' }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project, SetupItem } from '@/lib/types';
import {
  Settings2, CheckCircle2, Clock, Lightbulb, Check,
  Brain, Film, Pencil, Save, ClipboardList,
} from 'lucide-react';

const TYPE_STYLES = {
  ai_saas: { label: 'AI SaaS · 14-Day Scope', bg: 'bg-violet-500/15', text: 'text-violet-400', icon: Brain },
  content_distribution: { label: 'Content Distribution · 7-Day Scope', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Film },
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Project Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Complete the onboarding checklist for each of your projects</p>
      </div>

      <div className="p-8 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No projects yet</p>
            <p className="text-slate-600 text-sm mt-1">Your admin will create projects and setup checklists for you.</p>
          </Card>
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <TypeIcon className={`w-3.5 h-3.5 ${ts?.text ?? 'text-slate-400'}`} />
                    <span className="truncate max-w-[160px]">{p.name}</span>
                    {items.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        done === items.length
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
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
                <Card className="bg-slate-800/60 border-slate-700/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ts?.bg} ${ts?.text}`}>
                          {ts?.label}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-white">{proj.name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{completedCount} of {activeItems.length} items completed</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${progress === 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {progress}%
                      </div>
                      {progress === 100 && (
                        <p className="text-xs text-emerald-400 mt-0.5 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Complete!
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progress === 100
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-r from-blue-600 to-blue-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </Card>
              );
            })()}

            {/* Setup items for active project */}
            <div className="space-y-2">
              {activeItems.length === 0 ? (
                <Card className="bg-slate-800/60 border-slate-700/50 p-12 text-center">
                  <Settings2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No setup items yet</p>
                  <p className="text-slate-600 text-xs mt-1">Your admin will populate this checklist shortly.</p>
                </Card>
              ) : (
                activeItems.map((item, index) => (
                  <Card
                    key={item._id}
                    className={`border transition-all ${
                      item.completed
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-5 flex items-start gap-4">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleItem(item._id!, item.completed)}
                        disabled={savingId === item._id}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                          item.completed
                            ? 'bg-emerald-500 hover:bg-emerald-400'
                            : 'bg-slate-700 border-2 border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {item.completed
                          ? <Check className="w-5 h-5 text-white" />
                          : <span className="text-sm font-bold text-slate-400">{index + 1}</span>
                        }
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold mb-1 ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {item.title}
                        </h3>

                        {editingId === item._id ? (
                          <div className="flex gap-2 mt-1.5">
                            <Input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              placeholder="Your response…"
                              className="bg-slate-700 border-slate-600 text-white rounded-xl h-8 text-sm flex-1"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveValue(item._id!); if (e.key === 'Escape') setEditingId(null); }}
                            />
                            <Button
                              onClick={() => saveValue(item._id!)}
                              disabled={savingId === item._id}
                              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-8 px-3 text-xs flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save
                            </Button>
                            <Button onClick={() => setEditingId(null)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl h-8 px-3 text-xs">
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-400 flex-1">{item.value ?? '—'}</p>
                            {!item.completed && (
                              <button
                                onClick={() => { setEditingId(item._id!); setEditValue(item.value ?? ''); }}
                                className="p-1 hover:bg-slate-700 rounded text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
                                title="Edit response"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}

                        {item.completedAt && (
                          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed {new Date(item.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        {item.completed ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 text-xs rounded-full font-medium">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Tips */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Setup Tips</h3>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

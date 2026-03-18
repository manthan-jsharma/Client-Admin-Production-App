'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/lib/types';
import { Brain, Film, Calendar, ChevronRight, FolderKanban } from 'lucide-react';
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
  ai_saas: {
    label: 'AI SaaS',
    bgStyle: { background: '#f5f3ff', border: '1px solid #ddd6fe' },
    textColor: '#8b5cf6',
    badgeStyle: { background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd6fe' },
    icon: Brain,
    accentFrom: '#8b5cf6',
  },
  content_distribution: {
    label: 'Content Distribution',
    bgStyle: { background: '#fffbeb', border: '1px solid #fde68a' },
    textColor: '#f59e0b',
    badgeStyle: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' },
    icon: Film,
    accentFrom: '#f59e0b',
  },
};

const STATUS_COLORS: Record<string, { badgeStyle: React.CSSProperties; dotColor: string }> = {
  active:    { badgeStyle: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A', border: '1px solid #a7f3d0' }, dotColor: '#6BCF7A' },
  completed: { badgeStyle: { background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }, dotColor: '#3A8DDE' },
  planning:  { badgeStyle: { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }, dotColor: '#8A97A3' },
  'on-hold': { badgeStyle: { background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a' }, dotColor: '#f59e0b' },
};

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
        const result = await response.json();
        if (result.success) setProjects(result.data);
      } catch (error) { console.error('Failed to fetch projects:', error); }
      finally { setIsLoading(false); }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="My Projects"
        subtitle="Your active and past projects"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Projects' }]}
        heroStrip
      />

      <div className="p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#8A97A3' }}>Loading projects…</p>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map(project => {
              const ts = TYPE_STYLES[project.type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.ai_saas;
              const TypeIcon = ts.icon;
              const sc = STATUS_COLORS[project.status] ?? STATUS_COLORS.planning;
              const completedDays = project.roadmap?.filter(r => r.completed).length ?? 0;
              const totalDays = project.roadmap?.length ?? 0;
              const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

              return (
                <Link key={project._id} href={`/dashboard/client/${project._id}`}>
                  <div style={CARD} className="relative cursor-pointer group overflow-hidden h-full transition-all duration-200 hover:shadow-lg">
                    <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${ts.accentFrom}, transparent)` }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={ts.bgStyle}>
                          <TypeIcon className="w-5 h-5" style={{ color: ts.textColor }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={ts.badgeStyle}>{ts.label}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold" style={sc.badgeStyle}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dotColor }} />
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold mb-1.5" style={{ color: '#1E2A32' }}>{project.name}</h3>
                      <p className="text-xs line-clamp-2 mb-4 leading-relaxed" style={{ color: '#5F6B76' }}>{project.description}</p>

                      <div className="flex items-center gap-2 text-xs mb-4" style={{ color: '#5F6B76' }}>
                        <Calendar className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />
                        <span>{new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}</span>
                      </div>

                      {project.type === 'ai_saas' && totalDays > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-xs" style={{ color: '#5F6B76' }}>Roadmap Progress</span>
                            <span className="text-xs font-semibold tabular-nums" style={{ color: '#3A8DDE' }}>{progress}%</span>
                          </div>
                          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#DDE5EC' }}>
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(to right, #3A8DDE, #60b8f0)' }} />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <span className="text-xs" style={{ color: '#5F6B76' }}>
                          {project.type === 'ai_saas' ? `${completedDays}/${totalDays} days` : '7-day scope'}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: '#3A8DDE' }}>
                          View Project <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
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

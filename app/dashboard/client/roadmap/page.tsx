'use client';

import React, { useState, useEffect } from 'react';
import { Project } from '@/lib/types';
import { Map, CheckCircle2, Clock, Video, ExternalLink, Sparkles } from 'lucide-react';
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

export default function RoadmapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          const aiProjects = result.data.filter((p: any) => p.type === 'ai_saas');
          setProjects(aiProjects);
          setSelectedProjectId(aiProjects[0]?._id ?? null);
        }
      } catch (error) { console.error('[roadmap] fetch error:', error); }
      finally { setIsLoading(false); }
    };
    fetchProjects();
  }, []);

  const selectedProject = projects.find(p => p._id === selectedProjectId);
  const completedDays = selectedProject?.roadmap.filter(r => r.completed).length || 0;
  const totalDays = selectedProject?.roadmap.length || 14;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Project Roadmap"
        subtitle="Track your project timeline and daily milestones"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Roadmap' }]}
        heroStrip
      />

      <div className="p-8 space-y-6 animate-fade-up">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading roadmap…</p>
          </div>
        ) : projects.length > 0 ? (
          <>
            {/* Project Selector */}
            {projects.length > 1 && (
              <div
                className="flex items-center gap-1 p-1 rounded-xl w-fit"
                style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
              >
                {projects.map(project => (
                  <button
                    key={project._id}
                    onClick={() => setSelectedProjectId(project._id ?? null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={selectedProjectId === project._id
                      ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                      : { color: '#5F6B76' }
                    }
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}

            {selectedProject && (
              <>
                {/* Progress Overview */}
                <div className="relative overflow-hidden p-6" style={CARD}>
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }} />
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-base font-bold mb-1" style={{ color: '#1E2A32' }}>{selectedProject.name}</h2>
                      <p className="text-sm" style={{ color: '#5F6B76' }}>
                        <span className="font-semibold" style={{ color: '#1E2A32' }}>{completedDays}</span> of {totalDays} days completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold tabular-nums" style={{ color: '#3A8DDE' }}>{Math.round(progressPercentage)}%</div>
                      <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>progress</p>
                    </div>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: '#f1f5f9' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${progressPercentage}%`, background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs" style={{ color: '#8A97A3' }}>Day 1</span>
                    <span className="text-xs" style={{ color: '#8A97A3' }}>Day {totalDays}</span>
                  </div>

                  {completedDays === totalDays && totalDays > 0 && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl w-fit" style={{ background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0' }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: '#6BCF7A' }} />
                      <span className="text-xs font-semibold" style={{ color: '#6BCF7A' }}>Project complete! 🎉</span>
                    </div>
                  )}
                </div>

                {/* 14-Day Grid */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#5F6B76' }}>Daily Timeline</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {selectedProject.roadmap.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-xl p-4 transition-all cursor-default"
                        style={item.completed
                          ? { background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0', borderRadius: '12px' }
                          : { background: '#ffffff', border: '1px solid #DDE5EC', borderRadius: '12px' }
                        }
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8A97A3' }}>Day</span>
                          {item.completed
                            ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#6BCF7A' }} />
                            : <Clock className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />}
                        </div>
                        <div
                          className="text-2xl font-bold mb-1.5 tabular-nums"
                          style={{ color: item.completed ? '#6BCF7A' : '#1E2A32' }}
                        >
                          {item.day}
                        </div>
                        <p className="text-[11px] leading-snug line-clamp-2 mb-2" style={{ color: '#5F6B76' }}>{item.title}</p>
                        {item.videoUrl && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] transition-colors"
                            style={{ color: '#3A8DDE' }}
                          >
                            <Video className="w-3 h-3" /> Watch
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Details */}
                <div className="overflow-hidden" style={CARD}>
                  <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Detailed Timeline</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>Each day's deliverables and progress</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-0">
                      {selectedProject.roadmap.map((item, index) => (
                        <div key={item._id} className="flex gap-4">
                          <div className="flex flex-col items-center flex-shrink-0">
                            {/* Timeline node */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                              style={item.completed
                                ? { background: '#6BCF7A', border: '2px solid rgba(16,185,129,0.3)' }
                                : { background: '#f1f5f9', border: '2px solid #DDE5EC' }
                              }
                            >
                              {item.completed
                                ? <CheckCircle2 className="w-4 h-4 text-white" />
                                : <span className="text-xs font-bold" style={{ color: '#5F6B76' }}>{item.day}</span>}
                            </div>
                            {index < selectedProject.roadmap.length - 1 && (
                              <div
                                className="w-px h-10 my-1 transition-colors"
                                style={{ background: item.completed ? 'rgba(16,185,129,0.3)' : '#DDE5EC' }}
                              />
                            )}
                          </div>
                          <div className="pb-6 flex-1 pt-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4
                                  className="text-sm font-medium leading-snug"
                                  style={item.completed
                                    ? { color: '#8A97A3', textDecoration: 'line-through', textDecorationColor: '#c8dff0' }
                                    : { color: '#1E2A32' }
                                  }
                                >
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5F6B76' }}>{item.description}</p>
                                )}
                              </div>
                              {item.videoUrl && (
                                <a
                                  href={item.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs ml-3 flex-shrink-0 transition-colors"
                                  style={{ color: '#3A8DDE' }}
                                >
                                  <ExternalLink className="w-3 h-3" /> Video
                                </a>
                              )}
                            </div>
                            {item.feedback && (
                              <div className="mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0' }}>
                                <p className="text-xs leading-relaxed" style={{ color: '#6BCF7A' }}>{item.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <EmptyState variant="projects" />
        )}
      </div>
    </div>
  );
}

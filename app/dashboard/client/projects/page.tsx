'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/types';
import { Brain, Film, Calendar, ChevronRight, FolderKanban } from 'lucide-react';

const TYPE_STYLES = {
  ai_saas: { label: 'AI SaaS', bg: 'bg-violet-500/15', text: 'text-violet-400', icon: Brain },
  content_distribution: { label: 'Content Distribution', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Film },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-blue-500/15 text-blue-400',
  planning: 'bg-slate-600/50 text-slate-300',
  'on-hold': 'bg-amber-500/15 text-amber-400',
};

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const result = await response.json();
        if (result.success) setProjects(result.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">My Projects</h1>
        <p className="text-sm text-slate-500 mt-1">Your active and past projects</p>
      </div>

      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {projects.map(project => {
              const ts = TYPE_STYLES[project.type] ?? TYPE_STYLES.ai_saas;
              const TypeIcon = ts.icon;
              const completedDays = project.roadmap?.filter(r => r.completed).length ?? 0;
              const totalDays = project.roadmap?.length ?? 0;
              const progress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

              return (
                <Link key={project._id} href={`/dashboard/client/${project._id}`}>
                  <Card className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200 cursor-pointer group h-full">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 ${ts.bg} rounded-xl flex items-center justify-center`}>
                          <TypeIcon className={`w-5 h-5 ${ts.text}`} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ts.bg} ${ts.text}`}>{ts.label}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status] ?? 'bg-slate-700 text-slate-400'}`}>{project.status}</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1.5">{project.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{project.description}</p>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>{new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}</span>
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
                          {project.type === 'ai_saas' ? `${completedDays}/${totalDays} days` : '7-day scope'}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-blue-400 font-medium group-hover:gap-2 transition-all">
                          View Project <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No projects assigned yet</p>
            <p className="text-slate-600 text-sm">Your admin will assign projects here. Check back soon!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

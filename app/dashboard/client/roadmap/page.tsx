'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/types';
import {
  Map,
  CheckCircle2,
  Clock,
  Video,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function RoadmapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          setProjects(result.data);
          setSelectedProjectId(result.data[0]._id ?? null);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const selectedProject = projects.find(p => p._id === selectedProjectId);
  const completedDays = selectedProject?.roadmap.filter(r => r.completed).length || 0;
  const totalDays = selectedProject?.roadmap.length || 14;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Project Roadmap</h1>
        <p className="text-sm text-slate-500 mt-1">Track your 14-day project timeline</p>
      </div>

      <div className="p-8 space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : projects.length > 0 ? (
          <>
            {/* Project Selector */}
            {projects.length > 1 && (
              <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl w-fit">
                {projects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => setSelectedProjectId(project._id ?? null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedProjectId === project._id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}

            {selectedProject && (
              <>
                {/* Progress Overview */}
                <Card className="bg-slate-800/60 border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-semibold text-white mb-1">{selectedProject.name}</h2>
                      <p className="text-sm text-slate-500">{completedDays} of {totalDays} days completed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-400">{Math.round(progressPercentage)}%</div>
                      <p className="text-xs text-slate-500 mt-0.5">overall progress</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-600">Start</span>
                    <span className="text-xs text-slate-600">Day 14</span>
                  </div>
                </Card>

                {/* 14-Day Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">14-Day Timeline</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    {selectedProject.roadmap.map((item) => (
                      <Card
                        key={item._id}
                        className={`p-4 border transition-all cursor-pointer ${
                          item.completed
                            ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Day</span>
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className={`text-2xl font-bold mb-2 ${item.completed ? 'text-emerald-400' : 'text-white'}`}>
                          {item.day}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{item.title}</p>
                        {item.videoUrl && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Video className="w-3 h-3" />
                            Watch
                          </a>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Timeline Details */}
                <Card className="bg-slate-800/60 border-slate-700/50">
                  <div className="px-6 py-4 border-b border-slate-700/50">
                    <h3 className="text-sm font-semibold text-white">Timeline Details</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-0">
                      {selectedProject.roadmap.map((item, index) => (
                        <div key={item._id} className="flex gap-4">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.completed
                                ? 'bg-emerald-500'
                                : 'bg-slate-700 border-2 border-slate-600'
                            }`}>
                              {item.completed
                                ? <CheckCircle2 className="w-4 h-4 text-white" />
                                : <span className="text-xs font-bold text-slate-400">{item.day}</span>
                              }
                            </div>
                            {index < selectedProject.roadmap.length - 1 && (
                              <div className={`w-0.5 h-10 my-1 ${item.completed ? 'bg-emerald-500/30' : 'bg-slate-700'}`} />
                            )}
                          </div>
                          <div className="pb-6 flex-1 pt-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className={`text-sm font-medium ${item.completed ? 'text-slate-400' : 'text-white'}`}>
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                                )}
                              </div>
                              {item.videoUrl && (
                                <a
                                  href={item.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 ml-3 flex-shrink-0 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Video
                                </a>
                              )}
                            </div>
                            {item.feedback && (
                              <div className="mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-xs text-emerald-400">{item.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )}
          </>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Map className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No projects found</p>
            <p className="text-slate-600 text-sm">Create or assign a project to view its roadmap</p>
          </Card>
        )}
      </div>
    </div>
  );
}

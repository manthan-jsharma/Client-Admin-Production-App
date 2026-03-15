'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/types';

export default function RoadmapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          setProjects(result.data);
          setSelectedProjectId(result.data[0]._id);
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
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Project Roadmap</h1>
        <p className="text-slate-400">Track your 14-day project timeline</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length > 0 ? (
          <>
            {/* Project Selector */}
            {projects.length > 1 && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-300 mb-3">Select Project</label>
                <div className="flex gap-2 flex-wrap">
                  {projects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => setSelectedProjectId(project._id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedProjectId === project._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedProject && (
              <>
                {/* Progress Overview */}
                <Card className="bg-slate-800 border-slate-700 p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.name}</h2>
                      <p className="text-slate-400">{completedDays} of {totalDays} days completed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-blue-400">{Math.round(progressPercentage)}%</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </Card>

                {/* 14-Day Timeline */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">14-Day Roadmap</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedProject.roadmap.map((item) => (
                      <Card
                        key={item._id}
                        className={`p-4 border-2 transition-all ${
                          item.completed
                            ? 'bg-green-500/10 border-green-500'
                            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-lg text-white">Day {item.day}</h4>
                          {item.completed && <span className="text-green-400">✓</span>}
                        </div>
                        <p className="text-slate-400 text-sm mb-2 line-clamp-2">{item.title}</p>
                        {item.videoUrl && (
                          <a
                            href={item.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 inline-block"
                          >
                            🎥 View Video
                          </a>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Detailed Timeline */}
                <Card className="bg-slate-800 border-slate-700 p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Timeline Details</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedProject.roadmap.map((item, index) => (
                      <div key={item._id} className="relative">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              item.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-slate-600 bg-slate-700'
                            }`}>
                              {item.completed && <span className="text-white text-xs">✓</span>}
                            </div>
                            {index < selectedProject.roadmap.length - 1 && (
                              <div className="w-0.5 h-12 bg-slate-700 my-1"></div>
                            )}
                          </div>
                          <div className="pb-4 flex-1">
                            <h4 className="font-bold text-white">{item.title}</h4>
                            <p className="text-slate-400 text-sm mt-1">{item.description}</p>
                            {item.feedback && (
                              <div className="mt-2 p-2 bg-green-500/10 border border-green-500/50 rounded">
                                <p className="text-green-400 text-xs font-medium">Feedback: {item.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </>
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <p className="text-slate-400 mb-2 font-medium">No projects found</p>
            <p className="text-slate-500 text-sm">Create or assign a project to view its roadmap</p>
          </Card>
        )}
      </div>
    </div>
  );
}

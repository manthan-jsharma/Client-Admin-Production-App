'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/types';

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
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
        if (result.success) {
          setProjects(result.data);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Your Projects</h1>
        <p className="text-slate-400">View and manage all your active projects</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Link key={project._id} href={`/dashboard/client/${project._id}`}>
                <Card className="bg-slate-800 border-slate-700 p-6 hover:border-blue-500 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{project.description}</p>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-slate-400">Overall Progress</span>
                        <span className="text-xs text-blue-400 font-medium">45%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400">Start Date</p>
                        <p className="text-white font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400">End Date</p>
                        <p className="text-white font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : project.status === 'completed'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <span className="text-blue-400 font-medium text-sm">View Details →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <div className="mb-4 text-4xl">📁</div>
            <p className="text-slate-400 mb-2 font-medium">No projects assigned yet</p>
            <p className="text-slate-500 text-sm">Your admin will assign projects here. Check back soon!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

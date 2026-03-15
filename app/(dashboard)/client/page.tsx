'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/types';

export default function ClientDashboard() {
  const { user } = useAuth();
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
        <h1 className="text-4xl font-bold text-white mb-2">Welcome, {user?.name}!</h1>
        <p className="text-slate-400">Here's an overview of your projects</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Active Projects</div>
            <div className="text-3xl font-bold text-white">{projects.length}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Total Progress</div>
            <div className="text-3xl font-bold text-white">45%</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Pending Tasks</div>
            <div className="text-3xl font-bold text-white">12</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Messages</div>
            <div className="text-3xl font-bold text-white">3</div>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Projects</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project._id} className="bg-slate-800 border-slate-700 p-6 hover:border-blue-500 transition-colors cursor-pointer">
                  <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{project.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-slate-400">Progress</span>
                      <span className="text-xs text-blue-400 font-medium">45%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                    <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                      View Details →
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <p className="text-slate-400 mb-4">No projects yet</p>
              <p className="text-sm text-slate-500">Your admin will assign projects here</p>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Updates</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-white">Website redesign phase 2 complete</p>
                  <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-white">New message from your admin</p>
                  <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Next Milestones</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Design Review</span>
                <span className="text-xs text-slate-400">Mar 20</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Development Sprint 1</span>
                <span className="text-xs text-slate-400">Mar 25</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

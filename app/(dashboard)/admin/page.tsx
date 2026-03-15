'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Project, User } from '@/lib/types';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        // Fetch projects
        const projectsResponse = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const projectsResult = await projectsResponse.json();
        if (projectsResult.success) {
          setProjects(projectsResult.data);
        }

        // Fetch clients (mock data from admin API)
        const clientsResponse = await fetch('/api/admin/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success) {
          setClients(clientsResult.data);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage projects, clients, and track progress</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Total Projects</div>
            <div className="text-3xl font-bold text-white">{projects.length}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Active Clients</div>
            <div className="text-3xl font-bold text-white">{clients.length}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Avg. Progress</div>
            <div className="text-3xl font-bold text-white">62%</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Revenue</div>
            <div className="text-3xl font-bold text-white">$45.2K</div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Projects Overview */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Recent Projects</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {projects.slice(0, 5).map((project) => (
                  <div key={project._id} className="p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-300'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{project.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 mr-3">
                        <div className="w-full bg-slate-600 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">45%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Clients Overview */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Active Clients</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {clients.slice(0, 5).map((client) => (
                  <div key={client._id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{client.name}</p>
                      <p className="text-xs text-slate-400">{client.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-400">
                        {client.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Project "Website Redesign" moved to active</p>
                <p className="text-xs text-slate-400 mt-1">Today at 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Client "Tech Startup Inc" joined</p>
                <p className="text-xs text-slate-400 mt-1">Yesterday at 3:45 PM</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Payment received for project "Mobile App"</p>
                <p className="text-xs text-slate-400 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

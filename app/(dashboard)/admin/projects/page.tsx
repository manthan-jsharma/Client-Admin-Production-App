'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project } from '@/lib/types';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    startDate: '',
    endDate: ''
  });

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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate)
        })
      });

      const result = await response.json();
      if (result.success) {
        setProjects([...projects, result.data]);
        setFormData({
          name: '',
          description: '',
          clientId: '',
          startDate: '',
          endDate: ''
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('[v0] Failed to create project:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
          <p className="text-slate-400">Manage all client projects</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {showCreateForm ? '✕ Cancel' : '+ New Project'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Create Form */}
        {showCreateForm && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client ID *</label>
                  <Input
                    type="text"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    placeholder="client-1"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Project description"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date *</label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Create Project
              </Button>
            </form>
          </Card>
        )}

        {/* Projects List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Card key={project._id} className="bg-slate-800 border-slate-700 p-6 hover:border-blue-500 transition-colors">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{project.description}</p>
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client</span>
                    <span className="text-white">{project.clientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Start Date</span>
                    <span className="text-white">{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">End Date</span>
                    <span className="text-white">{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700 flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                    View
                  </Button>
                  <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <div className="mb-4 text-4xl">📁</div>
            <p className="text-slate-400 mb-2 font-medium">No projects yet</p>
            <p className="text-slate-500 text-sm">Create a new project to get started</p>
          </Card>
        )}
      </div>
    </div>
  );
}

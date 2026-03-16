'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project } from '@/lib/types';
import {
  FolderKanban,
  Plus,
  X,
  Calendar,
  User2,
  ChevronRight,
  ExternalLink,
  Pencil,
  Search,
} from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const result = await response.json();
        if (result.success) setProjects(result.data);
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
        setFormData({ name: '', description: '', clientId: '', startDate: '', endDate: '' });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('[v0] Failed to create project:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-500 mt-1">{projects.length} total projects</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
              showCreateForm
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {showCreateForm ? (
              <><X className="w-4 h-4" /> Cancel</>
            ) : (
              <><Plus className="w-4 h-4" /> New Project</>
            )}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-base font-semibold text-white">Create New Project</h2>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Project Name <span className="text-red-400">*</span></label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Website Redesign"
                    className="bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Client ID <span className="text-red-400">*</span></label>
                  <Input
                    type="text"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    placeholder="e.g. client-1"
                    className="bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the project scope and goals..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-700/80 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Start Date <span className="text-red-400">*</span></label>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="bg-slate-700/80 border-slate-600 text-white focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">End Date <span className="text-red-400">*</span></label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="bg-slate-700/80 border-slate-600 text-white focus:border-blue-500 rounded-xl h-10"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20"
                >
                  Create Project
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl px-6 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <Card key={project._id} className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200 group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                      project.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1.5">{project.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{project.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Client: <span className="text-slate-300">{project.clientId}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>{new Date(project.startDate).toLocaleDateString()} — {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs text-slate-500">Progress</span>
                      <span className="text-xs font-medium text-blue-400">45%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5">
                      <ExternalLink className="w-3 h-3" /> View
                    </Button>
                    <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {searchQuery ? 'No projects match your search' : 'No projects yet'}
            </p>
            <p className="text-slate-600 text-sm">
              {searchQuery ? 'Try a different search term' : 'Click "New Project" to create your first project'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

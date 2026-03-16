'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Project } from '@/lib/types';
import Link from 'next/link';
import {
  FolderKanban,
  TrendingUp,
  CheckSquare,
  MessageSquare,
  ArrowRight,
  Clock,
  Calendar,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sub?: string;
}) {
  return (
    <Card className="bg-slate-800/60 border-slate-700/50 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </Card>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const updates = [
    { icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-400/10', text: 'Website redesign phase 2 complete', time: '2 hours ago' },
    { icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10', text: 'New message from your admin', time: '5 hours ago' },
    { icon: CheckSquare, color: 'text-purple-400', bg: 'bg-purple-400/10', text: 'Setup checklist item approved', time: 'Yesterday' },
  ];

  const milestones = [
    { name: 'Design Review', date: 'Mar 20', daysLeft: 5 },
    { name: 'Development Sprint 1', date: 'Mar 25', daysLeft: 10 },
    { name: 'User Testing', date: 'Apr 1', daysLeft: 17 },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name} 👋</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Today</p>
            <p className="text-sm font-medium text-slate-300">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Projects" value={projects.length} icon={FolderKanban} iconColor="text-blue-400" iconBg="bg-blue-400/10" />
          <StatCard label="Overall Progress" value="45%" icon={TrendingUp} iconColor="text-purple-400" iconBg="bg-purple-400/10" sub="Across all projects" />
          <StatCard label="Pending Tasks" value="12" icon={CheckSquare} iconColor="text-amber-400" iconBg="bg-amber-400/10" />
          <StatCard label="Unread Messages" value="3" icon={MessageSquare} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" />
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Your Projects</h2>
              <p className="text-xs text-slate-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} assigned</p>
            </div>
            <Link href="/dashboard/client/projects" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project._id} className="bg-slate-800/60 border-slate-700/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        project.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1.5">{project.name}</h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description}</p>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs text-slate-500">Progress</span>
                        <span className="text-xs font-medium text-blue-400">45%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all" style={{ width: '45%' }} />
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/client/${project._id}`}
                      className="flex items-center gap-1 text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors"
                    >
                      View details <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800/60 border-slate-700/50 p-10 text-center">
              <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium mb-1">No projects yet</p>
              <p className="text-slate-600 text-xs">Your admin will assign projects here</p>
            </Card>
          )}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Updates */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Recent Updates</h3>
            </div>
            <div className="p-5 space-y-4">
              {updates.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-white">{item.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming Milestones */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Upcoming Milestones</h3>
            </div>
            <div className="p-5 space-y-3">
              {milestones.map((milestone, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{milestone.name}</p>
                      <p className="text-xs text-slate-500">{milestone.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    milestone.daysLeft <= 7
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {milestone.daysLeft}d left
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

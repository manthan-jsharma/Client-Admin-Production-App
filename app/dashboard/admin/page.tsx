'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Project, User } from '@/lib/types';
import {
  FolderKanban,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: string;
  trendLabel?: string;
}) {
  return (
    <Card className="bg-slate-800/60 border-slate-700/50 p-5 hover:border-slate-600 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {trendLabel && <div className="text-xs text-slate-500 mt-1">{trendLabel}</div>}
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');

        const projectsResponse = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const projectsResult = await projectsResponse.json();
        if (projectsResult.success) setProjects(projectsResult.data);

        const clientsResponse = await fetch('/api/admin/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success) setClients(clientsResult.data);
      } catch (error) {
        console.error('[v0] Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').length;

  const activityItems = [
    { icon: FolderKanban, color: 'text-blue-400', bg: 'bg-blue-400/10', text: 'Project "Website Redesign" moved to active', time: 'Today at 10:30 AM' },
    { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10', text: 'Client "Tech Startup Inc" joined', time: 'Yesterday at 3:45 PM' },
    { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10', text: 'Payment received for project "Mobile App"', time: '2 days ago' },
    { icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10', text: 'Roadmap milestone completed for TechCorp', time: '3 days ago' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">Good morning,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name || 'Admin'} 👋</h1>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Projects"
            value={projects.length}
            icon={FolderKanban}
            iconColor="text-blue-400"
            iconBg="bg-blue-400/10"
            trend="+2 this week"
          />
          <StatCard
            label="Active Clients"
            value={clients.length}
            icon={Users}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            trendLabel={`${activeProjects} active projects`}
          />
          <StatCard
            label="Avg. Progress"
            value="62%"
            icon={TrendingUp}
            iconColor="text-purple-400"
            iconBg="bg-purple-400/10"
            trend="+8%"
          />
          <StatCard
            label="Total Revenue"
            value="$45.2K"
            icon={DollarSign}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            trend="+12.5%"
            trendLabel="vs last month"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Projects List - wider */}
          <Card className="lg:col-span-3 bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Recent Projects</h2>
                <p className="text-xs text-slate-500 mt-0.5">{projects.length} total projects</p>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project._id} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-700/40 transition-colors cursor-pointer group">
                      <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                          <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            project.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-1">
                            <div className="bg-blue-500 h-1 rounded-full" style={{ width: '45%' }} />
                          </div>
                          <span className="text-[11px] text-slate-500 flex-shrink-0">45%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FolderKanban className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No projects yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Clients - narrower */}
          <Card className="lg:col-span-2 bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Active Clients</h2>
                <p className="text-xs text-slate-500 mt-0.5">{clients.length} registered</p>
              </div>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : clients.length > 0 ? (
                <div className="space-y-2.5">
                  {clients.slice(0, 6).map((client) => (
                    <div key={client._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/40 transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {client.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{client.name}</p>
                        <p className="text-xs text-slate-500 truncate">{client.email}</p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No clients yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <div className="p-5 border-b border-slate-700/50">
            <h2 className="text-base font-semibold text-white">Recent Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest actions across all projects</p>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {activityItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
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
          </div>
        </Card>
      </div>
    </div>
  );
}

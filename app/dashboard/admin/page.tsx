'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Project, User, Payment } from '@/lib/types';
import Link from 'next/link';
import {
  FolderKanban,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  Brain,
  Film,
} from 'lucide-react';

function StatCard({
  label, value, icon: Icon, iconColor, iconBg, trend, trendLabel,
}: {
  label: string; value: string | number; icon: React.ElementType;
  iconColor: string; iconBg: string; trend?: string; trendLabel?: string;
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

/** Returns 0-100 roadmap progress for a project. */
function projectProgress(project: Project): number {
  if (project.roadmap && project.roadmap.length > 0) {
    const done = project.roadmap.filter(r => r.completed).length;
    return Math.round((done / project.roadmap.length) * 100);
  }
  return 0;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    Promise.all([
      fetch('/api/projects',      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/payments',{ headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([projRes, clientsRes, payRes]) => {
      if (projRes.success)    setProjects(projRes.data);
      if (clientsRes.success) setClients(clientsRes.data);
      if (payRes.success)     setPayments(payRes.data);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  // ─── Computed stats ──────────────────────────────────────────────────────────

  const activeProjects = projects.filter(p => p.status === 'active').length;

  const avgProgress = (() => {
    const aiProjects = projects.filter(p => p.type === 'ai_saas' && p.roadmap?.length > 0);
    if (!aiProjects.length) return 0;
    const total = aiProjects.reduce((sum, p) => sum + projectProgress(p), 0);
    return Math.round(total / aiProjects.length);
  })();

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // ─── Activity feed derived from real data ────────────────────────────────────
  type ActivityItem = { icon: React.ElementType; color: string; bg: string; text: string; time: string; sortKey: number };

  const activityItems: ActivityItem[] = [];

  // Recent projects
  [...projects]
    .sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime())
    .slice(0, 2)
    .forEach(p => {
      activityItems.push({
        icon: FolderKanban,
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        text: `Project "${p.name}" is ${p.status}`,
        time: new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sortKey: new Date(p.startDate ?? 0).getTime(),
      });
    });

  // Recent clients
  [...clients]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 2)
    .forEach(c => {
      activityItems.push({
        icon: Users,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        text: `Client "${c.name}" joined`,
        time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
        sortKey: new Date(c.createdAt ?? 0).getTime(),
      });
    });

  // Recent paid payments
  [...payments]
    .filter(p => p.status === 'paid')
    .sort((a, b) => new Date(b.paidDate ?? b.createdAt ?? 0).getTime() - new Date(a.paidDate ?? a.createdAt ?? 0).getTime())
    .slice(0, 2)
    .forEach(p => {
      const proj = projects.find(pr => pr._id === p.projectId);
      activityItems.push({
        icon: DollarSign,
        color: 'text-amber-400',
        bg: 'bg-amber-400/10',
        text: `Payment $${p.amount?.toLocaleString()} received${proj ? ` for "${proj.name}"` : ''}`,
        time: p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
        sortKey: new Date(p.paidDate ?? p.createdAt ?? 0).getTime(),
      });
    });

  // Completed roadmap days
  projects
    .filter(p => p.type === 'ai_saas')
    .forEach(p => {
      p.roadmap?.filter(r => r.completed).slice(-1).forEach(r => {
        activityItems.push({
          icon: CheckCircle2,
          color: 'text-purple-400',
          bg: 'bg-purple-400/10',
          text: `Day ${r.day} completed for "${p.name}"`,
          time: 'Recently',
          sortKey: 0,
        });
      });
    });

  const sortedActivity = activityItems
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, 5);

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
            trendLabel={`${activeProjects} active`}
          />
          <StatCard
            label="Active Clients"
            value={clients.length}
            icon={Users}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            trendLabel={`${activeProjects} active project${activeProjects !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Avg. Roadmap Progress"
            value={`${avgProgress}%`}
            icon={TrendingUp}
            iconColor="text-purple-400"
            iconBg="bg-purple-400/10"
            trendLabel="AI SaaS projects"
          />
          <StatCard
            label="Total Revenue"
            value={totalRevenue >= 1000 ? `$${(totalRevenue / 1000).toFixed(1)}K` : `$${totalRevenue}`}
            icon={DollarSign}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            trendLabel="From paid invoices"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Projects List */}
          <Card className="lg:col-span-3 bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Recent Projects</h2>
                <p className="text-xs text-slate-500 mt-0.5">{projects.length} total</p>
              </div>
              <Link href="/dashboard/admin/projects" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => {
                    const progress = projectProgress(project);
                    const TypeIcon = project.type === 'ai_saas' ? Brain : Film;
                    const typeColor = project.type === 'ai_saas' ? 'text-violet-400' : 'text-amber-400';
                    return (
                      <Link key={project._id} href={`/dashboard/admin/projects/${project._id}`}>
                        <div className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-700/40 transition-colors cursor-pointer group">
                          <div className={`w-9 h-9 ${project.type === 'ai_saas' ? 'bg-violet-500/10' : 'bg-amber-500/10'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                              <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                project.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {project.status}
                              </span>
                            </div>
                            {project.type === 'ai_saas' && project.roadmap?.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-700 rounded-full h-1">
                                  <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[11px] text-slate-500 flex-shrink-0">{progress}%</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600">
                                {project.type === 'content_distribution' ? '7-day scope' : 'Roadmap not started'}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FolderKanban className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No projects yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Clients */}
          <Card className="lg:col-span-2 bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Active Clients</h2>
                <p className="text-xs text-slate-500 mt-0.5">{clients.length} registered</p>
              </div>
              <Link href="/dashboard/admin/clients" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : clients.length > 0 ? (
                <div className="space-y-2.5">
                  {clients.slice(0, 6).map((client) => {
                    const clientProjects = projects.filter(p => p.clientId === client._id);
                    return (
                      <div key={client._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/40 transition-colors">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{client.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{client.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      </div>
                    );
                  })}
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
            {sortedActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No activity yet — add projects and clients to get started.</p>
            ) : (
              <div className="space-y-4">
                {sortedActivity.map((item, i) => {
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
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

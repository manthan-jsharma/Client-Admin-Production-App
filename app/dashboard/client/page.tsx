'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Project, Delivery } from '@/lib/types';
import Link from 'next/link';
import {
  FolderKanban, TrendingUp, CheckSquare, MessageSquare,
  ArrowRight, Clock, Calendar, ChevronRight, Brain, Film,
  Package, CheckCircle2,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, iconColor, iconBg, sub }: {
  label: string; value: string | number; icon: React.ElementType;
  iconColor: string; iconBg: string; sub?: string;
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

function projectProgress(project: Project): number {
  if (project.roadmap?.length > 0) {
    return Math.round(project.roadmap.filter(r => r.completed).length / project.roadmap.length * 100);
  }
  return 0;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    const fetchAll = async () => {
      try {
        const [projRes, notifRes] = await Promise.all([
          fetch('/api/projects',      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);

        let loadedProjects: Project[] = [];
        if (projRes.success) { setProjects(projRes.data); loadedProjects = projRes.data; }
        if (notifRes.success) setUnreadMessages(notifRes.data.unreadMessages ?? 0);

        // Fetch deliveries for all projects in parallel
        const allDeliveries = await Promise.all(
          loadedProjects.map(p =>
            fetch(`/api/projects/${p._id}/deliveries`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json())
              .then(res => res.success ? res.data as Delivery[] : [])
              .catch(() => [])
          )
        );
        setDeliveries(allDeliveries.flat());
      } catch (error) {
        console.error('Client dashboard fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ─── Derived stats ────────────────────────────────────────────────────────────

  const aiProjects = projects.filter(p => p.type === 'ai_saas' && p.roadmap?.length > 0);
  const overallProgress = aiProjects.length > 0
    ? Math.round(aiProjects.reduce((sum, p) => sum + projectProgress(p), 0) / aiProjects.length)
    : 0;

  const pendingDeliveries = deliveries.filter(d => d.status === 'client_reviewing').length;

  // ─── Recent updates derived from real data ────────────────────────────────────

  type UpdateItem = { icon: React.ElementType; color: string; bg: string; text: string; time: string };
  const updates: UpdateItem[] = [];

  // Pending deliveries awaiting review
  deliveries
    .filter(d => d.status === 'client_reviewing')
    .slice(0, 2)
    .forEach(d => {
      const proj = projects.find(p => p._id === d.projectId);
      updates.push({
        icon: Package,
        color: 'text-amber-400',
        bg: 'bg-amber-400/10',
        text: `Delivery "${d.title}" is awaiting your review${proj ? ` — ${proj.name}` : ''}`,
        time: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
      });
    });

  // Recently approved deliveries
  deliveries
    .filter(d => d.status === 'approved')
    .sort((a, b) => new Date(b.signedOffAt ?? 0).getTime() - new Date(a.signedOffAt ?? 0).getTime())
    .slice(0, 1)
    .forEach(d => {
      updates.push({
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        text: `You signed off on "${d.title}"`,
        time: d.signedOffAt ? new Date(d.signedOffAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
      });
    });

  // Recently completed roadmap days
  projects
    .filter(p => p.type === 'ai_saas')
    .forEach(p => {
      const lastDone = [...(p.roadmap ?? [])].filter(r => r.completed).pop();
      if (lastDone) {
        updates.push({
          icon: FolderKanban,
          color: 'text-blue-400',
          bg: 'bg-blue-400/10',
          text: `Day ${lastDone.day} of "${p.name}" completed`,
          time: 'Recently',
        });
      }
    });

  if (unreadMessages > 0) {
    updates.unshift({
      icon: MessageSquare,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      text: `You have ${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''} from your admin`,
      time: 'Now',
    });
  }

  // ─── Upcoming milestones from real roadmap ────────────────────────────────────

  type Milestone = { name: string; projectName: string; day: number; urgent: boolean };
  const milestones: Milestone[] = [];

  projects
    .filter(p => p.type === 'ai_saas')
    .forEach(p => {
      const upcoming = (p.roadmap ?? [])
        .filter(r => !r.completed)
        .slice(0, 2);
      upcoming.forEach(r => {
        const completedCount = (p.roadmap ?? []).filter(x => x.completed).length;
        const daysUntil = r.day - completedCount;
        milestones.push({
          name: r.title ?? `Day ${r.day}`,
          projectName: p.name,
          day: r.day,
          urgent: daysUntil <= 3,
        });
      });
    });

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
          <StatCard
            label="Active Projects"
            value={projects.length}
            icon={FolderKanban}
            iconColor="text-blue-400"
            iconBg="bg-blue-400/10"
          />
          <StatCard
            label="Overall Progress"
            value={aiProjects.length > 0 ? `${overallProgress}%` : '—'}
            icon={TrendingUp}
            iconColor="text-purple-400"
            iconBg="bg-purple-400/10"
            sub={aiProjects.length > 0 ? 'Across AI SaaS roadmaps' : 'No roadmap data yet'}
          />
          <StatCard
            label="Pending Reviews"
            value={pendingDeliveries}
            icon={CheckSquare}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            sub={pendingDeliveries > 0 ? 'Deliveries awaiting sign-off' : 'All caught up'}
          />
          <StatCard
            label="Unread Messages"
            value={unreadMessages}
            icon={MessageSquare}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            sub={unreadMessages > 0 ? 'From your admin' : 'No new messages'}
          />
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
              {projects.map((project) => {
                const progress = projectProgress(project);
                const TypeIcon = project.type === 'ai_saas' ? Brain : Film;
                const typeColor = project.type === 'ai_saas' ? 'text-violet-400' : 'text-amber-400';
                const typeBg = project.type === 'ai_saas' ? 'bg-violet-500/10' : 'bg-amber-500/10';
                const hasRoadmap = project.type === 'ai_saas' && project.roadmap?.length > 0;
                return (
                  <Card key={project._id} className="bg-slate-800/60 border-slate-700/50 hover:border-blue-500/50 transition-all duration-200">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-9 h-9 ${typeBg} rounded-lg flex items-center justify-center`}>
                          <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                        </div>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                          project.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white mb-1">{project.name}</h3>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description}</p>

                      {hasRoadmap ? (
                        <div className="mb-4">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-xs text-slate-500">Roadmap progress</span>
                            <span className="text-xs font-medium text-blue-400">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {project.roadmap.filter(r => r.completed).length}/{project.roadmap.length} days complete
                          </p>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <span className="text-xs text-slate-600">
                            {project.type === 'content_distribution' ? '7-day scope' : 'Roadmap not started yet'}
                          </span>
                        </div>
                      )}

                      <Link
                        href={`/dashboard/client/${project._id}`}
                        className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
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
            <div className="p-5">
              {updates.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No updates yet — check back after your admin adds project activity.</p>
              ) : (
                <div className="space-y-4">
                  {updates.slice(0, 4).map((item, i) => {
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
              )}
            </div>
          </Card>

          {/* Upcoming Milestones */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Upcoming Milestones</h3>
            </div>
            <div className="p-5">
              {milestones.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {projects.filter(p => p.type === 'ai_saas').length === 0
                    ? 'No AI SaaS projects with a roadmap yet.'
                    : 'All roadmap milestones completed — great work!'}
                </p>
              ) : (
                <div className="space-y-3">
                  {milestones.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.projectName} · Day {m.day}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        m.urgent ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        Day {m.day}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

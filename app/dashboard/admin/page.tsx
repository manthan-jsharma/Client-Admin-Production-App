'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Project, User, Payment } from '@/lib/types';
import Link from 'next/link';
import {
  FolderKanban, Users, TrendingUp, DollarSign,
  Clock, CheckCircle2, ChevronRight, Brain, Film, Sparkles,
} from 'lucide-react';
import { useCountUp } from '@/lib/use-count-up';
import { StatCardSkeleton, RowSkeleton } from '@/components/ui/skeleton';
import { Sparkline } from '@/components/ui/sparkline';
import { DonutRing } from '@/components/ui/donut-ring';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

function projectProgress(project: Project): number {
  if (project.roadmap?.length > 0)
    return Math.round(project.roadmap.filter(r => r.completed).length / project.roadmap.length * 100);
  return 0;
}

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: '18px',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#3A8DDE,#2F6FB2)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#6BCF7A,#4BAD5E)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
];

// Fake sparkline data — last 7 ticks
function seededSpark(base: number, variance = 0.3): number[] {
  return Array.from({ length: 7 }, (_, i) =>
    Math.max(0, base * (1 - variance + Math.sin(i * 1.3) * variance * 0.6 + Math.random() * variance * 0.4))
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients]   = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    Promise.all([
      fetch('/api/projects',       { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/clients',  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([pR, cR, payR]) => {
      if (pR.success)   setProjects(pR.data);
      if (cR.success)   setClients(cR.data);
      if (payR.success) setPayments(payR.data);
    }).catch(console.error).finally(() => {
      setIsLoading(false);
      setTimeout(() => setProgressVisible(true), 120);
    });
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const aiProjects     = projects.filter(p => p.type === 'ai_saas' && p.roadmap?.length > 0);
  const avgProgress    = aiProjects.length
    ? Math.round(aiProjects.reduce((s, p) => s + projectProgress(p), 0) / aiProjects.length) : 0;
  const totalRevenue   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0);

  const countProjects = useCountUp(projects.length, 900, !isLoading);
  const countClients  = useCountUp(clients.length,  900, !isLoading);
  const countProgress = useCountUp(avgProgress,    1000, !isLoading);
  const countRevenue  = useCountUp(totalRevenue,   1200, !isLoading);

  const stats = [
    {
      label: 'Total Projects', display: String(countProjects),
      sub: `${activeProjects} active`, icon: FolderKanban,
      accent: '#3A8DDE', accentBg: 'rgba(58,141,222,0.1)', accentBorder: 'rgba(58,141,222,0.2)',
      bar: 'linear-gradient(90deg,#3A8DDE,#6FB2F2)',
      spark: seededSpark(projects.length || 4, 0.4),
      sparkColor: '#3A8DDE',
    },
    {
      label: 'Active Clients', display: String(countClients),
      sub: 'Registered', icon: Users,
      accent: '#6BCF7A', accentBg: 'rgba(107,207,122,0.1)', accentBorder: 'rgba(107,207,122,0.2)',
      bar: 'linear-gradient(90deg,#6BCF7A,#8FE388)',
      spark: seededSpark(clients.length || 3, 0.3),
      sparkColor: '#6BCF7A',
    },
    {
      label: 'Avg. Progress', display: `${countProgress}%`,
      sub: 'Across AI SaaS', icon: TrendingUp,
      accent: '#8b5cf6', accentBg: 'rgba(139,92,246,0.1)', accentBorder: 'rgba(139,92,246,0.2)',
      bar: 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
      spark: seededSpark(avgProgress || 50, 0.25),
      sparkColor: '#8b5cf6',
      donut: true,
      donutColor: '#8b5cf6',
      donutValue: avgProgress,
    },
    {
      label: 'Total Revenue',
      display: countRevenue >= 1000 ? `$${(countRevenue / 1000).toFixed(1)}K` : `$${countRevenue}`,
      sub: 'From paid invoices', icon: DollarSign,
      accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.1)', accentBorder: 'rgba(245,158,11,0.2)',
      bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
      spark: seededSpark(totalRevenue || 5000, 0.35),
      sparkColor: '#f59e0b',
    },
  ];

  type ActivityItem = { icon: React.ElementType; color: string; bg: string; text: string; time: string; sortKey: number };
  const activityItems: ActivityItem[] = [];

  [...projects]
    .sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime())
    .slice(0, 2).forEach(p => activityItems.push({
      icon: FolderKanban, color: '#3A8DDE', bg: 'rgba(58,141,222,0.1)',
      text: `Project "${p.name}" is ${p.status}`,
      time: new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sortKey: new Date(p.startDate ?? 0).getTime(),
    }));

  [...clients]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 2).forEach(c => activityItems.push({
      icon: Users, color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)',
      text: `${c.name} joined as client`,
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
      sortKey: new Date(c.createdAt ?? 0).getTime(),
    }));

  [...payments].filter(p => p.status === 'paid')
    .sort((a, b) => new Date(b.paidDate ?? b.createdAt ?? 0).getTime() - new Date(a.paidDate ?? a.createdAt ?? 0).getTime())
    .slice(0, 2).forEach(p => {
      const proj = projects.find(pr => pr._id === p.projectId);
      activityItems.push({
        icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
        text: `$${p.amount?.toLocaleString()} received${proj ? ` · ${proj.name}` : ''}`,
        time: p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
        sortKey: new Date(p.paidDate ?? p.createdAt ?? 0).getTime(),
      });
    });

  projects.filter(p => p.type === 'ai_saas').forEach(p => {
    p.roadmap?.filter(r => r.completed).slice(-1).forEach(r => activityItems.push({
      icon: CheckCircle2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
      text: `Day ${r.day} completed · ${p.name}`,
      time: 'Recently', sortKey: 0,
    }));
  });

  const sortedActivity = activityItems.sort((a, b) => b.sortKey - a.sortKey).slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2' }}>
      <PageHeader
        title={user?.name || 'Admin'}
        subtitle="Here's what's happening across all your projects today."
        greeting={greeting}
        greetingIcon={Sparkles}
        heroStrip
        meta={
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A97A3', marginBottom: 2 }}>Today</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#5F6B76' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        }
      />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }} className="xl:grid-cols-4">
          <style>{`@media(min-width:1280px){.stat-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
          {isLoading
            ? [0,1,2,3].map(i => <StatCardSkeleton key={i} />)
            : stats.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="shimmer-hover animate-fade-up"
                    style={{ ...GLASS_CARD, animationDelay: `${idx * 70}ms`, overflow: 'hidden', position: 'relative', cursor: 'default', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(58,141,222,0.13), 0 4px 12px rgba(0,0,0,0.06)`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.boxShadow = GLASS_CARD.boxShadow as string;
                    }}
                  >
                    {/* Top gradient bar */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.bar, borderRadius: '18px 18px 0 0' }} />

                    <div style={{ padding: '20px 20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.accentBg, border: `1px solid ${s.accentBorder}` }}>
                          <Icon style={{ width: 16, height: 16, color: s.accent }} />
                        </div>
                        {s.donut ? (
                          <DonutRing progress={s.donutValue!} size={44} strokeWidth={4} color={s.donutColor!} label={`${avgProgress}%`} labelSize={9} />
                        ) : (
                          <Sparkline data={s.spark} color={s.sparkColor} width={72} height={30} />
                        )}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#1E2A32', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                        {s.display}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1E2A32', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#8A97A3' }}>{s.sub}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-5-3">
          <style>{`@media(min-width:1024px){.main-grid{grid-template-columns:3fr 2fr!important}}`}</style>
          <div style={{ display: 'grid', gap: 20 }} className="main-grid">
            {/* Recent Projects */}
            <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Recent Projects</h2>
                  <p style={{ fontSize: 11, marginTop: 1, color: '#8A97A3' }}>{projects.length} total</p>
                </div>
                <Link
                  href="/dashboard/admin/projects"
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 500, color: '#8A97A3', textDecoration: 'none', transition: 'color 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A97A3'}
                >
                  View all <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
              <div style={{ padding: 10 }}>
                {isLoading ? (
                  [0,1,2,3,4].map(i => <RowSkeleton key={i} delay={i * 60} />)
                ) : projects.length > 0 ? (
                  projects.slice(0, 5).map((project, pi) => {
                    const progress = projectProgress(project);
                    const isAI = project.type === 'ai_saas';
                    const TypeIcon = isAI ? Brain : Film;
                    return (
                      <Link key={project._id} href={`/dashboard/admin/projects/${project._id}`} style={{ textDecoration: 'none' }}>
                        <div
                          className="animate-fade-up"
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.12s', animationDelay: `${pi * 55}ms` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isAI ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isAI ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                            <TypeIcon style={{ width: 14, height: 14, color: isAI ? '#8b5cf6' : '#f59e0b' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isAI && project.roadmap?.length > 0 ? 6 : 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#1E2A32', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
                              <span className={
                                project.status === 'active'    ? 'pill-active' :
                                project.status === 'completed' ? 'pill-completed' : 'pill-muted'
                              } style={{ flexShrink: 0, fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                                {project.status}
                              </span>
                            </div>
                            {isAI && project.roadmap?.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#E9EEF2', overflow: 'hidden' }}>
                                  <div className="progress-bar" style={{ height: 4, borderRadius: 99, background: 'linear-gradient(90deg,#3A8DDE,#6FB2F2)', width: progressVisible ? `${progress}%` : '0%' }} />
                                </div>
                                <span style={{ fontSize: 11, color: '#8A97A3', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight style={{ width: 13, height: 13, color: '#DDE5EC', flexShrink: 0 }} />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <EmptyState
                    variant="projects"
                    title="No projects yet"
                    description="Create your first project to get started"
                  />
                )}
              </div>
            </div>

            {/* Clients */}
            <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Clients</h2>
                  <p style={{ fontSize: 11, marginTop: 1, color: '#8A97A3' }}>{clients.length} registered</p>
                </div>
                <Link
                  href="/dashboard/admin/clients"
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 500, color: '#8A97A3', textDecoration: 'none', transition: 'color 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A97A3'}
                >
                  View all <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
              <div style={{ padding: 10 }}>
                {isLoading ? (
                  [0,1,2,3,4].map(i => <RowSkeleton key={i} delay={i * 60} />)
                ) : clients.length > 0 ? (
                  clients.slice(0, 7).map((client, idx) => {
                    const clientProjects = projects.filter(p => p.clientId === client._id);
                    const isOnline = client.status === 'approved';
                    return (
                      <div
                        key={client._id}
                        className="animate-fade-up"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, transition: 'background 0.12s', cursor: 'default', animationDelay: `${idx * 55}ms` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.05)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length] }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{client.name?.charAt(0).toUpperCase()}</span>
                          </div>
                          {isOnline && (
                            <span className="presence-dot" style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#6BCF7A', border: '1.5px solid rgba(255,255,255,0.9)' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1E2A32', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</p>
                          <p style={{ fontSize: 11, color: '#8A97A3' }}>{clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState variant="clients" title="No clients yet" description="Approved clients will appear here" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)' }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Recent Activity</h2>
            <p style={{ fontSize: 11, marginTop: 1, color: '#8A97A3' }}>Latest across all projects</p>
          </div>
          <div style={{ padding: 20 }}>
            {sortedActivity.length === 0 ? (
              <p style={{ fontSize: 13, textAlign: 'center', padding: '24px 0', color: '#8A97A3' }}>No activity yet — add projects and clients to get started.</p>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 1, background: 'rgba(221,229,236,0.8)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {sortedActivity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', animationDelay: `${i * 60}ms` }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, background: item.bg, border: '2px solid rgba(255,255,255,0.8)' }}>
                          <Icon style={{ width: 13, height: 13, color: item.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                          <p style={{ fontSize: 13, color: '#1E2A32' }}>{item.text}</p>
                          <p style={{ fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, color: '#8A97A3' }}>
                            <Clock style={{ width: 11, height: 11 }} />{item.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

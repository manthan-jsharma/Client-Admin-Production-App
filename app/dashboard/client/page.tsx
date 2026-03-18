'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Project, Delivery } from '@/lib/types';
import Link from 'next/link';
import {
  FolderKanban, TrendingUp, CheckSquare, MessageSquare,
  ArrowRight, Clock, Calendar, ChevronRight, Brain, Film,
  Package, CheckCircle2, Sparkles, Zap,
} from 'lucide-react';
import { useCountUp } from '@/lib/use-count-up';
import { StatCardSkeleton } from '@/components/ui/skeleton';
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

function seededSpark(base: number, variance = 0.3): number[] {
  return Array.from({ length: 7 }, (_, i) =>
    Math.max(0, base * (1 - variance + Math.sin(i * 1.3) * variance * 0.6 + Math.random() * variance * 0.4))
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects]     = useState<Project[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [unreadMessages, setUnread] = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [progressVisible, setProgressVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const fetchAll = async () => {
      try {
        const [projRes, notifRes] = await Promise.all([
          fetch('/api/projects',      { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]);
        let loaded: Project[] = [];
        if (projRes.success)  { setProjects(projRes.data); loaded = projRes.data; }
        if (notifRes.success) setUnread(notifRes.data.unreadMessages ?? 0);

        const allDeliveries = await Promise.all(
          loaded.map(p =>
            fetch(`/api/projects/${p._id}/deliveries`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json()).then(res => res.success ? res.data as Delivery[] : []).catch(() => [])
          )
        );
        setDeliveries(allDeliveries.flat());
      } catch (e) { console.error(e); } finally {
        setIsLoading(false);
        setTimeout(() => setProgressVisible(true), 120);
      }
    };
    fetchAll();
  }, []);

  const aiProjects      = projects.filter(p => p.type === 'ai_saas' && p.roadmap?.length > 0);
  const overallProgress = aiProjects.length
    ? Math.round(aiProjects.reduce((s, p) => s + projectProgress(p), 0) / aiProjects.length) : 0;
  const pendingReviews  = deliveries.filter(d => d.status === 'client_reviewing').length;

  const countProjects = useCountUp(projects.length, 900, !isLoading);
  const countProgress = useCountUp(overallProgress, 1000, !isLoading);
  const countReviews  = useCountUp(pendingReviews,   900, !isLoading);
  const countMessages = useCountUp(unreadMessages,   900, !isLoading);

  const stats = [
    {
      label: 'Active Projects', display: String(countProjects),
      sub: `${projects.length} assigned`, icon: FolderKanban,
      accent: '#3A8DDE', accentBg: 'rgba(58,141,222,0.1)', accentBorder: 'rgba(58,141,222,0.2)',
      bar: 'linear-gradient(90deg,#3A8DDE,#6FB2F2)',
      spark: seededSpark(projects.length || 3, 0.4), sparkColor: '#3A8DDE',
    },
    {
      label: 'Overall Progress', display: aiProjects.length ? `${countProgress}%` : '—',
      sub: aiProjects.length ? 'AI SaaS roadmaps' : 'No roadmap yet', icon: TrendingUp,
      accent: '#8b5cf6', accentBg: 'rgba(139,92,246,0.1)', accentBorder: 'rgba(139,92,246,0.2)',
      bar: 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
      spark: seededSpark(overallProgress || 50, 0.3), sparkColor: '#8b5cf6',
      donut: true, donutColor: '#8b5cf6', donutValue: overallProgress,
    },
    {
      label: 'Pending Reviews', display: String(countReviews),
      sub: pendingReviews > 0 ? 'Need your sign-off' : 'All caught up ✓', icon: CheckSquare,
      accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.1)', accentBorder: 'rgba(245,158,11,0.2)',
      bar: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
      spark: seededSpark(pendingReviews || 2, 0.5), sparkColor: '#f59e0b',
    },
    {
      label: 'Unread Messages', display: String(countMessages),
      sub: unreadMessages > 0 ? 'From your admin' : 'No new messages', icon: MessageSquare,
      accent: '#6BCF7A', accentBg: 'rgba(107,207,122,0.1)', accentBorder: 'rgba(107,207,122,0.2)',
      bar: 'linear-gradient(90deg,#6BCF7A,#8FE388)',
      spark: seededSpark(unreadMessages || 1, 0.6), sparkColor: '#6BCF7A',
    },
  ];

  type UpdateItem = { icon: React.ElementType; color: string; bg: string; text: string; time: string };
  const updates: UpdateItem[] = [];

  if (unreadMessages > 0) updates.push({
    icon: MessageSquare, color: '#3A8DDE', bg: 'rgba(58,141,222,0.1)',
    text: `${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''} from your admin`, time: 'Now',
  });

  deliveries.filter(d => d.status === 'client_reviewing').slice(0, 2).forEach(d => {
    const proj = projects.find(p => p._id === d.projectId);
    updates.push({
      icon: Package, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
      text: `"${d.title}" is ready for your review${proj ? ` · ${proj.name}` : ''}`,
      time: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
    });
  });

  deliveries.filter(d => d.status === 'approved')
    .sort((a, b) => new Date(b.signedOffAt ?? 0).getTime() - new Date(a.signedOffAt ?? 0).getTime())
    .slice(0, 1).forEach(d => updates.push({
      icon: CheckCircle2, color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)',
      text: `You signed off on "${d.title}"`,
      time: d.signedOffAt ? new Date(d.signedOffAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently',
    }));

  projects.filter(p => p.type === 'ai_saas').forEach(p => {
    const last = [...(p.roadmap ?? [])].filter(r => r.completed).pop();
    if (last) updates.push({
      icon: FolderKanban, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
      text: `Day ${last.day} of "${p.name}" completed`, time: 'Recently',
    });
  });

  type Milestone = { name: string; projectName: string; day: number; urgent: boolean };
  const milestones: Milestone[] = [];
  projects.filter(p => p.type === 'ai_saas').forEach(p => {
    (p.roadmap ?? []).filter(r => !r.completed).slice(0, 2).forEach(r => {
      milestones.push({
        name: r.title ?? `Day ${r.day}`, projectName: p.name, day: r.day,
        urgent: r.day - (p.roadmap ?? []).filter(x => x.completed).length <= 3,
      });
    });
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2' }}>
      <PageHeader
        title={user?.name || 'Dashboard'}
        subtitle="Track your projects, reviews, and upcoming milestones."
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
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <style>{`@media(min-width:1280px){.cstat{grid-template-columns:repeat(4,1fr)!important}}`}</style>
          {isLoading
            ? [0,1,2,3].map(i => <StatCardSkeleton key={i} />)
            : stats.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="shimmer-hover animate-fade-up"
                    style={{ ...GLASS_CARD, animationDelay: `${idx * 70}ms`, overflow: 'hidden', position: 'relative', cursor: 'default', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(58,141,222,0.13), 0 4px 12px rgba(0,0,0,0.06)`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = GLASS_CARD.boxShadow as string; }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.bar, borderRadius: '18px 18px 0 0' }} />
                    <div style={{ padding: '20px 20px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.accentBg, border: `1px solid ${s.accentBorder}` }}>
                          <Icon style={{ width: 16, height: 16, color: s.accent }} />
                        </div>
                        {(s as any).donut ? (
                          <DonutRing progress={(s as any).donutValue} size={44} strokeWidth={4} color={(s as any).donutColor} label={`${overallProgress}%`} labelSize={9} />
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

        {/* Projects */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Your Projects</h2>
              <p style={{ fontSize: 11, marginTop: 1, color: '#8A97A3' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} assigned</p>
            </div>
            <Link
              href="/dashboard/client/projects"
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 500, color: '#8A97A3', textDecoration: 'none', transition: 'color 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#3A8DDE'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8A97A3'}
            >
              View all <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[0,1,2].map(i => <StatCardSkeleton key={i} />)}
            </div>
          ) : projects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {projects.map((project, pIdx) => {
                const progress = projectProgress(project);
                const isAI = project.type === 'ai_saas';
                const TypeIcon = isAI ? Brain : Film;
                const hasRoadmap = isAI && project.roadmap?.length > 0;
                const iconColor  = isAI ? '#8b5cf6' : '#f59e0b';
                const iconBg     = isAI ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)';
                const iconBorder = isAI ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)';
                const barColor   = isAI ? 'linear-gradient(90deg,#8b5cf6,#a78bfa)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)';

                return (
                  <div
                    key={project._id}
                    className="shimmer-hover animate-fade-up"
                    style={{ ...GLASS_CARD, overflow: 'hidden', position: 'relative', animationDelay: `${pIdx * 80}ms`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(58,141,222,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = GLASS_CARD.boxShadow as string; }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: barColor, borderRadius: '18px 18px 0 0' }} />
                    <div style={{ padding: '20px 20px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg, border: `1px solid ${iconBorder}` }}>
                          <TypeIcon style={{ width: 16, height: 16, color: iconColor }} />
                        </div>
                        <span
                          className={project.status === 'active' ? 'pill-active' : 'pill-muted'}
                          style={{ fontSize: 10, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}
                        >
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em', marginBottom: 6, lineHeight: 1.3 }}>{project.name}</h3>
                      <p style={{ fontSize: 12, color: '#5F6B76', marginBottom: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {project.description}
                      </p>

                      {hasRoadmap ? (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: '#8A97A3' }}>Roadmap</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#1E2A32', fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
                              <DonutRing progress={progressVisible ? progress : 0} size={28} strokeWidth={3} color={iconColor} />
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 5, borderRadius: 99, background: '#E9EEF2', overflow: 'hidden' }}>
                            <div className="progress-bar" style={{ height: 5, borderRadius: 99, background: barColor, width: progressVisible ? `${progress}%` : '0%' }} />
                          </div>
                          <p style={{ fontSize: 10, color: '#8A97A3', marginTop: 5 }}>
                            {project.roadmap.filter(r => r.completed).length} of {project.roadmap.length} days done
                          </p>
                        </div>
                      ) : (
                        <div style={{ marginBottom: 14 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '4px 10px', borderRadius: 8, background: '#f1f5f9', color: '#8A97A3', border: '1px solid #DDE5EC' }}>
                            <Zap style={{ width: 11, height: 11 }} />
                            {project.type === 'content_distribution' ? '7-day scope' : 'Roadmap not started'}
                          </span>
                        </div>
                      )}

                      <Link
                        href={`/dashboard/client/${project._id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#3A8DDE', textDecoration: 'none', transition: 'gap 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.gap = '8px'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.gap = '5px'}
                      >
                        View details <ArrowRight style={{ width: 13, height: 13 }} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={GLASS_CARD}>
              <EmptyState
                variant="projects"
                title="No projects yet"
                description="Your admin will assign projects here once you're set up"
              />
            </div>
          )}
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Recent Updates */}
          <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Recent Updates</h3>
            </div>
            <div style={{ padding: 20 }}>
              {updates.length === 0 ? (
                <p style={{ fontSize: 13, textAlign: 'center', padding: '24px 0', color: '#8A97A3' }}>No updates yet — check back after your admin adds activity.</p>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: 8, bottom: 8, width: 1, background: 'rgba(221,229,236,0.8)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {updates.slice(0, 4).map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', animationDelay: `${i * 60}ms` }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, background: item.bg, border: '2px solid rgba(255,255,255,0.8)' }}>
                            <Icon style={{ width: 13, height: 13, color: item.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                            <p style={{ fontSize: 13, color: '#1E2A32', lineHeight: 1.4 }}>{item.text}</p>
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

          {/* Upcoming Milestones */}
          <div style={{ ...GLASS_CARD, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Upcoming Milestones</h3>
            </div>
            <div style={{ padding: 14 }}>
              {milestones.length === 0 ? (
                <p style={{ fontSize: 13, textAlign: 'center', padding: '24px 0', color: '#8A97A3' }}>
                  {projects.filter(p => p.type === 'ai_saas').length === 0 ? 'No AI SaaS projects with a roadmap yet.' : 'All milestones completed — great work!'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {milestones.slice(0, 4).map((m, i) => (
                    <div
                      key={i}
                      className="animate-fade-up"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: 'rgba(233,238,242,0.6)', border: '1px solid rgba(221,229,236,0.6)', transition: 'background 0.12s', animationDelay: `${i * 70}ms` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.07)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(233,238,242,0.6)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <Calendar style={{ width: 13, height: 13, color: '#8b5cf6' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1E2A32', lineHeight: 1.3 }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: '#8A97A3' }}>{m.projectName} · Day {m.day}</p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 99, fontWeight: 600, flexShrink: 0,
                        ...(m.urgent
                          ? { background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' }
                          : { background: '#f1f5f9', color: '#8A97A3', border: '1px solid #DDE5EC' }),
                      }}>
                        {m.urgent ? 'Soon' : `Day ${m.day}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

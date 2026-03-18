'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Project } from '@/lib/types';
import Link from 'next/link';
import {
  FolderKanban, ArrowRight, Code2, Layers, Send, Link2, Link2Off, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCardSkeleton } from '@/components/ui/skeleton';

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

const STATUS_PILL: Record<string, React.CSSProperties> = {
  active:    { background: 'rgba(107,207,122,0.12)', color: '#16a34a', border: '1px solid rgba(107,207,122,0.3)', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 },
  completed: { background: 'rgba(58,141,222,0.1)',   color: '#3A8DDE', border: '1px solid rgba(58,141,222,0.25)',  borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 },
  'on-hold': { background: 'rgba(245,158,11,0.1)',   color: '#d97706', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 },
  planning:  { background: 'rgba(139,92,246,0.1)',   color: '#7c3aed', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 99, fontSize: 10, padding: '3px 10px', fontWeight: 700 },
};

export default function DevDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Telegram connect state
  const [tgConnected, setTgConnected] = useState(false);
  const [tgChatId, setTgChatId] = useState<string | null>(null);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDisconnecting, setTgDisconnecting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(res => { if (res.success) setProjects(res.data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch('/api/telegram/connect', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) { setTgConnected(data.connected); setTgChatId(data.chatId); } })
      .catch(() => {});
  }, []);

  const handleTgConnect = async () => {
    const win = window.open('', '_blank');
    setTgLoading(true);
    setTgDeepLink(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/telegram/connect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.deepLink) { setTgDeepLink(data.deepLink); if (win) win.location.href = data.deepLink; }
      else win?.close();
    } catch { win?.close(); } finally { setTgLoading(false); }
  };

  const handleTgDisconnect = async () => {
    setTgDisconnecting(true);
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/telegram/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setTgConnected(false); setTgChatId(null); setTgDeepLink(null);
    } catch {} finally { setTgDisconnecting(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2' }}>
      <PageHeader
        title="Developer Portal"
        subtitle="Your assigned projects"
        heroStrip
        meta={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(107,207,122,0.12)', border: '1px solid rgba(107,207,122,0.2)' }}>
              <Code2 style={{ width: 15, height: 15, color: '#6BCF7A' }} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8A97A3', lineHeight: 1.2 }}>Signed in as</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1E2A32', lineHeight: 1.2 }}>{user?.name}</p>
            </div>
          </div>
        }
      />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...GLASS_CARD, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(107,207,122,0.1)', border: '1px solid rgba(107,207,122,0.2)' }}>
              <FolderKanban style={{ width: 16, height: 16, color: '#6BCF7A' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1E2A32', letterSpacing: '-0.04em', lineHeight: 1 }}>{projects.length}</div>
              <div style={{ fontSize: 11, color: '#8A97A3', marginTop: 2 }}>Assigned Projects</div>
            </div>
          </div>
          <div style={{ ...GLASS_CARD, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(58,141,222,0.1)', border: '1px solid rgba(58,141,222,0.2)' }}>
              <Layers style={{ width: 16, height: 16, color: '#3A8DDE' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1E2A32', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div style={{ fontSize: 11, color: '#8A97A3', marginTop: 2 }}>Active</div>
            </div>
          </div>
        </div>

        {/* Projects section */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em' }}>Your Projects</h2>
            <p style={{ fontSize: 11, marginTop: 1, color: '#8A97A3' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you
            </p>
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {[0, 1, 2].map(i => <StatCardSkeleton key={i} />)}
            </div>
          ) : projects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {projects.map((project, idx) => {
                const pillStyle = STATUS_PILL[project.status] || STATUS_PILL.planning;
                const statusLabel = project.status.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
                const topBarColor = project.status === 'active'
                  ? 'linear-gradient(90deg,#6BCF7A,#8FE388)'
                  : project.status === 'completed'
                  ? 'linear-gradient(90deg,#3A8DDE,#6FB2F2)'
                  : 'linear-gradient(90deg,#8b5cf6,#a78bfa)';

                return (
                  <div
                    key={project._id}
                    className="animate-fade-up shimmer-hover"
                    style={{ ...GLASS_CARD, overflow: 'hidden', position: 'relative', animationDelay: `${idx * 70}ms`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(107,207,122,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = GLASS_CARD.boxShadow as string; }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: topBarColor, borderRadius: '16px 16px 0 0' }} />
                    <div style={{ padding: '20px 20px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(107,207,122,0.1)', border: '1px solid rgba(107,207,122,0.2)' }}>
                          <FolderKanban style={{ width: 16, height: 16, color: '#6BCF7A' }} />
                        </div>
                        <span style={pillStyle}>{statusLabel}</span>
                      </div>

                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E2A32', letterSpacing: '-0.01em', marginBottom: 4, lineHeight: 1.3 }}>
                        {project.name}
                      </h3>
                      <p style={{ fontSize: 11, color: '#8A97A3', marginBottom: 4 }}>
                        Client: <span style={{ color: '#5F6B76', fontWeight: 600 }}>{project.clientId}</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#5F6B76', marginBottom: 16, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {project.description}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(221,229,236,0.5)' }}>
                        <span style={{ fontSize: 11, color: '#8A97A3', fontWeight: 500, textTransform: 'capitalize' }}>
                          {project.type.replace(/_/g, ' ')}
                        </span>
                        <Link
                          href={`/dashboard/dev/${project._id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#6BCF7A', textDecoration: 'none', transition: 'gap 0.12s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.gap = '8px'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.gap = '5px'}
                        >
                          View Deliveries <ArrowRight style={{ width: 13, height: 13 }} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={GLASS_CARD}>
              <EmptyState
                variant="projects"
                title="No projects assigned"
                description="The admin will assign projects to you. Check back soon."
              />
            </div>
          )}
        </div>

        {/* Telegram Connect */}
        <div style={{ ...GLASS_CARD, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(58,141,222,0.08)', border: '1px solid rgba(58,141,222,0.15)' }}>
              <Send style={{ width: 18, height: 18, color: '#3A8DDE' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>Telegram Notifications</h2>
              <p style={{ fontSize: 11, color: '#5F6B76', marginTop: 2 }}>
                Connect your Telegram to receive instant alerts when you&apos;re assigned a project or mentioned in chat.
              </p>

              {tgConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#16a34a', background: 'rgba(107,207,122,0.12)', border: '1px solid rgba(107,207,122,0.25)', borderRadius: 99, padding: '4px 10px' }}>
                    <CheckCircle2 style={{ width: 12, height: 12 }} />
                    Connected{tgChatId ? ` · ${tgChatId}` : ''}
                  </div>
                  <button
                    onClick={handleTgDisconnect}
                    disabled={tgDisconnecting}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8A97A3', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Link2Off style={{ width: 13, height: 13 }} />
                    {tgDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 14 }}>
                  {!tgDeepLink ? (
                    <button
                      onClick={handleTgConnect}
                      disabled={tgLoading}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#3A8DDE', background: 'rgba(58,141,222,0.08)', border: '1px solid rgba(58,141,222,0.2)', borderRadius: 10, height: 34, padding: '0 14px', cursor: 'pointer' }}
                    >
                      <Link2 style={{ width: 13, height: 13 }} />
                      {tgLoading ? 'Generating link…' : 'Connect Telegram'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 11, color: '#5F6B76' }}>Telegram should have opened. If not:</p>
                      <a
                        href={tgDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#3A8DDE', background: 'rgba(58,141,222,0.08)', border: '1px solid rgba(58,141,222,0.2)', borderRadius: 10, height: 34, padding: '0 14px', textDecoration: 'none' }}
                      >
                        <ExternalLink style={{ width: 13, height: 13 }} />
                        Open in Telegram
                      </a>
                      <p style={{ fontSize: 10, color: '#8A97A3' }}>After sending /start, refresh to see connected status.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

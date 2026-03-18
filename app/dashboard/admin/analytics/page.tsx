'use client';

import React, { useState, useEffect } from 'react';
import { Project, Payment } from '@/lib/types';
import {
  DollarSign, FolderKanban, CheckCircle2, Star,
  TrendingUp, TrendingDown, Users, Clock, Target, ArrowUpRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: '18px',
};

const statusConfig: Record<string, { label: string; bar: string; color: string; bg: string; border: string; dot: string }> = {
  active:    { label: 'Active',    bar: '#6BCF7A', color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0', dot: '#6BCF7A' },
  completed: { label: 'Completed', bar: '#3A8DDE', color: '#3A8DDE', bg: '#eff8ff', border: '#c8dff0', dot: '#3A8DDE' },
  planning:  { label: 'Planning',  bar: '#f59e0b', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  'on-hold': { label: 'On Hold',   bar: '#94a3b8', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' },
};

export default function AdminAnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    Promise.all([
      fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([projRes, payRes]) => {
      if (projRes.success) setProjects(projRes.data);
      if (payRes.success) setPayments(payRes.data);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeClients = new Set(projects.map(p => p.clientId).filter(Boolean)).size;

  const avgDurationDays = (() => {
    const completed = projects.filter(p => p.status === 'completed');
    if (!completed.length) return 0;
    const durations = completed.map(p => {
      const s = new Date(p.startDate).getTime();
      const e = new Date(p.endDate).getTime();
      return isNaN(s) || isNaN(e) ? 0 : Math.round((e - s) / 86400000);
    });
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  })();

  const avgProjectValue = projects.length > 0 ? Math.round(totalRevenue / (projects.length || 1)) : 0;

  const projectsByStatus: Record<string, number> = {};
  projects.forEach(p => { projectsByStatus[p.status] = (projectsByStatus[p.status] ?? 0) + 1; });

  const now = new Date();
  const revenueByMonth = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const value = paidPayments
      .filter(p => {
        const pd = new Date(p.createdAt ?? p.dueDate ?? '');
        return `${pd.getFullYear()}-${pd.getMonth()}` === monthKey;
      })
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    return { month: MONTHS[d.getMonth()], value };
  });

  const maxRevenue = Math.max(...revenueByMonth.map(d => d.value), 1);
  const thisMonth = revenueByMonth[6]?.value ?? 0;
  const lastMonth = revenueByMonth[5]?.value ?? 0;
  const growthPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : null;
  const isPositiveGrowth = growthPct !== null && Number(growthPct) >= 0;

  const fmtCurrency = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
          <p className="text-xs" style={{ color: '#5F6B76' }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-up">
      <PageHeader
        title="Analytics"
        subtitle="Business performance and revenue insights"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Analytics' }]}
        heroStrip
        actions={growthPct !== null ? (
          <div
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={isPositiveGrowth
              ? { color: '#6BCF7A', background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0' }
              : { color: '#ef4444', background: '#fff1f2', border: '1px solid #fecada' }}
          >
            {isPositiveGrowth ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositiveGrowth ? '+' : ''}{growthPct}% vs last month
          </div>
        ) : undefined}
      />

      <div className="p-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue', value: fmtCurrency(totalRevenue),
              sub: growthPct !== null ? `${isPositiveGrowth ? '+' : ''}${growthPct}% this month` : 'No prior data',
              subColor: isPositiveGrowth ? '#6BCF7A' : '#8A97A3',
              icon: DollarSign, iconColor: '#f59e0b', iconBg: '#fffbeb',
              accentColor: '#f59e0b',
            },
            {
              label: 'Total Projects', value: projects.length,
              sub: `${activeClients} active client${activeClients !== 1 ? 's' : ''}`,
              subColor: '#8A97A3',
              icon: FolderKanban, iconColor: '#3A8DDE', iconBg: '#eff8ff',
              accentColor: '#3A8DDE',
            },
            {
              label: 'Completed', value: completedProjects,
              sub: avgDurationDays > 0 ? `Avg ${avgDurationDays} day delivery` : 'No completed yet',
              subColor: '#8A97A3',
              icon: CheckCircle2, iconColor: '#6BCF7A', iconBg: 'rgba(107,207,122,0.1)',
              accentColor: '#6BCF7A',
            },
            {
              label: 'Success Rate', value: projects.length > 0 ? `${Math.round((completedProjects / projects.length) * 100)}%` : '—',
              sub: `${completedProjects} delivered`,
              subColor: '#8b5cf6',
              icon: Star, iconColor: '#8b5cf6', iconBg: '#f5f3ff',
              accentColor: '#8b5cf6',
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={CARD}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${metric.accentColor}, ${metric.accentColor}88)` }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: metric.iconBg }}>
                      <Icon className="w-5 h-5" style={{ color: metric.iconColor }} />
                    </div>
                    <ArrowUpRight className="w-4 h-4" style={{ color: '#cbd5e1' }} />
                  </div>
                  <div className="text-2xl font-bold tabular-nums mb-0.5" style={{ color: '#1E2A32' }}>{metric.value}</div>
                  <div className="text-xs mb-1" style={{ color: '#8A97A3' }}>{metric.label}</div>
                  <div className="text-xs font-medium" style={{ color: metric.subColor }}>{metric.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Revenue Trend — wider */}
          <div className="lg:col-span-3 overflow-hidden" style={CARD}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 className="text-sm font-bold" style={{ color: '#1E2A32', fontWeight: 800 }}>Revenue Trend</h2>
                <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Monthly revenue from paid invoices</p>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: '#1E2A32' }}>{fmtCurrency(totalRevenue)}</span>
            </div>
            <div className="p-6 space-y-3">
              {revenueByMonth.map((data, i) => {
                const pct = data.value > 0 ? Math.round((data.value / maxRevenue) * 100) : 0;
                const isCurrent = i === 6;
                return (
                  <div key={data.month} className="flex items-center gap-4">
                    <span className="w-7 text-xs font-medium flex-shrink-0" style={{ color: isCurrent ? '#1E2A32' : '#8A97A3' }}>{data.month}</span>
                    <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: pct > 0 ? `${pct}%` : '0%', background: isCurrent ? '#3A8DDE' : '#cbd5e1' }}
                      />
                    </div>
                    <span className="text-xs tabular-nums flex-shrink-0 w-14 text-right font-medium" style={{ color: isCurrent ? '#1E2A32' : '#8A97A3' }}>
                      {data.value > 0 ? fmtCurrency(data.value) : '—'}
                    </span>
                  </div>
                );
              })}
              {paidPayments.length === 0 && (
                <p className="text-xs text-center pt-3" style={{ color: '#cbd5e1' }}>No paid invoices recorded yet</p>
              )}
            </div>
          </div>

          {/* Projects by Status — narrower */}
          <div className="lg:col-span-2 overflow-hidden" style={CARD}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-bold" style={{ color: '#1E2A32', fontWeight: 800 }}>Projects by Status</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>{projects.length} total</p>
            </div>
            <div className="p-6 space-y-3">
              {projects.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: '#cbd5e1' }}>No projects yet</p>
              ) : Object.entries(projectsByStatus).map(([status, count]) => {
                const config = statusConfig[status] ?? { label: status, bar: '#94a3b8', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' };
                const pct = Math.round((count / projects.length) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: config.dot }} />
                        <span className="text-xs font-medium" style={{ color: '#334155' }}>{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: '#cbd5e1' }}>{pct}%</span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                        >{count}</span>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: config.bar }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance KPIs */}
        <div className="overflow-hidden" style={CARD}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h2 className="text-sm font-bold" style={{ color: '#1E2A32', fontWeight: 800 }}>Performance Summary</h2>
            <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>Key performance indicators across all projects</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  value: projects.length > 0 ? `${Math.round((completedProjects / projects.length) * 100)}%` : '—',
                  label: 'Completion Rate', icon: Star, iconColor: '#3A8DDE', iconBg: '#eff8ff',
                },
                {
                  value: `${completedProjects}/${projects.length}`,
                  label: 'Projects Delivered', icon: CheckCircle2, iconColor: '#6BCF7A', iconBg: 'rgba(107,207,122,0.1)',
                },
                {
                  value: avgDurationDays > 0 ? `${avgDurationDays}d` : '—',
                  label: 'Avg Duration', icon: Clock, iconColor: '#8b5cf6', iconBg: '#f5f3ff',
                },
                {
                  value: avgProjectValue > 0 ? fmtCurrency(avgProjectValue) : '—',
                  label: 'Avg Project Value', icon: Target, iconColor: '#f59e0b', iconBg: '#fffbeb',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 p-4 rounded-xl transition-colors duration-100"
                    style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.iconBg }}>
                      <Icon className="w-5 h-5" style={{ color: item.iconColor }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: '#1E2A32' }}>{item.value}</div>
                      <p className="text-xs mt-0.5" style={{ color: '#8A97A3' }}>{item.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

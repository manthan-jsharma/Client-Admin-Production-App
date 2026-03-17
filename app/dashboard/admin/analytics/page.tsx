'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Project, Payment } from '@/lib/types';
import {
  DollarSign,
  FolderKanban,
  CheckCircle2,
  Star,
  TrendingUp,
  ArrowUpRight,
  Users,
  Clock,
  Target,
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusConfig: Record<string, { label: string; color: string; bar: string; badge: string }> = {
  active:    { label: 'Active',    color: 'text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400' },
  completed: { label: 'Completed', color: 'text-blue-400',    bar: 'bg-blue-500',    badge: 'bg-blue-500/15 text-blue-400' },
  planning:  { label: 'Planning',  color: 'text-amber-400',   bar: 'bg-amber-500',   badge: 'bg-amber-500/15 text-amber-400' },
  'on-hold': { label: 'On Hold',   color: 'text-red-400',     bar: 'bg-red-500',     badge: 'bg-red-500/15 text-red-400' },
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

  // ─── Derived metrics ────────────────────────────────────────────────────────

  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeClients = new Set(projects.map(p => p.clientId).filter(Boolean)).size;

  // Average project duration in days for completed projects
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

  const avgProjectValue = projects.length > 0
    ? Math.round(totalRevenue / (projects.length || 1))
    : 0;

  // Projects by status
  const projectsByStatus: Record<string, number> = {};
  projects.forEach(p => {
    const key = p.status === 'on-hold' ? 'on-hold' : p.status;
    projectsByStatus[key] = (projectsByStatus[key] ?? 0) + 1;
  });

  // Revenue by month (last 7 months)
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

  // Month-over-month growth
  const thisMonth = revenueByMonth[6]?.value ?? 0;
  const lastMonth = revenueByMonth[5]?.value ?? 0;
  const growthPct = lastMonth > 0
    ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Business insights and performance metrics</p>
          </div>
          {growthPct !== null && (
            <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
              Number(growthPct) >= 0
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-red-400 bg-red-400/10'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {Number(growthPct) >= 0 ? '+' : ''}{growthPct}% this month
            </span>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue',
              value: totalRevenue >= 1000 ? `$${(totalRevenue / 1000).toFixed(1)}K` : `$${totalRevenue}`,
              sub: growthPct !== null ? `${Number(growthPct) >= 0 ? '+' : ''}${growthPct}% from last month` : 'No prior month data',
              subColor: growthPct !== null && Number(growthPct) >= 0 ? 'text-emerald-400' : 'text-slate-500',
              icon: DollarSign, iconColor: 'text-amber-400', iconBg: 'bg-amber-400/10',
            },
            {
              label: 'Total Projects',
              value: projects.length,
              sub: `${activeClients} active client${activeClients !== 1 ? 's' : ''}`,
              subColor: 'text-slate-500',
              icon: FolderKanban, iconColor: 'text-blue-400', iconBg: 'bg-blue-400/10',
            },
            {
              label: 'Completed',
              value: completedProjects,
              sub: avgDurationDays > 0 ? `Avg. ${avgDurationDays} days` : 'No completed projects',
              subColor: 'text-slate-500',
              icon: CheckCircle2, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-400/10',
            },
            {
              label: 'Success Rate',
              value: projects.length > 0 ? `${Math.round((completedProjects / projects.length) * 100)}%` : '—',
              sub: completedProjects > 0 ? `${completedProjects} delivered` : 'No completed projects yet',
              subColor: 'text-emerald-400',
              icon: Star, iconColor: 'text-purple-400', iconBg: 'bg-purple-400/10',
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="bg-slate-800/60 border-slate-700/50 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 ${metric.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">{metric.value}</div>
                <div className="text-xs text-slate-400 mb-1">{metric.label}</div>
                <div className={`text-xs ${metric.subColor}`}>{metric.sub}</div>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50">
              <h2 className="text-base font-semibold text-white">Revenue Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Monthly revenue from paid invoices</p>
            </div>
            <div className="p-5 space-y-3">
              {revenueByMonth.map((data) => (
                <div key={data.month} className="flex items-center gap-4">
                  <span className="w-8 text-xs font-medium text-slate-400 flex-shrink-0">{data.month}</span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all"
                      style={{ width: data.value > 0 ? `${(data.value / maxRevenue) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white flex-shrink-0 w-16 text-right">
                    {data.value > 0 ? `$${data.value.toLocaleString()}` : '—'}
                  </span>
                </div>
              ))}
              {paidPayments.length === 0 && (
                <p className="text-xs text-slate-600 text-center pt-2">No paid invoices recorded yet</p>
              )}
            </div>
          </Card>

          {/* Projects by Status */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50">
              <h2 className="text-base font-semibold text-white">Projects by Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">{projects.length} total project{projects.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-5 space-y-3">
              {projects.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">No projects yet</p>
              ) : Object.entries(projectsByStatus).map(([status, count]) => {
                const config = statusConfig[status] ?? { label: status, color: 'text-slate-400', bar: 'bg-slate-500', badge: 'bg-slate-700 text-slate-400' };
                const pct = Math.round((count / projects.length) * 100);
                return (
                  <div key={status} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-700/20">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{pct}%</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>{count}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className={`${config.bar} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <div className="p-5 border-b border-slate-700/50">
            <h2 className="text-base font-semibold text-white">Performance Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">Key performance indicators</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  value: projects.length > 0 ? `${Math.round((completedProjects / projects.length) * 100)}%` : '—',
                  label: 'Completion Rate',
                  icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/10',
                },
                {
                  value: completedProjects > 0 ? `${completedProjects}/${projects.length}` : `0/${projects.length}`,
                  label: 'Projects Delivered',
                  icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10',
                },
                {
                  value: avgDurationDays > 0 ? `${avgDurationDays}d` : '—',
                  label: 'Avg Duration',
                  icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10',
                },
                {
                  value: avgProjectValue > 0 ? (avgProjectValue >= 1000 ? `$${(avgProjectValue / 1000).toFixed(1)}K` : `$${avgProjectValue}`) : '—',
                  label: 'Avg Project Value',
                  icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex flex-col items-center text-center p-5 rounded-xl bg-slate-700/20 hover:bg-slate-700/40 transition-colors">
                    <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                    <p className="text-xs text-slate-500">{item.label}</p>
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

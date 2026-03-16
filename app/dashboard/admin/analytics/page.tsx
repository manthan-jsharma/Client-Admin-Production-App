'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
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

export default function AdminAnalyticsPage() {
  const [analyticsData] = useState({
    totalRevenue: 45200,
    totalProjects: 8,
    activeClients: 5,
    completedProjects: 3,
    avgProjectDuration: 14,
    monthlyGrowth: 12.5,
    projectsByStatus: {
      active: 5,
      completed: 3,
      planning: 2,
      onHold: 1,
    },
    revenueByMonth: [
      { month: 'Jan', value: 3200 },
      { month: 'Feb', value: 4100 },
      { month: 'Mar', value: 5200 },
      { month: 'Apr', value: 6800 },
      { month: 'May', value: 8200 },
      { month: 'Jun', value: 9700 },
      { month: 'Jul', value: 8300 },
    ]
  });

  const maxRevenue = Math.max(...analyticsData.revenueByMonth.map(d => d.value));

  const statusConfig: Record<string, { label: string; color: string; bar: string; badge: string }> = {
    active: {
      label: 'Active',
      color: 'text-emerald-400',
      bar: 'bg-emerald-500',
      badge: 'bg-emerald-500/15 text-emerald-400',
    },
    completed: {
      label: 'Completed',
      color: 'text-blue-400',
      bar: 'bg-blue-500',
      badge: 'bg-blue-500/15 text-blue-400',
    },
    planning: {
      label: 'Planning',
      color: 'text-amber-400',
      bar: 'bg-amber-500',
      badge: 'bg-amber-500/15 text-amber-400',
    },
    onHold: {
      label: 'On Hold',
      color: 'text-red-400',
      bar: 'bg-red-500',
      badge: 'bg-red-500/15 text-red-400',
    },
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Business insights and performance metrics</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            +12.5% this month
          </span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue',
              value: `$${(analyticsData.totalRevenue / 1000).toFixed(1)}K`,
              sub: '+12.5% from last month',
              subColor: 'text-emerald-400',
              icon: DollarSign,
              iconColor: 'text-amber-400',
              iconBg: 'bg-amber-400/10',
            },
            {
              label: 'Total Projects',
              value: analyticsData.totalProjects,
              sub: `${analyticsData.activeClients} active clients`,
              subColor: 'text-slate-500',
              icon: FolderKanban,
              iconColor: 'text-blue-400',
              iconBg: 'bg-blue-400/10',
            },
            {
              label: 'Completed',
              value: analyticsData.completedProjects,
              sub: `Avg. ${analyticsData.avgProjectDuration} days`,
              subColor: 'text-slate-500',
              icon: CheckCircle2,
              iconColor: 'text-emerald-400',
              iconBg: 'bg-emerald-400/10',
            },
            {
              label: 'Success Rate',
              value: '100%',
              sub: 'All projects on time',
              subColor: 'text-emerald-400',
              icon: Star,
              iconColor: 'text-purple-400',
              iconBg: 'bg-purple-400/10',
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
              <p className="text-xs text-slate-500 mt-0.5">Monthly revenue overview</p>
            </div>
            <div className="p-5 space-y-3">
              {analyticsData.revenueByMonth.map((data) => (
                <div key={data.month} className="flex items-center gap-4">
                  <span className="w-8 text-xs font-medium text-slate-400 flex-shrink-0">{data.month}</span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${(data.value / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white flex-shrink-0 w-16 text-right">
                    ${data.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects by Status */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <div className="p-5 border-b border-slate-700/50">
              <h2 className="text-base font-semibold text-white">Projects by Status</h2>
              <p className="text-xs text-slate-500 mt-0.5">{analyticsData.totalProjects} total projects</p>
            </div>
            <div className="p-5 space-y-3">
              {Object.entries(analyticsData.projectsByStatus).map(([status, count]) => {
                const config = statusConfig[status];
                const pct = Math.round((count / analyticsData.totalProjects) * 100);
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
                        <div
                          className={`${config.bar} h-1.5 rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
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
                { value: '98%', label: 'Client Satisfaction', icon: Star, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { value: '100%', label: 'On-Time Delivery', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { value: '14', label: 'Days Avg Duration', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                { value: '$5.6K', label: 'Avg Project Value', icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10' },
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

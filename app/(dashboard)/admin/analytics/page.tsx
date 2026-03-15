'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

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
      onHold: 1
    },
    revenueByMonth: [
      { month: 'Jan', value: 3200 },
      { month: 'Feb', value: 4100 },
      { month: 'Mar', value: 5200 },
      { month: 'Apr', value: 6800 },
      { month: 'May', value: 8200 },
      { month: 'Jun', value: 9700 },
      { month: 'Jul', value: 8300 }
    ]
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">Business insights and performance metrics</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-white mb-2">${analyticsData.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-green-400">+12.5% from last month</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Total Projects</div>
            <div className="text-3xl font-bold text-white mb-2">{analyticsData.totalProjects}</div>
            <div className="text-xs text-slate-400">{analyticsData.activeClients} active clients</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Completed Projects</div>
            <div className="text-3xl font-bold text-white mb-2">{analyticsData.completedProjects}</div>
            <div className="text-xs text-slate-400">Avg. {analyticsData.avgProjectDuration} days</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Success Rate</div>
            <div className="text-3xl font-bold text-white mb-2">100%</div>
            <div className="text-xs text-green-400">All projects on time</div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Revenue Trend</h2>
            <div className="space-y-3">
              {analyticsData.revenueByMonth.map((data) => (
                <div key={data.month} className="flex items-center gap-4">
                  <span className="w-10 text-white font-medium text-sm">{data.month}</span>
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full"
                      style={{ width: `${(data.value / 10000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-medium text-sm">${data.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects by Status */}
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Projects by Status</h2>
            <div className="space-y-4">
              {Object.entries(analyticsData.projectsByStatus).map(([status, count]) => {
                const statusColors: Record<string, { bg: string; text: string; progress: string }> = {
                  active: { bg: 'bg-green-500/10', text: 'text-green-400', progress: 'bg-green-500' },
                  completed: { bg: 'bg-blue-500/10', text: 'text-blue-400', progress: 'bg-blue-500' },
                  planning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', progress: 'bg-yellow-500' },
                  onHold: { bg: 'bg-red-500/10', text: 'text-red-400', progress: 'bg-red-500' }
                };
                const colors = statusColors[status] || statusColors.active;
                
                return (
                  <div key={status} className={`p-4 rounded-lg ${colors.bg}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium capitalize ${colors.text}`}>{status}</span>
                      <span className={`text-2xl font-bold ${colors.text}`}>{count}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`${colors.progress} h-2 rounded-full`}
                        style={{ width: `${(count / analyticsData.totalProjects) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Performance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">98%</div>
              <p className="text-slate-400 text-sm">Client Satisfaction</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <p className="text-slate-400 text-sm">On-Time Delivery</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">14</div>
              <p className="text-slate-400 text-sm">Days Avg Duration</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">$5.6K</div>
              <p className="text-slate-400 text-sm">Avg Project Value</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

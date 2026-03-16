'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Megaphone,
  Star,
  HeadphonesIcon,
} from 'lucide-react';

interface Request {
  _id: string;
  type: 'lead' | 'testimonial' | 'support';
  clientName: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const typeConfig = {
  lead: { label: 'Lead', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10', badge: 'bg-blue-500/15 text-blue-400' },
  testimonial: { label: 'Testimonial', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10', badge: 'bg-purple-500/15 text-purple-400' },
  support: { label: 'Support', icon: HeadphonesIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/15 text-emerald-400' },
};

const statusConfig = {
  pending: { label: 'Pending', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-400', badge: 'bg-red-500/15 text-red-400', icon: XCircle },
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([
    {
      _id: '1',
      type: 'lead',
      clientName: 'Tech Startup Inc',
      details: 'Need a new feature for lead generation to help capture and manage prospect data more efficiently.',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      type: 'testimonial',
      clientName: 'Digital Agency Co',
      details: 'The team did an outstanding job on our project. Delivered on time and exceeded our expectations.',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filteredRequests = requests.filter(req =>
    selectedFilter === 'all' ? true : req.status === selectedFilter
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r._id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
  };

  const filters: { key: 'all' | 'pending' | 'approved'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: requests.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Requests & Approvals</h1>
            <p className="text-sm text-slate-500 mt-1">
              {pendingCount > 0 ? (
                <span className="text-amber-400">{pendingCount} pending review</span>
              ) : (
                'All requests reviewed'
              )}
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">{pendingCount} awaiting review</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl w-fit">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === filter.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {filter.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                selectedFilter === filter.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const type = typeConfig[request.type];
              const status = statusConfig[request.status];
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;

              return (
                <Card key={request._id} className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 ${type.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${type.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${type.badge}`}>
                              {type.label}
                            </span>
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${status.badge}`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>

                          {request.status === 'pending' && (
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                onClick={() => handleApprove(request._id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl h-8 px-3.5 flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(request._id)}
                                className="bg-slate-700 hover:bg-red-600/80 text-slate-300 hover:text-white text-xs font-medium rounded-xl h-8 px-3.5 flex items-center gap-1.5 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-white mb-1.5">{request.clientName}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-3">{request.details}</p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {new Date(request.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1.5">
                No {selectedFilter !== 'all' ? selectedFilter : ''} requests
              </p>
              <p className="text-slate-600 text-sm">All requests have been reviewed</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

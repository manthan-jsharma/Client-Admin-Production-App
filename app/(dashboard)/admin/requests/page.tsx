'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Request {
  _id: string;
  type: 'lead' | 'testimonial' | 'support';
  clientName: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([
    {
      _id: '1',
      type: 'lead',
      clientName: 'Tech Startup Inc',
      details: 'Need a new feature for lead generation',
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      type: 'testimonial',
      clientName: 'Digital Agency Co',
      details: 'Great work on the project!',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filteredRequests = requests.filter(req =>
    selectedFilter === 'all' ? true : req.status === selectedFilter
  );

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r._id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Requests & Approvals</h1>
        <p className="text-slate-400">Manage client requests and approvals</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          {['all', 'pending', 'approved'].map((filter) => (
            <Button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`font-medium ${
                selectedFilter === filter
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <Card key={request._id} className="bg-slate-800 border-slate-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        request.type === 'lead'
                          ? 'bg-blue-500/20 text-blue-400'
                          : request.type === 'testimonial'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {request.type.toUpperCase()}
                      </span>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : request.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{request.clientName}</h3>
                    <p className="text-slate-400 mb-3">{request.details}</p>
                    <p className="text-xs text-slate-500">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <Button
                        onClick={() => handleApprove(request._id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(request._id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-slate-800 border-slate-700 p-12 text-center">
              <p className="text-slate-400 mb-2 font-medium">No {selectedFilter !== 'all' ? selectedFilter : ''} requests</p>
              <p className="text-slate-500 text-sm">All requests have been reviewed</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

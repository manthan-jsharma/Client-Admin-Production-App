'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Referral } from '@/lib/types';
import {
  Users, Clock, CheckCircle2, XCircle, PhoneCall, Mail,
  Building2, MessageSquare, ChevronDown, AlertCircle, Search,
} from 'lucide-react';

const statusConfig: Record<Referral['status'], { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', badge: 'bg-amber-500/15 text-amber-400', icon: Clock },
  contacted: { label: 'Contacted', badge: 'bg-blue-500/15 text-blue-400', icon: PhoneCall },
  converted: { label: 'Converted', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Not Qualified', badge: 'bg-red-500/15 text-red-400', icon: XCircle },
};

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Referral['status']>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/referrals', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const result = await res.json();
      if (result.success) setReferrals(result.data);
    } catch {
      notify('error', 'Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const updateStatus = async (id: string, status: Referral['status']) => {
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        setReferrals(prev => prev.map(r => r._id === id ? result.data : r));
        notify('success', 'Referral status updated');
      }
    } catch {
      notify('error', 'Failed to update referral');
    }
  };

  const filtered = referrals.filter(r => {
    const matchesSearch =
      r.refereeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.refereeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referredByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.refereeCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    contacted: referrals.filter(r => r.status === 'contacted').length,
    converted: referrals.filter(r => r.status === 'converted').length,
    rejected: referrals.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Referral Submissions</h1>
            <p className="text-sm text-slate-500 mt-1">
              {counts.pending > 0
                ? <span className="text-amber-400">{counts.pending} pending review</span>
                : `${referrals.length} total referrals · ${counts.converted} converted`}
            </p>
          </div>
          {counts.converted > 0 && (
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-xs font-medium text-emerald-400">{counts.converted} converted</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notification.message}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {([
            { key: 'pending', label: 'Pending', value: counts.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { key: 'contacted', label: 'Contacted', value: counts.contacted, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { key: 'converted', label: 'Converted', value: counts.converted, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { key: 'rejected', label: 'Not Qualified', value: counts.rejected, color: 'text-red-400', bg: 'bg-red-500/10' },
          ] as const).map(stat => (
            <Card key={stat.key} className={`bg-slate-800/60 border-slate-700/50 p-4 cursor-pointer transition-all hover:border-slate-600 ${statusFilter === stat.key ? 'ring-1 ring-blue-500/40' : ''}`}
              onClick={() => setStatusFilter(statusFilter === stat.key ? 'all' : stat.key as Referral['status'])}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Referrals List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(referral => {
              const sc = statusConfig[referral.status];
              const StatusIcon = sc.icon;

              return (
                <Card key={referral._id} className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 bg-slate-700/60 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-white">{referral.refereeName}</h3>
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${sc.badge}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center gap-2 text-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-slate-400 truncate">{referral.refereeEmail}</span>
                            </div>
                            {referral.refereePhone && (
                              <div className="flex items-center gap-2 text-xs">
                                <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-slate-400">{referral.refereePhone}</span>
                              </div>
                            )}
                            {referral.refereeCompany && (
                              <div className="flex items-center gap-2 text-xs">
                                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-slate-400">{referral.refereeCompany}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-slate-400">Referred by <span className="text-slate-300 font-medium">{referral.referredByName}</span></span>
                            </div>
                          </div>

                          {referral.notes && (
                            <div className="flex items-start gap-2 text-xs bg-slate-700/30 rounded-lg px-3 py-2 mb-3">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                              <p className="text-slate-400">{referral.notes}</p>
                            </div>
                          )}

                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(referral.createdAt!).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Status update dropdown */}
                      <div className="relative flex-shrink-0">
                        <select
                          value={referral.status}
                          onChange={e => updateStatus(referral._id!, e.target.value as Referral['status'])}
                          className="h-9 pl-3 pr-8 bg-slate-700 border border-slate-600 text-slate-300 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Not Qualified</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No referrals found</p>
            <p className="text-slate-600 text-sm">Referrals submitted by clients will appear here</p>
          </Card>
        )}
      </div>
    </div>
  );
}

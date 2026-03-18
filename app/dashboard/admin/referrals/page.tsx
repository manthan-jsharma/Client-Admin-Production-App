'use client';

import React, { useState, useEffect } from 'react';
import { Referral } from '@/lib/types';
import {
  Users, Clock, CheckCircle2, XCircle, PhoneCall, Mail,
  Building2, MessageSquare, ChevronDown, AlertCircle, Search, TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: '18px',
};

const statusConfig: Record<Referral['status'], { label: string; color: string; bg: string; border: string; dot: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:   { label: 'Pending',       color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', icon: Clock },
  contacted: { label: 'Contacted',     color: '#3A8DDE', bg: '#eff8ff', border: '#c8dff0', dot: '#3A8DDE', icon: PhoneCall },
  converted: { label: 'Converted',     color: '#6BCF7A', bg: 'rgba(107,207,122,0.1)', border: '#a7f3d0', dot: '#6BCF7A', icon: CheckCircle2 },
  rejected:  { label: 'Not Qualified', color: '#8A97A3', bg: 'rgba(58,141,222,0.06)', border: '#DDE5EC', dot: '#8A97A3', icon: XCircle },
};

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Referral['status']>('all');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => { fetchReferrals(); }, []);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/referrals', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
      const result = await res.json();
      if (result.success) setReferrals(result.data);
    } catch { notify('error', 'Failed to load referrals'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 4000); };

  const updateStatus = async (id: string, status: Referral['status']) => {
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) { setReferrals(prev => prev.map(r => r._id === id ? result.data : r)); notify('success', 'Status updated'); }
    } catch { notify('error', 'Failed to update'); }
  };

  const filtered = referrals.filter(r => {
    const matchesSearch =
      r.refereeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.refereeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referredByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.refereeCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || r.status === statusFilter);
  });

  const counts = {
    all: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    contacted: referrals.filter(r => r.status === 'contacted').length,
    converted: referrals.filter(r => r.status === 'converted').length,
    rejected: referrals.filter(r => r.status === 'rejected').length,
  };

  const conversionRate = referrals.length > 0 ? Math.round((counts.converted / referrals.length) * 100) : 0;

  return (
    <div className="min-h-screen animate-fade-up">
      <PageHeader
        title="Referrals"
        subtitle={counts.pending > 0 ? `${counts.pending} pending review` : `${referrals.length} total · ${counts.converted} converted`}
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Referrals' }]}
        heroStrip
        actions={conversionRate > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{conversionRate}% conversion</span>
          </div>
        ) : undefined}
      />

      <div className="p-8 space-y-5">
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium"
            style={notification.type === 'success'
              ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Summary stat cards — clickable filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {([
            { key: 'pending',   label: 'Pending',       value: counts.pending,   color: '#f59e0b', accentColor: '#f59e0b' },
            { key: 'contacted', label: 'Contacted',      value: counts.contacted, color: '#3A8DDE', accentColor: '#3A8DDE' },
            { key: 'converted', label: 'Converted',      value: counts.converted, color: '#10b981', accentColor: '#10b981' },
            { key: 'rejected',  label: 'Not Qualified',  value: counts.rejected,  color: '#8A97A3', accentColor: '#8A97A3' },
          ] as const).map(stat => (
            <button
              key={stat.key}
              onClick={() => setStatusFilter(statusFilter === stat.key ? 'all' : stat.key)}
              className="relative overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5"
              style={{
                ...CARD,
                padding: '16px',
                outline: statusFilter === stat.key ? `2px solid ${stat.accentColor}40` : 'none',
                outlineOffset: '2px',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${stat.accentColor}, ${stat.accentColor}88)` }} />
              <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#8A97A3' }}>{stat.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, email, company…" className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }} />
        </div>

        {/* Referrals List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading referrals…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(referral => {
              const sc = statusConfig[referral.status];
              const StatusIcon = sc.icon;
              return (
                <div
                  key={referral._id}
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    ...CARD,
                    borderColor: referral.status === 'converted' ? '#a7f3d0' : '#DDE5EC',
                  }}
                >
                  {referral.status === 'converted' && (
                    <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #10b981, #52b7f4)' }} />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
                          style={referral.status === 'converted'
                            ? { background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0' }
                            : { background: 'rgba(58,141,222,0.06)', color: '#5F6B76', border: '1px solid #DDE5EC' }}
                        >
                          {referral.refereeName.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                            <h3 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>{referral.refereeName}</h3>
                            <span
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                            >
                              <StatusIcon className="w-3 h-3" />{sc.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                            <div className="flex items-center gap-2 text-xs">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                              <span className="truncate" style={{ color: '#334155' }}>{referral.refereeEmail}</span>
                            </div>
                            {referral.refereePhone && (
                              <div className="flex items-center gap-2 text-xs">
                                <PhoneCall className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                                <span style={{ color: '#334155' }}>{referral.refereePhone}</span>
                              </div>
                            )}
                            {referral.refereeCompany && (
                              <div className="flex items-center gap-2 text-xs">
                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                                <span style={{ color: '#334155' }}>{referral.refereeCompany}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8A97A3' }} />
                              <span style={{ color: '#5F6B76' }}>Referred by <span className="font-medium" style={{ color: '#334155' }}>{referral.referredByName}</span></span>
                            </div>
                          </div>

                          {referral.notes && (
                            <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2 mb-2.5" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#8A97A3' }} />
                              <p className="leading-relaxed" style={{ color: '#5F6B76' }}>{referral.notes}</p>
                            </div>
                          )}

                          <p className="text-xs flex items-center gap-1.5" style={{ color: '#8A97A3' }}>
                            <Clock className="w-3 h-3" />
                            {new Date(referral.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Status update */}
                      <div className="relative flex-shrink-0">
                        <select
                          value={referral.status}
                          onChange={e => updateStatus(referral._id!, e.target.value as Referral['status'])}
                          className="h-9 pl-3 pr-8 rounded-xl text-xs appearance-none focus:outline-none cursor-pointer transition-colors"
                          style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#334155' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="converted">Converted</option>
                          <option value="rejected">Not Qualified</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: '#8A97A3' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState variant="clients" />
        )}
      </div>
    </div>
  );
}

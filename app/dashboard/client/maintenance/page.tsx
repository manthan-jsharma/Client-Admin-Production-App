'use client';

import React, { useState, useEffect } from 'react';
import { MaintenanceFeedback } from '@/lib/types';
import {
  Wrench, Plus, X, CheckCircle2, Clock, AlertCircle,
  MessageSquare, ExternalLink, ChevronDown, ChevronUp,
  Shield, Zap, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
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

const STATUS_CONFIG = {
  new:      { label: 'Submitted', badgeBg: '#eff8ff', badgeColor: '#3A8DDE', badgeBorder: '#c8dff0', icon: Zap },
  open:     { label: 'In Review', badgeBg: '#fffbeb', badgeColor: '#f59e0b', badgeBorder: '#fde68a', icon: Clock },
  resolved: { label: 'Resolved',  badgeBg: 'rgba(107,207,122,0.1)', badgeColor: '#6BCF7A', badgeBorder: '#a7f3d0', icon: CheckCircle2 },
};

const WHATSAPP_LINK = 'https://wa.me/1234567890?text=Hi%2C%20I%27d%20like%20to%20subscribe%20to%20the%20monthly%20maintenance%20plan.';

export default function ClientMaintenancePage() {
  const [items, setItems] = useState<MaintenanceFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [msgError, setMsgError] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setItems(result.data);
    } catch { notify('error', 'Failed to load submissions'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', msg: string) => { setNotification({ type, message: msg }); setTimeout(() => setNotification(null), 5000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) { setMsgError('Please describe the issue in at least 10 characters'); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message }) });
      const result = await res.json();
      if (result.success) {
        setItems(prev => [result.data, ...prev]);
        setMessage(''); setShowForm(false);
        notify('success', 'Feedback submitted! Our team will review and respond shortly.');
      } else notify('error', result.error || 'Failed to submit');
    } catch { notify('error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Monthly Maintenance"
        subtitle="Platform management, updates, and direct team support"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Maintenance' }]}
        heroStrip
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 font-semibold rounded-xl h-10 px-4 text-sm transition-all duration-150 active:scale-95"
            style={showForm
              ? { background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }
              : { background: '#3A8DDE', color: 'white' }
            }
            onMouseEnter={e => { if (!showForm) (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
            onMouseLeave={e => { if (!showForm) (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Submit Feedback</>}
          </button>
        }
      />

      <div className="p-8 space-y-5 animate-fade-up">
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium"
            style={notification.type === 'success'
              ? { background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0', color: '#6BCF7A' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }
            }
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Offering card */}
        <div className="relative overflow-hidden" style={{ ...CARD, border: '1px solid #c8dff0' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }} />
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                <Wrench className="w-5 h-5" style={{ color: '#3A8DDE' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-bold" style={{ color: '#1E2A32' }}>Monthly Platform Maintenance</p>
                  <span className="text-xl font-bold tabular-nums" style={{ color: '#3A8DDE' }}>
                    $500<span className="text-xs font-normal" style={{ color: '#5F6B76' }}>/month</span>
                  </span>
                </div>
                <p className="text-xs leading-relaxed mt-1.5 max-w-xl" style={{ color: '#334155' }}>
                  We manage and maintain your platform monthly — keeping it fast, secure, and up to date. Covers ongoing maintenance and monitoring, excluding new feature development.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Shield,    label: 'Security patches',   desc: 'Regular security updates applied automatically' },
                { icon: RefreshCw, label: 'Uptime monitoring',  desc: '24/7 monitoring with instant alerts' },
                { icon: Zap,       label: 'Performance tuning', desc: 'Speed and reliability optimizations' },
              ].map(f => (
                <div key={f.label} className="rounded-xl p-3.5" style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}>
                  <f.icon className="w-4 h-4 mb-2" style={{ color: '#3A8DDE' }} />
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#1E2A32' }}>{f.label}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#5F6B76' }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Chat CTA */}
            <Link
              href="/dashboard/client/chat?inquiry=Hi%2C+I%27d+like+to+inquire+about+the+monthly+maintenance+plan.+Could+you+share+more+details+about+pricing+and+what%27s+included%3F&service=Monthly+Maintenance"
              className="inline-flex items-center gap-2 font-semibold text-sm rounded-xl px-5 h-10 transition-colors"
              style={{ background: '#3A8DDE', color: 'white' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#2F6FB2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#3A8DDE'; }}
            >
              <MessageSquare className="w-4 h-4" />
              Inquire about this
            </Link>
          </div>
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="overflow-hidden" style={CARD}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Submit Feedback or Report an Issue</h2>
              <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>Describe the issue in detail — our team will respond shortly</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>
                    Your message <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span className="text-[11px]" style={{ color: '#8A97A3' }}>{message.length}/2000</span>
                </div>
                <textarea
                  value={message}
                  onChange={e => { setMessage(e.target.value.slice(0, 2000)); setMsgError(''); }}
                  placeholder="Describe the issue, bug, or feedback. Include steps to reproduce if reporting a bug."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none leading-relaxed transition-all"
                  style={{
                    background: 'rgba(58,141,222,0.06)',
                    border: msgError ? '1px solid #ef4444' : '1px solid #DDE5EC',
                    color: '#1E2A32',
                  }}
                  onFocus={e => { if (!msgError) { e.currentTarget.style.borderColor = '#3A8DDE'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,149,221,0.1)'; } }}
                  onBlur={e => { e.currentTarget.style.borderColor = msgError ? '#ef4444' : '#DDE5EC'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {msgError && <p className="text-xs" style={{ color: '#ef4444' }}>{msgError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 font-semibold rounded-xl px-6 h-10 text-sm transition-all duration-150 active:scale-95 disabled:opacity-50"
                  style={{ background: '#3A8DDE', color: 'white' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
                >
                  {isSubmitting ? 'Submitting…' : <><MessageSquare className="w-4 h-4" /> Submit</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-5 h-10 text-sm transition-all duration-150 active:scale-95"
                  style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Submissions list */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#5F6B76' }}>Your Submissions</h2>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              <p className="text-xs" style={{ color: '#5F6B76' }}>Loading…</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState variant="messages" />
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const sc = STATUS_CONFIG[item.status];
                const StatusIcon = sc.icon;
                const isExpanded = expandedId === item._id;
                return (
                  <div
                    key={item._id}
                    className="transition-all overflow-hidden"
                    style={{
                      ...CARD,
                      border: item.status === 'resolved' ? '1px solid #a7f3d0' : '1px solid #DDE5EC',
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span
                          className="inline-flex items-center gap-1.5 font-semibold flex-shrink-0"
                          style={{ background: sc.badgeBg, color: sc.badgeColor, border: `1px solid ${sc.badgeBorder}`, borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }}
                        >
                          <StatusIcon className="w-3 h-3" />{sc.label}
                        </span>
                        <p className="text-xs" style={{ color: '#8A97A3' }}>{new Date(item.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>

                      <p className={`text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`} style={{ color: '#334155' }}>{item.message}</p>
                      {item.message.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item._id!)}
                          className="flex items-center gap-1 text-xs mt-1.5 transition-colors"
                          style={{ color: '#3A8DDE' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2F6FB2'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3A8DDE'; }}
                        >
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}

                      {item.adminResponse && (
                        <div className="mt-4 p-4 rounded-xl" style={{ background: '#eff8ff', border: '1px solid #c8dff0' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#3A8DDE' }}>Team Response</p>
                          <p className="text-sm leading-relaxed" style={{ color: '#334155' }}>{item.adminResponse}</p>
                          {item.respondedAt && (
                            <p className="text-[11px] mt-2" style={{ color: '#8A97A3' }}>
                              Responded {new Date(item.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaintenanceFeedback } from '@/lib/types';
import {
  Wrench, Plus, X, CheckCircle2, Clock, AlertCircle,
  MessageSquare, ExternalLink, ChevronDown, ChevronUp,
  Shield, Zap, RefreshCw,
} from 'lucide-react';

const STATUS_CONFIG = {
  new:      { label: 'New',      badge: 'bg-blue-500/15 text-blue-400',     icon: Zap },
  open:     { label: 'Open',     badge: 'bg-amber-500/15 text-amber-400',   icon: Clock },
  resolved: { label: 'Resolved', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
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

  const notify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, message: msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      setMsgError('Please describe the issue in at least 10 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
      const result = await res.json();
      if (result.success) {
        setItems(prev => [result.data, ...prev]);
        setMessage('');
        setShowForm(false);
        notify('success', 'Feedback submitted! Our team will review and respond shortly.');
      } else {
        notify('error', result.error || 'Failed to submit');
      }
    } catch { notify('error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Monthly Maintenance</h1>
            <p className="text-sm text-slate-500 mt-1">Platform management, updates, and direct support from our team</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
              showForm
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Submit Feedback</>}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Offering card */}
        <Card className="bg-gradient-to-br from-blue-600/10 via-slate-800/60 to-slate-800/60 border-blue-500/20 p-0 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-semibold text-white">Monthly Platform Maintenance</p>
                  <span className="text-lg font-bold text-blue-400">$500<span className="text-xs font-normal text-slate-500">/month</span></span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  We manage and maintain your platform on a monthly basis — keeping it fast, secure, and up to date.
                  This plan covers ongoing maintenance and monitoring, and excludes development of new features.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: Shield, label: 'Security patches', desc: 'Regular security updates applied automatically' },
                { icon: RefreshCw, label: 'Uptime monitoring', desc: '24/7 monitoring with instant alerts' },
                { icon: Zap, label: 'Performance tuning', desc: 'Speed and reliability optimizations' },
              ].map(f => (
                <div key={f.label} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
                  <f.icon className="w-4 h-4 text-blue-400 mb-2" />
                  <p className="text-xs font-semibold text-white mb-0.5">{f.label}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* WhatsApp subscribe CTA */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm rounded-xl px-5 h-10 transition-colors shadow-lg shadow-green-500/20"
            >
              {/* WhatsApp icon inline SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Subscribe via WhatsApp
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </Card>

        {/* Submit form */}
        {showForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-sm font-semibold text-white">Submit Feedback or Report an Issue</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Your message <span className="text-red-400">*</span>
                  <span className="text-slate-600 font-normal ml-2">({message.length}/2000)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => { setMessage(e.target.value.slice(0, 2000)); setMsgError(''); }}
                  placeholder="Describe the issue, bug, or feedback in as much detail as possible. Include steps to reproduce if reporting a bug."
                  rows={5}
                  className={`w-full px-4 py-3 bg-slate-700/80 border text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none leading-relaxed ${msgError ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                />
                {msgError && <p className="text-xs text-red-400">{msgError}</p>}
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20 disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : <><MessageSquare className="w-4 h-4" /> Submit</>}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-5 h-10">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Submissions list */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Your Submissions</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-7 h-7 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1.5">No submissions yet</p>
              <p className="text-slate-600 text-sm mb-4">Use the button above to report an issue or share feedback</p>
              <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm mx-auto flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Submit Feedback
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const sc = STATUS_CONFIG[item.status];
                const StatusIcon = sc.icon;
                const isExpanded = expandedId === item._id;
                return (
                  <Card key={item._id} className={`border transition-all ${item.status === 'resolved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.badge}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                        <p className="text-xs text-slate-600">
                          {new Date(item.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <p className={`text-sm text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {item.message}
                      </p>
                      {item.message.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item._id!)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
                        >
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
                        </button>
                      )}

                      {item.adminResponse && (
                        <div className="mt-4 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
                          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-wide mb-1.5">Team Response</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{item.adminResponse}</p>
                          {item.respondedAt && (
                            <p className="text-[11px] text-slate-600 mt-2">
                              Responded {new Date(item.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

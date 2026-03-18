'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Send, Link2, Link2Off, CheckCircle2, AlertCircle, ExternalLink, Webhook,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 16,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [tgConnected, setTgConnected] = useState(false);
  const [tgChatId, setTgChatId] = useState<string | null>(null);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDisconnecting, setTgDisconnecting] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  const notify = (type: 'success' | 'error', message: string) => { setNotification({ type, message }); setTimeout(() => setNotification(null), 4000); };

  useEffect(() => {
    if (!token) return;
    fetch('/api/telegram/connect', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (data.success) { setTgConnected(data.connected); setTgChatId(data.chatId); } })
      .catch(() => {});
  }, [token]);

  const handleTgConnect = async () => {
    const win = window.open('', '_blank');
    setTgLoading(true); setTgDeepLink(null);
    try {
      const res = await fetch('/api/telegram/connect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.deepLink) { setTgDeepLink(data.deepLink); if (win) win.location.href = data.deepLink; } else win?.close();
    } catch { win?.close(); } finally { setTgLoading(false); }
  };

  const handleTgDisconnect = async () => {
    setTgDisconnecting(true);
    try {
      await fetch('/api/telegram/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setTgConnected(false); setTgChatId(null); setTgDeepLink(null);
      notify('success', 'Telegram disconnected');
    } catch { notify('error', 'Failed to disconnect'); } finally { setTgDisconnecting(false); }
  };

  const handleSetupWebhook = async () => {
    setWebhookLoading(true); setWebhookResult(null);
    try {
      const res = await fetch('/api/telegram/setup-webhook', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setWebhookResult(`Webhook registered: ${data.webhookUrl}`); notify('success', 'Telegram webhook registered successfully'); }
      else notify('error', data.error || 'Webhook setup failed');
    } catch { notify('error', 'Network error'); } finally { setWebhookLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="Settings"
        subtitle="Platform configuration and integrations"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Settings' }]}
        heroStrip={true}
      />

      <div className="p-8 max-w-2xl space-y-5">
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

        {/* Telegram Connect */}
        <div style={CARD} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-sky-400 via-sky-200 to-transparent" />
          <div className="p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Send className="w-5 h-5" style={{ color: '#0ea5e9' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h2 className="text-sm font-semibold" style={{ color: '#1E2A32', fontWeight: 800 }}>Telegram Notifications</h2>
                {tgConnected && (
                  <span className="pill-active inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: '#5F6B76' }}>
                Connect your personal Telegram to receive admin alerts — new clients, tickets, maintenance submissions, and more.
              </p>

              {tgConnected ? (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: '#5F6B76' }}>{tgChatId ? `Chat ID: ${tgChatId}` : ''}</p>
                  <button onClick={handleTgDisconnect} disabled={tgDisconnecting}
                    className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#5F6B76' }}>
                    <Link2Off className="w-3.5 h-3.5" />
                    {tgDisconnecting ? 'Disconnecting…' : 'Disconnect Telegram'}
                  </button>
                </div>
              ) : !tgDeepLink ? (
                <button onClick={handleTgConnect} disabled={tgLoading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 text-sm font-semibold rounded-xl h-9 px-4">
                  <Link2 className="w-3.5 h-3.5" />
                  {tgLoading ? 'Generating link…' : 'Connect Telegram'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs" style={{ color: '#5F6B76' }}>Telegram should have opened automatically. If not:</p>
                  <a href={tgDeepLink} target="_blank" rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-1.5 text-sm font-semibold rounded-xl h-9 px-4">
                    <ExternalLink className="w-3.5 h-3.5" /> Open in Telegram
                  </a>
                  <p className="text-xs" style={{ color: '#8A97A3' }}>After sending /start, refresh this page to see the connected status.</p>
                  <button onClick={handleTgConnect} className="text-xs underline transition-colors" style={{ color: '#5F6B76' }}>
                    Generate a new link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telegram Webhook */}
        <div style={CARD} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-violet-400 via-violet-200 to-transparent" />
          <div className="p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <Webhook className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold mb-0.5" style={{ color: '#1E2A32', fontWeight: 800 }}>Telegram Webhook</h2>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: '#5F6B76' }}>
                Register this app&apos;s webhook URL with the Telegram Bot API. Run this once after deploying to production or after changing the domain.
              </p>
              <div className="space-y-2">
                <button onClick={handleSetupWebhook} disabled={webhookLoading}
                  className="flex items-center gap-2 disabled:opacity-50 text-white text-sm font-semibold rounded-xl h-9 px-4 transition-colors"
                  style={{ background: '#8b5cf6' }}>
                  <Webhook className="w-3.5 h-3.5" />
                  {webhookLoading ? 'Registering…' : 'Register webhook'}
                </button>
                {webhookResult && <p className="text-xs break-all" style={{ color: '#5F6B76' }}>{webhookResult}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

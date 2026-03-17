'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import {
  Send,
  Link2,
  Link2Off,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Webhook,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { token } = useAuth();

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Telegram connect state
  const [tgConnected, setTgConnected] = useState(false);
  const [tgChatId, setTgChatId] = useState<string | null>(null);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDisconnecting, setTgDisconnecting] = useState(false);

  // Webhook setup state
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Telegram connect status on mount
  useEffect(() => {
    if (!token) return;
    fetch('/api/telegram/connect', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTgConnected(data.connected);
          setTgChatId(data.chatId);
        }
      })
      .catch(() => {});
  }, [token]);

  const handleTgConnect = async () => {
    // Open window synchronously before async work — prevents popup blocker
    const win = window.open('', '_blank');
    setTgLoading(true);
    setTgDeepLink(null);
    try {
      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.deepLink) {
        setTgDeepLink(data.deepLink);
        if (win) win.location.href = data.deepLink;
      } else {
        win?.close();
      }
    } catch { win?.close(); } finally {
      setTgLoading(false);
    }
  };

  const handleTgDisconnect = async () => {
    setTgDisconnecting(true);
    try {
      await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTgConnected(false);
      setTgChatId(null);
      setTgDeepLink(null);
      notify('success', 'Telegram disconnected');
    } catch { notify('error', 'Failed to disconnect'); } finally {
      setTgDisconnecting(false);
    }
  };

  const handleSetupWebhook = async () => {
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/telegram/setup-webhook', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWebhookResult(`Webhook registered: ${data.webhookUrl}`);
        notify('success', 'Telegram webhook registered successfully');
      } else {
        notify('error', data.error || 'Webhook setup failed');
      }
    } catch { notify('error', 'Network error'); } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Platform configuration and integrations</p>
      </div>

      <div className="p-8 max-w-2xl space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Telegram Connect */}
        <Card className="bg-slate-800/60 border-slate-700/50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white">Telegram Notifications</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your personal Telegram to receive admin alerts — new clients, tickets, maintenance submissions, and more.
              </p>

              {tgConnected ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Connected{tgChatId ? ` · chat ID ${tgChatId}` : ''}
                  </div>
                  <button
                    onClick={handleTgDisconnect}
                    disabled={tgDisconnecting}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Link2Off className="w-3.5 h-3.5" />
                    {tgDisconnecting ? 'Disconnecting…' : 'Disconnect Telegram'}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {!tgDeepLink ? (
                    <button
                      onClick={handleTgConnect}
                      disabled={tgLoading}
                      className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl h-9 px-4 transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {tgLoading ? 'Generating link…' : 'Connect Telegram'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">
                        Telegram should have opened automatically. If not, use the button below:
                      </p>
                      <a
                        href={tgDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-xl h-9 px-4 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Telegram
                      </a>
                      <p className="text-xs text-slate-600">
                        After sending /start, refresh this page to see the connected status.
                      </p>
                      <button
                        onClick={handleTgConnect}
                        className="text-xs text-slate-500 hover:text-slate-300 underline"
                      >
                        Generate a new link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Telegram Webhook Setup */}
        <Card className="bg-slate-800/60 border-slate-700/50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <Webhook className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white">Telegram Webhook</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register this app&apos;s webhook URL with the Telegram Bot API. Run this once after deploying to production or after changing the domain.
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleSetupWebhook}
                  disabled={webhookLoading}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl h-9 px-4 transition-colors"
                >
                  <Webhook className="w-3.5 h-3.5" />
                  {webhookLoading ? 'Registering…' : 'Register webhook'}
                </button>
                {webhookResult && (
                  <p className="text-xs text-slate-400 break-all">{webhookResult}</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

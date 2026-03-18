'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Mail,
  Phone,
  Building2,
  Globe,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Send,
  Link2,
  Link2Off,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: '18px',
};

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(58,141,222,0.06)',
  border: '1px solid #DDE5EC',
  color: '#1E2A32',
  borderRadius: '12px',
  height: '40px',
  width: '100%',
  padding: '0 12px 0 40px',
  fontSize: '14px',
  outline: 'none',
};

const INPUT_DISABLED_STYLE: React.CSSProperties = {
  background: '#f1f5f9',
  border: '1px solid #DDE5EC',
  color: '#8A97A3',
  borderRadius: '12px',
  height: '40px',
  width: '100%',
  padding: '0 12px 0 40px',
  fontSize: '14px',
  outline: 'none',
  cursor: 'not-allowed',
};

export default function ProfilePage() {
  const { user, token, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    businessName: '',
    website: '',
    about: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Telegram connect state
  const [tgConnected, setTgConnected] = useState(false);
  const [tgChatId, setTgChatId] = useState<string | null>(null);
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgDisconnecting, setTgDisconnecting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        company: user.company || '',
        businessName: user.businessName || '',
        website: user.website || '',
        about: user.about || '',
      });
      setAvatarPreview(user.profilePicture || null);
    }
  }, [user]);

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

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (result.success) {
        setUser(result.data);
        notify('success', 'Profile saved successfully');
      } else {
        notify('error', result.error || 'Failed to save profile');
      }
    } catch {
      notify('error', 'Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      notify('error', 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('error', 'File too large. Maximum size is 5 MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setUser({ ...user!, profilePicture: result.data.url });
        notify('success', 'Profile picture updated');
      } else {
        notify('error', result.error || 'Upload failed');
        setAvatarPreview(user?.profilePicture || null);
      }
    } catch {
      notify('error', 'Upload failed');
      setAvatarPreview(user?.profilePicture || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#3A8DDE';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,141,222,0.1)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#DDE5EC';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="My Profile"
        subtitle="Complete your profile to help your admin understand your business"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Profile' }]}
        heroStrip
      />

      <div className="p-8 max-w-3xl space-y-6 animate-fade-up">
        {/* Notification */}
        {notification && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl border text-sm"
            style={notification.type === 'success'
              ? { background: 'rgba(107,207,122,0.1)', border: '1px solid #a7f3d0', color: '#6BCF7A' }
              : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }
            }
          >
            {notification.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Avatar Card */}
        <div className="p-6" style={CARD}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#1E2A32' }}>Profile Picture</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover"
                  style={{ border: '2px solid #DDE5EC' }}
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 font-medium rounded-xl h-9 px-4 text-sm mb-2 transition-all duration-150 active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC' }}
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Uploading...' : 'Upload photo'}
              </button>
              <p className="text-xs" style={{ color: '#8A97A3' }}>JPEG, PNG, WebP or GIF · Max 5 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div style={CARD}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Profile Information</h2>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Read-only email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#334155' }}>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={INPUT_DISABLED_STYLE}
                  />
                </div>
                <p className="text-xs" style={{ color: '#8A97A3' }}>Email cannot be changed</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#334155' }}>Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    style={INPUT_STYLE}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#334155' }}>Business name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                  <input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    placeholder="Your business name"
                    style={INPUT_STYLE}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#334155' }}>Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 555 0000"
                    style={INPUT_STYLE}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#334155' }}>Current website</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8A97A3' }} />
                  <input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://yourbusiness.com"
                    style={INPUT_STYLE}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium" style={{ color: '#334155' }}>
                  About your business
                  <span className="ml-2 text-xs font-normal" style={{ color: '#8A97A3' }}>{form.about.length}/500</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 w-4 h-4" style={{ color: '#8A97A3' }} />
                  <textarea
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us about your business, goals, and what you're looking to achieve..."
                    className="w-full pl-10 pr-4 py-3 text-sm resize-none focus:outline-none"
                    style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32', borderRadius: '12px' }}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 font-medium rounded-xl h-10 px-5 transition-all duration-150 active:scale-95 disabled:opacity-50"
                style={{ background: '#3A8DDE', color: 'white' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save changes
              </button>
            </div>
          </form>
        </div>

        {/* Telegram Connect */}
        <div className="p-6" style={CARD}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#eff8ff' }}>
              <Send className="w-5 h-5" style={{ color: '#3A8DDE' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Telegram Notifications</h2>
              <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>
                Connect your Telegram account to receive instant notifications for deliveries, payments, tickets, and more.
              </p>

              {tgConnected ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#6BCF7A' }}>
                    <CheckCircle2 className="w-4 h-4" />
                    Connected{tgChatId ? ` · chat ID ${tgChatId}` : ''}
                  </div>
                  <button
                    onClick={handleTgDisconnect}
                    disabled={tgDisconnecting}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                    style={{ color: '#5F6B76' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5F6B76'; }}
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
                      className="flex items-center gap-2 text-sm font-medium rounded-xl h-9 px-4 transition-all duration-150 active:scale-95 disabled:opacity-50"
                      style={{ background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {tgLoading ? 'Generating link…' : 'Connect Telegram'}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs" style={{ color: '#334155' }}>
                        Telegram should have opened automatically. If not, use the button below:
                      </p>
                      <a
                        href={tgDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium rounded-xl h-9 px-4 transition-all duration-150"
                        style={{ background: '#eff8ff', color: '#3A8DDE', border: '1px solid #c8dff0' }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open in Telegram
                      </a>
                      <p className="text-xs" style={{ color: '#8A97A3' }}>
                        After sending /start, refresh this page to see the connected status.
                      </p>
                      <button
                        onClick={handleTgConnect}
                        className="text-xs underline transition-colors"
                        style={{ color: '#5F6B76' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5F6B76'; }}
                      >
                        Generate a new link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="p-6" style={CARD}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#1E2A32' }}>Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-sm" style={{ color: '#5F6B76' }}>Account status</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(107,207,122,0.1)', color: '#6BCF7A' }}
              >
                Approved
              </span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <span className="text-sm" style={{ color: '#5F6B76' }}>Account type</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                style={{ background: '#eff8ff', color: '#3A8DDE' }}
              >
                {user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: '#5F6B76' }}>Member since</span>
              <span className="text-sm" style={{ color: '#1E2A32' }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

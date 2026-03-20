'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Mail, Calendar, ShieldCheck, Camera, KeyRound } from 'lucide-react';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(30,40,60,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
};

export default function AdminProfilePage() {
  const { user, token, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (newPassword.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const result = await res.json();
      if (result.success) { setPwMsg({ type: 'success', text: 'Password updated' }); setNewPassword(''); setConfirmPassword(''); }
      else setPwMsg({ type: 'error', text: result.error ?? 'Failed to update' });
    } catch { setPwMsg({ type: 'error', text: 'Network error' }); }
    finally { setPwSaving(false); }
  };

  if (!user) return null;

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'A';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const result = await res.json();
      if (result.success) {
        setUser({ ...user, profilePicture: result.data.url });
      } else {
        setError(result.error ?? 'Upload failed');
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#E9EEF2' }}>
      <PageHeader
        title="My Profile"
        subtitle="Your account details"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Profile' }]}
        heroStrip
      />

      <div className="p-8 max-w-lg">
        <div style={CARD} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-blue-400 via-blue-200 to-transparent" />
          <div className="p-8 flex flex-col items-center gap-4 border-b" style={{ borderColor: 'rgba(221,229,236,0.5)' }}>

            {/* Avatar with camera overlay */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(58,141,222,0.18)' }}
                />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#3A8DDE,#2F6FB2)', border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(58,141,222,0.18)' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Change profile picture"
                style={{ position: 'absolute', bottom: -6, right: -6, width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3A8DDE', border: '2px solid #fff', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
              >
                {uploading
                  ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                  : <Camera style={{ width: 12, height: 12, color: '#fff' }} />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="text-center">
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E2A32', letterSpacing: '-0.02em' }}>{user.name}</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(58,141,222,0.1)', color: '#3A8DDE', border: '1px solid rgba(58,141,222,0.2)', marginTop: 6 }}>
                <ShieldCheck style={{ width: 11, height: 11 }} /> Admin
              </span>
            </div>

            {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff8ff', border: '1px solid #c8dff0', flexShrink: 0 }}>
                <Mail style={{ width: 15, height: 15, color: '#3A8DDE' }} />
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3' }}>Email</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1E2A32', marginTop: 1 }}>{user.email}</p>
              </div>
            </div>

            {user.createdAt && (
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff8ff', border: '1px solid #c8dff0', flexShrink: 0 }}>
                  <Calendar style={{ width: 15, height: 15, color: '#3A8DDE' }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3' }}>Member Since</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1E2A32', marginTop: 1 }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div style={{ ...CARD, marginTop: 16 }} className="overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-blue-400 via-blue-200 to-transparent" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound style={{ width: 15, height: 15, color: '#3A8DDE' }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>Change Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
              />
              {pwMsg && <p style={{ fontSize: 12, color: pwMsg.type === 'success' ? '#6BCF7A' : '#ef4444' }}>{pwMsg.text}</p>}
              <button
                type="submit"
                disabled={pwSaving || !newPassword || !confirmPassword}
                className="h-9 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: '#3A8DDE', color: '#fff' }}
              >
                {pwSaving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { HeadphonesIcon, Plus, X, CheckCircle2, AlertCircle, Mail, Calendar, Trash2, UserPlus, Pencil, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(1.6)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 4px 24px rgba(58,141,222,0.08), inset 0 1px 0 rgba(255,255,255,0.85)',
  borderRadius: 18,
};

const INPUT: React.CSSProperties = { width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #DDE5EC', background: 'rgba(58,141,222,0.04)', fontSize: 13, color: '#1E2A32', outline: 'none', boxSizing: 'border-box' };

const avatarGradients = [
  'linear-gradient(135deg,#059669,#047857)',
  'linear-gradient(135deg,#3A8DDE,#2F6FB2)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ec4899,#db2777)',
];

export default function SupportAdminsPage() {
  const [list, setList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<{ id: string; name: string; email: string; password: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getToken = () => localStorage.getItem('auth_token');
  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support-admins', { headers: { Authorization: `Bearer ${getToken()}` } });
      const result = await res.json();
      if (result.success) setList(result.data);
    } catch { notify('error', 'Failed to load support admins'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch('/api/admin/support-admins', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        notify('success', 'Support admin created');
        setForm({ name: '', email: '', password: '' });
        setShowForm(false);
        fetchList();
      } else notify('error', result.error || 'Failed to create');
    } catch { notify('error', 'Network error'); }
    finally { setIsAdding(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/support-admins/${editUser.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editUser.name, email: editUser.email, ...(editUser.password && { password: editUser.password }) }),
      });
      const result = await res.json();
      if (result.success) {
        setList(prev => prev.map(u => u._id === editUser.id ? { ...u, name: editUser.name, email: editUser.email } : u));
        notify('success', 'Support admin updated');
        setEditUser(null);
      } else notify('error', result.error || 'Failed');
    } catch { notify('error', 'Network error'); }
    finally { setIsSavingEdit(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/support-admins/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
      const result = await res.json();
      if (result.success) { setList(prev => prev.filter(u => u._id !== id)); notify('success', 'Support admin removed'); }
      else notify('error', result.error || 'Failed');
    } catch { notify('error', 'Network error'); }
    finally { setConfirmDeleteId(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#E9EEF2' }} className="animate-fade-up">
      <PageHeader
        title="Support Admins"
        subtitle="Manage support team access"
        breadcrumbs={[{ label: 'Admin', href: '/dashboard/admin' }, { label: 'Support Admins' }]}
        heroStrip
        actions={
          <button onClick={() => setShowForm(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, background: showForm ? '#ef4444' : '#3A8DDE', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {showForm ? <X style={{ width: 14, height: 14 }} /> : <UserPlus style={{ width: 14, height: 14 }} />}
            {showForm ? 'Cancel' : 'Add Support Admin'}
          </button>
        }
      />

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {notification && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, fontSize: 13, ...(notification.type === 'success' ? { background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#10b981' } : { background: '#fff1f2', border: '1px solid #fecaca', color: '#ef4444' }) }}>
            {notification.type === 'success' ? <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} /> : <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {notification.message}
          </div>
        )}

        {showForm && (
          <div style={{ ...CARD, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(221,229,236,0.5)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)' }}>
                <HeadphonesIcon style={{ width: 14, height: 14, color: '#059669' }} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1E2A32' }}>Add Support Admin</h3>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 16 }}>
                {[
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. Jane Smith' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'support@company.com' },
                  { label: 'Password', key: 'password', type: 'password', placeholder: 'Temporary password' },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8A97A3', marginBottom: 6 }}>{label} <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type={type} value={form[key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} required minLength={key === 'password' ? 8 : undefined} style={INPUT} />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={isAdding} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', cursor: isAdding ? 'not-allowed' : 'pointer', opacity: isAdding ? 0.6 : 1 }}>
                {isAdding ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : <Plus style={{ width: 14, height: 14 }} />}
                {isAdding ? 'Creating…' : 'Create'}
              </button>
            </form>
          </div>
        )}

        <div>
          <p style={{ fontSize: 11, color: '#8A97A3', marginBottom: 14 }}>{list.length} support admin{list.length !== 1 ? 's' : ''}</p>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', height: 100 }}><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} /></div>
          ) : list.length === 0 ? (
            <div style={CARD}><EmptyState variant="clients" title="No support admins yet" description="Add your first support admin using the button above." /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map((u, idx) => (
                <div key={u._id} style={{ ...CARD, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: avatarGradients[idx % avatarGradients.length], border: '2px solid rgba(255,255,255,0.8)' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{u.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E2A32' }}>{u.name}</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>Support Admin</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5F6B76' }}><Mail style={{ width: 12, height: 12, color: '#8A97A3' }} />{u.email}</span>
                        {u.createdAt && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5F6B76' }}><Calendar style={{ width: 12, height: 12, color: '#8A97A3' }} />Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      </div>
                    </div>
                    <button onClick={() => setEditUser({ id: u._id!, name: u.name, email: u.email, password: '' })} title="Edit"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 9px', borderRadius: 9, background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eff8ff'; (e.currentTarget as HTMLElement).style.color = '#3A8DDE'; (e.currentTarget as HTMLElement).style.borderColor = '#c8dff0'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; (e.currentTarget as HTMLElement).style.color = '#8A97A3'; (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'; }}>
                      <Pencil style={{ width: 13, height: 13 }} />
                    </button>
                    <button onClick={() => setConfirmDeleteId(u._id!)} title="Remove"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 9px', borderRadius: 9, background: 'rgba(58,141,222,0.06)', color: '#8A97A3', border: '1px solid #DDE5EC', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff1f2'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = '#fecaca'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(58,141,222,0.06)'; (e.currentTarget as HTMLElement).style.color = '#8A97A3'; (e.currentTarget as HTMLElement).style.borderColor = '#DDE5EC'; }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...CARD, maxWidth: 380, width: '100%', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E2A32' }}>Edit Support Admin</h3>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A97A3' }}><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A97A3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Name</label>
                <input value={editUser.name} onChange={e => setEditUser(p => p && ({ ...p, name: e.target.value }))} required style={INPUT} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A97A3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
                <input type="email" value={editUser.email} onChange={e => setEditUser(p => p && ({ ...p, email: e.target.value }))} required style={INPUT} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A97A3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>New Password <span style={{ color: '#8A97A3', fontWeight: 400, textTransform: 'none' }}>(leave blank to keep)</span></label>
                <input type="password" value={editUser.password} onChange={e => setEditUser(p => p && ({ ...p, password: e.target.value }))} placeholder="Enter new password" style={INPUT} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={isSavingEdit} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 0', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', opacity: isSavingEdit ? 0.6 : 1 }}>
                  <Save style={{ width: 13, height: 13 }} />{isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} style={{ fontSize: 13, fontWeight: 500, padding: '9px 16px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ ...CARD, maxWidth: 380, width: '100%', padding: 28, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2', border: '1px solid #fecaca', margin: '0 auto 16px' }}>
              <Trash2 style={{ width: 22, height: 22, color: '#ef4444' }} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E2A32', marginBottom: 8 }}>Remove Support Admin?</h3>
            <p style={{ fontSize: 13, color: '#5F6B76', lineHeight: 1.6, marginBottom: 24 }}>This will permanently delete the account. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => handleDelete(confirmDeleteId)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 10, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Trash2 style={{ width: 13, height: 13 }} /> Delete
              </button>
              <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 10, background: 'rgba(58,141,222,0.06)', color: '#334155', border: '1px solid #DDE5EC', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

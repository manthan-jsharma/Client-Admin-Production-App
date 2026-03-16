'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  Mail,
  Phone,
  Building2,
  Globe,
  FileText,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
} from 'lucide-react';

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

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Complete your profile to help your admin understand your business</p>
      </div>

      <div className="p-8 max-w-3xl space-y-6">
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

        {/* Avatar Card */}
        <Card className="bg-slate-800/60 border-slate-700/50 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Profile Picture</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-700"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl h-9 px-4 text-sm mb-2"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Uploading...' : 'Upload photo'}
              </Button>
              <p className="text-xs text-slate-600">JPEG, PNG, WebP or GIF · Max 5 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white">Profile Information</h2>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Read-only email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-slate-700/40 border-slate-700 text-slate-500 rounded-xl h-10 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-600">Email cannot be changed</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Business name</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="text"
                    name="businessName"
                    value={form.businessName}
                    onChange={handleChange}
                    placeholder="Your business name"
                    className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 555 0000"
                    className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Current website</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="url"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://yourbusiness.com"
                    className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  About your business
                  <span className="ml-2 text-xs text-slate-600 font-normal">{form.about.length}/500</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    name="about"
                    value={form.about}
                    onChange={handleChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us about your business, goals, and what you're looking to achieve..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/80 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl h-10 px-5 shadow-lg shadow-blue-600/20"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Account Info */}
        <Card className="bg-slate-800/60 border-slate-700/50 p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Account status</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/15 text-emerald-400">
                Approved
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-sm text-slate-400">Account type</span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/15 text-blue-400 capitalize">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Member since</span>
              <span className="text-sm text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

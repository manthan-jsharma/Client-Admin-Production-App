'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Testimonial } from '@/lib/types';
import {
  Star, Plus, X, CheckCircle2, Clock, AlertCircle,
  MessageSquare, ThumbsUp, ThumbsDown,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Under Review', badge: 'bg-amber-500/15 text-amber-400',    icon: Clock },
  approved: { label: 'Published',    badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Not Published', badge: 'bg-slate-600/50 text-slate-400',   icon: ThumbsDown },
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ClientTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({ testimonialText: '', rating: 0 });
  const [errors, setErrors] = useState<{ testimonialText?: string; rating?: string }>({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';

  useEffect(() => { fetchTestimonials(); }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/testimonials', { headers: { Authorization: `Bearer ${token}` } });
      const result = await res.json();
      if (result.success) setTestimonials(result.data);
    } catch { notify('error', 'Failed to load testimonials'); }
    finally { setIsLoading(false); }
  };

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.testimonialText.trim() || form.testimonialText.trim().length < 20) {
      errs.testimonialText = 'Please write at least 20 characters';
    }
    if (form.rating < 1) errs.rating = 'Please select a star rating';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setTestimonials(prev => [result.data, ...prev]);
        setForm({ testimonialText: '', rating: 0 });
        setShowForm(false);
        notify('success', 'Testimonial submitted! It will be reviewed and published shortly.');
      } else {
        notify('error', result.error || 'Failed to submit testimonial');
      }
    } catch { notify('error', 'Network error. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const hasSubmitted = testimonials.length > 0;

  return (
    <div className="min-h-screen">
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Testimonial</h1>
            <p className="text-sm text-slate-500 mt-1">Share your experience — published testimonials are shown publicly</p>
          </div>
          {!hasSubmitted && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
                showForm
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              }`}
            >
              {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Write Testimonial</>}
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {notification && (
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm ${
            notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {notification.message}
          </div>
        )}

        {/* Info card */}
        <Card className="bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-slate-800/60 border-blue-500/20 p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Your voice matters</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Share your experience working with us. Approved testimonials are featured on our website and marketing materials.
                All submissions are reviewed before publishing — you'll be notified of the outcome.
              </p>
            </div>
          </div>
        </Card>

        {/* Submit form */}
        {showForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-sm font-semibold text-white">Write Your Testimonial</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Star Rating <span className="text-red-400">*</span>
                </label>
                <StarRating value={form.rating} onChange={v => { setForm(f => ({ ...f, rating: v })); setErrors(e => ({ ...e, rating: '' })); }} />
                {errors.rating && <p className="text-xs text-red-400 mt-1">{errors.rating}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">
                  Your Testimonial <span className="text-red-400">*</span>
                  <span className="text-slate-600 font-normal ml-2">({form.testimonialText.length}/500)</span>
                </label>
                <textarea
                  value={form.testimonialText}
                  onChange={e => { setForm(f => ({ ...f, testimonialText: e.target.value.slice(0, 500) })); setErrors(er => ({ ...er, testimonialText: '' })); }}
                  placeholder="Describe your experience working with us. What made the project successful? What did you appreciate most?"
                  rows={5}
                  className={`w-full px-4 py-3 bg-slate-700/80 border text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm resize-none leading-relaxed ${errors.testimonialText ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                />
                {errors.testimonialText && <p className="text-xs text-red-400">{errors.testimonialText}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20 disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : <><MessageSquare className="w-4 h-4" /> Submit Testimonial</>}
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-5 h-10">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Testimonials list */}
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-7 h-7 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : testimonials.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">No testimonial submitted yet</p>
            <p className="text-slate-600 text-sm mb-4">Share your experience with the team</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-9 px-4 text-sm mx-auto flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Write Testimonial
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {testimonials.map(t => {
              const sc = STATUS_CONFIG[t.status];
              const StatusIcon = sc.icon;
              return (
                <Card key={t._id} className={`border transition-all ${t.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <StarRating value={t.rating} />
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${sc.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    <blockquote className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-slate-600 pl-4 mb-4">
                      "{t.testimonialText}"
                    </blockquote>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-600">
                        Submitted {new Date(t.createdAt!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      {t.status === 'pending' && (
                        <p className="text-xs text-amber-400">Awaiting admin review</p>
                      )}
                      {t.status === 'approved' && (
                        <p className="text-xs text-emerald-400 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> Published
                        </p>
                      )}
                    </div>

                    {t.adminFeedback && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500">Admin note: <span className="text-slate-400">{t.adminFeedback}</span></p>
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
  );
}

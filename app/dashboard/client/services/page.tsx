'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/lib/types';
import { Package, CheckCircle2, MessageSquare, Search, Tag, ArrowRight, Sparkles } from 'lucide-react';
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

const CATEGORY_STYLES: Record<string, { badgeBg: string; badgeColor: string; badgeBorder: string; iconBg: string; iconColor: string }> = {
  Marketing:  { badgeBg: '#eff8ff', badgeColor: '#3A8DDE', badgeBorder: '#c8dff0', iconBg: '#eff8ff',  iconColor: '#3A8DDE' },
  Technical:  { badgeBg: 'rgba(107,207,122,0.1)', badgeColor: '#6BCF7A', badgeBorder: '#a7f3d0', iconBg: 'rgba(107,207,122,0.1)',  iconColor: '#6BCF7A' },
  Design:     { badgeBg: '#f5f3ff', badgeColor: '#8b5cf6', badgeBorder: '#ddd6fe', iconBg: '#f5f3ff',  iconColor: '#8b5cf6' },
  Content:    { badgeBg: '#fffbeb', badgeColor: '#f59e0b', badgeBorder: '#fde68a', iconBg: '#fffbeb',  iconColor: '#f59e0b' },
  Analytics:  { badgeBg: '#ecfeff', badgeColor: '#06b6d4', badgeBorder: '#a5f3fc', iconBg: '#ecfeff',  iconColor: '#06b6d4' },
  Consulting: { badgeBg: '#fff1f2', badgeColor: '#ef4444', badgeBorder: '#fecaca', iconBg: '#fff1f2',  iconColor: '#ef4444' },
  Other:      { badgeBg: 'rgba(58,141,222,0.06)', badgeColor: '#5F6B76', badgeBorder: '#DDE5EC', iconBg: 'rgba(58,141,222,0.06)',  iconColor: '#5F6B76' },
};

function categoryStyle(cat: string) { return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.Other; }

export default function ClientServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/admin/services', { headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } });
        const result = await res.json();
        if (result.success) setServices(result.data);
      } catch { console.error('Failed to load services'); }
      finally { setIsLoading(false); }
    };
    fetchServices();
  }, []);

  const handleInquire = (service: Service) => {
    const message = encodeURIComponent(`Hi! I'm interested in the ${service.name} (${service.currency} $${service.price.toLocaleString()}/mo). Could you tell me more about getting started and what's included?`);
    router.push(`/dashboard/client/chat?inquiry=${message}&service=${encodeURIComponent(service.name)}`);
  };

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];
  const filtered = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch && (activeCategory === 'all' || s.category === activeCategory);
  });

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Services"
        subtitle="Explore our offerings and send an inquiry directly to your team"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Services' }]}
        heroStrip
      />

      <div className="p-8 space-y-6 animate-fade-up">
        {/* Search + Category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5F6B76' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services, features…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl placeholder-slate-400 focus:outline-none text-sm transition-all"
              style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', color: '#1E2A32' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A8DDE'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,149,221,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#DDE5EC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div
            className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto flex-shrink-0"
            style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all capitalize"
                style={activeCategory === cat
                  ? { background: '#ffffff', color: '#1E2A32', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#5F6B76' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
            <p className="text-xs" style={{ color: '#5F6B76' }}>Loading services…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState variant="generic" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(service => {
              const cs = categoryStyle(service.category);
              return (
                <div
                  key={service._id}
                  className="transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden group"
                  style={{ ...CARD, cursor: 'default' }}
                >
                  {/* Image / Hero */}
                  <div className="h-36 flex items-center justify-center relative overflow-hidden" style={{ background: 'rgba(58,141,222,0.06)' }}>
                    {service.imageS3Key ? (
                      <img src={service.imageS3Key} alt={service.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: cs.iconBg, color: cs.iconColor }}>
                        <Package className="w-7 h-7" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cs.badgeBg, color: cs.badgeColor, border: `1px solid ${cs.badgeBorder}` }}
                      >
                        <Tag className="w-2.5 h-2.5" />{service.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-bold leading-snug flex-1" style={{ color: '#1E2A32' }}>{service.name}</h3>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold tabular-nums" style={{ color: '#1E2A32' }}>${service.price.toLocaleString()}</div>
                        <p className="text-[10px]" style={{ color: '#8A97A3' }}>{service.currency}/mo</p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed mb-4 line-clamp-3 flex-1" style={{ color: '#5F6B76' }}>{service.description}</p>

                    {service.features.length > 0 && (
                      <div className="space-y-1.5 mb-5">
                        {service.features.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#334155' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6BCF7A' }} />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {service.features.length > 4 && (
                          <p className="text-xs pl-5" style={{ color: '#8A97A3' }}>+{service.features.length - 4} more included</p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleInquire(service)}
                      className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl h-10 text-sm transition-all duration-150 active:scale-95"
                      style={{ background: '#3A8DDE', color: 'white' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2F6FB2'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#3A8DDE'; }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Inquire About This
                      <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#8A97A3' }} />
            <p className="text-xs" style={{ color: '#8A97A3' }}>
              Click <span style={{ color: '#3A8DDE' }}>Inquire</span> to start a chat with your team about any service
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

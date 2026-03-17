'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Service } from '@/lib/types';
import {
  Package, CheckCircle2, MessageSquare, Search, Tag,
  DollarSign, ArrowRight, Sparkles,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Marketing: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Technical: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Design: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Content: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Analytics: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Consulting: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  Other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
};

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
}

export default function ClientServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/admin/services', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const result = await res.json();
        if (result.success) setServices(result.data);
      } catch {
        console.error('Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Navigate to chat with inquiry pre-filled
  const handleInquire = (service: Service) => {
    const message = encodeURIComponent(
      `Hi! I'm interested in the ${service.name} (${service.currency} $${service.price.toLocaleString()}/mo). ` +
      `Could you tell me more about getting started and what's included?`
    );
    const serviceName = encodeURIComponent(service.name);
    router.push(`/dashboard/client/chat?inquiry=${message}&service=${serviceName}`);
  };

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const filtered = services.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Additional Services</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore our service offerings and send an inquiry directly to your admin
        </p>
      </div>

      <div className="p-8 space-y-6">
        {/* Search + Category filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-x-auto flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all capitalize ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {searchQuery ? 'No services match your search' : 'No services available yet'}
            </p>
            <p className="text-slate-600 text-sm">Check back soon or contact your admin</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(service => {
              const cs = categoryStyle(service.category);
              return (
                <Card
                  key={service._id}
                  className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200 flex flex-col overflow-hidden group"
                >
                  {/* Image placeholder / S3 image */}
                  <div className="h-36 bg-gradient-to-br from-slate-700/60 to-slate-800/80 flex items-center justify-center relative overflow-hidden">
                    {service.imageS3Key ? (
                      // TODO: Replace with <img src={getS3Url(service.imageS3Key)} ... />
                      // when AWS S3 is connected and pre-signed URL generation is set up
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <Sparkles className="w-8 h-8 text-slate-600" />
                        <p className="text-[10px] text-slate-600 font-mono px-3 text-center truncate max-w-full">
                          {service.imageS3Key}
                        </p>
                        <p className="text-[10px] text-slate-700">Image loads after S3 is connected</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5">
                        <div className={`w-12 h-12 ${cs.bg} border ${cs.border} rounded-xl flex items-center justify-center`}>
                          <Package className={`w-6 h-6 ${cs.text}`} />
                        </div>
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cs.bg} ${cs.text} ${cs.border}`}>
                        <Tag className="w-2.5 h-2.5" />
                        {service.category}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Title + price */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-bold text-white leading-tight">{service.name}</h3>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xs text-slate-500">{service.currency}</span>
                          <span className="text-xl font-bold text-white">${service.price.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-600">per month</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3 flex-1">
                      {service.description}
                    </p>

                    {/* Features */}
                    {service.features.length > 0 && (
                      <div className="space-y-1.5 mb-5">
                        {service.features.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {service.features.length > 4 && (
                          <p className="text-xs text-slate-600 pl-5">
                            +{service.features.length - 4} more included
                          </p>
                        )}
                      </div>
                    )}

                    {/* Inquiry button */}
                    <Button
                      onClick={() => handleInquire(service)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl h-10 text-sm shadow-lg shadow-blue-600/20 transition-all group-hover:shadow-blue-600/30"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Inquire About This Service
                      <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer tip */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-slate-600 text-center pt-2">
            Click <span className="text-blue-400">Inquire</span> on any service to start a conversation with your admin
          </p>
        )}
      </div>
    </div>
  );
}

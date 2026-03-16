'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';
import {
  Users,
  Plus,
  X,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  Pencil,
  Search,
} from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '' });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/admin/clients', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const result = await response.json();
        if (result.success) setClients(result.data);
      } catch (error) {
        console.error('[v0] Failed to fetch clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[v0] Would create client:', formData);
    setFormData({ name: '', email: '', company: '', phone: '' });
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avatarGradients = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-emerald-500 to-emerald-700',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Clients</h1>
            <p className="text-sm text-slate-500 mt-1">{clients.length} registered clients</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 font-medium rounded-xl h-10 px-4 transition-all ${
              showForm
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {showForm ? (
              <><X className="w-4 h-4" /> Cancel</>
            ) : (
              <><Plus className="w-4 h-4" /> Add Client</>
            )}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Add Client Form */}
        {showForm && (
          <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/20">
              <h2 className="text-base font-semibold text-white">Add New Client</h2>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Full Name <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Corp"
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
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 555 0000"
                      className="pl-10 bg-slate-700/80 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 rounded-xl h-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl px-6 h-10 shadow-lg shadow-blue-600/20"
                >
                  Add Client
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl px-6 h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm transition-all"
          />
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client, idx) => (
              <Card key={client._id} className="bg-slate-800/60 border-slate-700/50 hover:border-slate-600 transition-all duration-200 group">
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-base font-bold text-white">
                        {client.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{client.name}</h3>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full capitalize font-medium">
                        {client.role}
                      </span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                  </div>

                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2.5 text-xs">
                      <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="text-slate-400 truncate">{client.email}</span>
                    </div>
                    {client.company && (
                      <div className="flex items-center gap-2.5 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        <span className="text-slate-400">{client.company}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        <span className="text-slate-400">{client.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5">
                      <ExternalLink className="w-3 h-3" /> Profile
                    </Button>
                    <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-xl h-8 flex items-center justify-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/60 border-slate-700/50 p-14 text-center">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium mb-1.5">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </p>
            <p className="text-slate-600 text-sm">
              {searchQuery ? 'Try a different search term' : 'Click "Add Client" to add your first client'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

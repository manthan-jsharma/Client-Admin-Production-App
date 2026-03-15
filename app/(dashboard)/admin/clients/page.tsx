'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/admin/clients', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setClients(result.data);
        }
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
    // This would normally hit a real API endpoint to create a new client user
    console.log('[v0] Would create client:', formData);
    setFormData({ name: '', email: '', company: '', phone: '' });
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Clients</h1>
          <p className="text-slate-400">Manage all your clients</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {showForm ? '✕ Cancel' : '+ Add Client'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Add Client Form */}
        {showForm && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Add New Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                  <Input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Client Corp"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1-555-0000"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Add Client
              </Button>
            </form>
          </Card>
        )}

        {/* Clients List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client._id} className="bg-slate-800 border-slate-700 p-6 hover:border-blue-500 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">
                      {client.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{client.name}</h3>
                    <p className="text-slate-400 text-xs">{client.role}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <span className="text-slate-400">Email</span>
                    <p className="text-white break-all">{client.email}</p>
                  </div>
                  {client.company && (
                    <div>
                      <span className="text-slate-400">Company</span>
                      <p className="text-white">{client.company}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <span className="text-slate-400">Phone</span>
                      <p className="text-white">{client.phone}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700 flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
                    View Profile
                  </Button>
                  <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <div className="mb-4 text-4xl">👥</div>
            <p className="text-slate-400 mb-2 font-medium">No clients yet</p>
            <p className="text-slate-500 text-sm">Add a client to get started</p>
          </Card>
        )}
      </div>
    </div>
  );
}

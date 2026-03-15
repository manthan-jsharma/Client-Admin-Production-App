'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'client' as const,
    phone: '',
    company: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.phone || undefined,
        formData.company || undefined
      );

      router.push(formData.role === 'admin' ? '/dashboard/admin' : '/dashboard/client');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Create Account</h1>
          <p className="text-slate-400 text-center mb-8">Join our project management platform</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="client">Client</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
              <Input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your Company"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1-555-0000"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
              <p className="text-xs text-slate-400 mt-1">Must include uppercase, lowercase, and numbers</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-6"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter email and password');
      }

      await login(email, password);
      
      // Redirect based on email domain
      // Give a tiny bit of time for state to settle
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (email.includes('admin')) {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/client');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h1>
          <p className="text-slate-400 text-center mb-8">Login to your project management dashboard</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-6"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-400 mb-2 font-semibold">Demo Credentials:</p>
            <p className="text-xs text-slate-400">Client: client@example.com / Password: Test1234</p>
            <p className="text-xs text-slate-400">Admin: admin@example.com / Password: Test1234</p>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

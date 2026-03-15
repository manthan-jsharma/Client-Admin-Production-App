'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Payment } from '@/lib/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/payments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setPayments(result.data);
        }
      } catch (error) {
        console.error('[v0] Failed to fetch payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 p-8">
        <h1 className="text-4xl font-bold text-white mb-2">Payment Tracking</h1>
        <p className="text-slate-400">View all project payments and invoices</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Total Paid</div>
            <div className="text-3xl font-bold text-green-400">${totalPaid.toLocaleString()}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-400">${totalPending.toLocaleString()}</div>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">Total Value</div>
            <div className="text-3xl font-bold text-blue-400">${(totalPaid + totalPending).toLocaleString()}</div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-slate-800 border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Payment History</h2>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-700/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Paid Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">${payment.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400">{payment.currency}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid'
                            ? 'bg-green-500/20 text-green-400'
                            : payment.status === 'overdue'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400">No payments found</p>
            </div>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="bg-slate-800 border-slate-700 p-6 mt-6">
          <h2 className="text-xl font-bold text-white mb-6">Payment Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">Credit Card</span>
                <span className="text-xl">💳</span>
              </div>
              <p className="text-sm text-slate-400">•••• •••• •••• 4242</p>
              <p className="text-xs text-slate-500 mt-1">Expires 12/25</p>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">Bank Transfer</span>
                <span className="text-xl">🏦</span>
              </div>
              <p className="text-sm text-slate-400">Account ending in 5678</p>
              <p className="text-xs text-slate-500 mt-1">Primary method</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

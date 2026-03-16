'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Payment } from '@/lib/types';
import {
  DollarSign,
  Clock,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/payments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const result = await response.json();
        if (result.success) setPayments(result.data);
      } catch (error) {
        console.error('[v0] Failed to fetch payments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  const statusConfig = {
    paid: { label: 'Paid', badge: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
    pending: { label: 'Pending', badge: 'bg-amber-500/15 text-amber-400', icon: Clock },
    overdue: { label: 'Overdue', badge: 'bg-red-500/15 text-red-400', icon: AlertCircle },
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Payment Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">View all project payments and invoices</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/60 border-slate-700/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mb-0.5">${totalPaid.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Paid</div>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400 mb-0.5">${totalPending.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Pending</div>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700/50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-400 mb-0.5">${(totalPaid + totalPending + totalOverdue).toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total Value</div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-slate-800/60 border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Payment History</h2>
              <p className="text-xs text-slate-500 mt-0.5">{payments.length} transactions</p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 flex justify-center">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-700/20">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Paid Date</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {payments.map((payment) => {
                    const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <tr key={payment._id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 text-white font-semibold">${payment.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{payment.currency}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{new Date(payment.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">{payment.notes || <span className="text-slate-600">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-14 text-center">
              <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium mb-1.5">No payments found</p>
              <p className="text-slate-600 text-sm">Payments will appear here once created</p>
            </div>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="bg-slate-800/60 border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-base font-semibold text-white">Payment Methods</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Credit Card</p>
                <p className="text-xs text-slate-500 mt-0.5">•••• •••• •••• 4242 · Expires 12/25</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Bank Transfer</p>
                <p className="text-xs text-slate-500 mt-0.5">Account ending in 5678 · Primary</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

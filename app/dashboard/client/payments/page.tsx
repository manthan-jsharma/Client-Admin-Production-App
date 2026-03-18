'use client';

import React, { useState, useEffect } from 'react';
import { Payment } from '@/lib/types';
import {
  DollarSign, Clock, CreditCard, Building2,
  CheckCircle2, AlertCircle, ArrowUpRight, Receipt, TrendingUp,
} from 'lucide-react';
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
        console.error('[payments] fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const totalValue = totalPaid + totalPending + totalOverdue;

  const statusConfig = {
    paid:    { label: 'Paid',    dot: 'bg-emerald-400', icon: CheckCircle2,  badgeBg: 'rgba(107,207,122,0.1)', badgeColor: '#6BCF7A', badgeBorder: '#a7f3d0' },
    pending: { label: 'Pending', dot: 'bg-amber-400',   icon: Clock,         badgeBg: '#fffbeb', badgeColor: '#f59e0b', badgeBorder: '#fde68a' },
    overdue: { label: 'Overdue', dot: 'bg-red-400',     icon: AlertCircle,   badgeBg: '#fff1f2', badgeColor: '#ef4444', badgeBorder: '#fecaca' },
  };

  const statCards = [
    { label: 'Total Paid',   value: totalPaid,    color: 'green',  Icon: CheckCircle2, sub: `${payments.filter(p => p.status === 'paid').length} paid invoices`,      accentColor: '#6BCF7A' },
    { label: 'Pending',      value: totalPending, color: 'amber',  Icon: Clock,        sub: `${payments.filter(p => p.status === 'pending').length} awaiting payment`, accentColor: '#f59e0b' },
    { label: 'Total Value',  value: totalValue,   color: 'blue',   Icon: DollarSign,   sub: 'Across all invoices',                                                      accentColor: '#3A8DDE' },
  ];

  const iconBoxStyles: Record<string, React.CSSProperties> = {
    green: { background: 'rgba(107,207,122,0.1)', color: '#6BCF7A' },
    amber: { background: '#fffbeb', color: '#f59e0b' },
    blue:  { background: '#eff8ff', color: '#3A8DDE' },
  };

  const valueColors: Record<string, string> = {
    green: '#6BCF7A',
    amber: '#f59e0b',
    blue:  '#3A8DDE',
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Payments"
        subtitle="Your invoices and billing history"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/client' }, { label: 'Payments' }]}
        heroStrip
      />

      <div className="p-8 space-y-6 animate-fade-up">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map(stat => (
            <div
              key={stat.label}
              className="relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 p-5"
              style={CARD}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, #3A8DDE, #52b7f4)' }} />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={iconBoxStyles[stat.color]}>
                  <stat.Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4" style={{ color: '#8A97A3' }} />
              </div>
              <div className="text-2xl font-bold tabular-nums mb-0.5" style={{ color: valueColors[stat.color] }}>
                ${stat.value.toLocaleString()}
              </div>
              <div className="text-sm font-medium mb-0.5" style={{ color: '#1E2A32' }}>{stat.label}</div>
              <div className="text-xs" style={{ color: '#5F6B76' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <div className="overflow-hidden" style={CARD}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Payment History</h2>
              <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>{payments.length} total transactions</p>
            </div>
            {totalOverdue > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#fff1f2', border: '1px solid #fecaca' }}>
                <AlertCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                <span className="text-xs font-medium" style={{ color: '#ef4444' }}>${totalOverdue.toLocaleString()} overdue</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(58,141,222,0.2)', borderTopColor: '#3A8DDE' }} />
              <p className="text-xs" style={{ color: '#5F6B76' }}>Loading payments…</p>
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(58,141,222,0.06)' }}>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Invoice</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Amount</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Status</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Due Date</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Paid On</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#5F6B76' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, idx) => {
                    const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <tr
                        key={payment._id}
                        className="transition-colors duration-100 group"
                        style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? 'rgba(58,141,222,0.025)' : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(58,141,222,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
                            <span className="text-xs font-mono" style={{ color: '#5F6B76' }}>#{payment._id?.slice(-6).toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold tabular-nums" style={{ color: '#1E2A32' }}>${payment.amount.toLocaleString()}</p>
                          <p className="text-xs" style={{ color: '#8A97A3' }}>{payment.currency}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: config.badgeBg, color: config.badgeColor, border: `1px solid ${config.badgeBorder}`, borderRadius: '9999px', fontSize: '11px', padding: '2px 10px', fontWeight: 600 }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#5F6B76' }}>{new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-6 py-4">
                          {payment.paidDate
                            ? <span className="text-sm" style={{ color: '#6BCF7A' }}>{new Date(payment.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            : <span style={{ color: '#8A97A3' }}>—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm max-w-[200px] truncate" style={{ color: '#5F6B76' }}>{payment.notes || <span style={{ color: '#8A97A3' }}>—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState variant="payments" />
          )}
        </div>

        {/* Payment Methods */}
        <div className="overflow-hidden" style={CARD}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#1E2A32' }}>Payment Methods</h2>
            <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>Methods on file for your account</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: CreditCard, iconStyle: { color: '#3A8DDE', background: '#eff8ff' }, label: 'Credit Card',   sub: '•••• •••• •••• 4242 · Exp 12/25' },
              { icon: Building2,  iconStyle: { color: '#6BCF7A', background: 'rgba(107,207,122,0.1)' }, label: 'Bank Transfer', sub: 'Account ending in 5678 · Primary' },
            ].map(method => {
              const Icon = method.icon;
              return (
                <div
                  key={method.label}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                  style={{ background: 'rgba(58,141,222,0.06)', border: '1px solid #DDE5EC', borderRadius: '12px' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c8dff0'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#DDE5EC'; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={method.iconStyle}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1E2A32' }}>{method.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#5F6B76' }}>{method.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

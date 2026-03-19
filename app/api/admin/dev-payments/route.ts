import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getAllDevPayments, createDevPayment, getAllUsers } from '@/lib/db';
import { DevPayment } from '@/lib/types';

function adminOnly(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.role === 'admin' ? payload : null;
}

export async function GET(request: NextRequest) {
  if (!adminOnly(request)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const payments = await getAllDevPayments();
  return NextResponse.json({ success: true, data: payments });
}

export async function POST(request: NextRequest) {
  if (!adminOnly(request)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const { projectId, devId, amount, currency, status, paymentMethod, notes, paidDate } = body;
  if (!projectId || !devId || !amount) {
    return NextResponse.json({ success: false, error: 'projectId, devId, and amount are required' }, { status: 400 });
  }
  // Resolve dev name
  const allUsers = await getAllUsers();
  const dev = allUsers.find(u => u._id === devId);
  const payment: DevPayment = {
    projectId, devId, devName: dev?.name,
    amount: parseFloat(amount), currency: currency ?? 'USD',
    status: status ?? 'pending',
    paymentMethod: paymentMethod || undefined,
    notes: notes || undefined,
    paidDate: paidDate ? new Date(paidDate) : undefined,
  };
  const created = await createDevPayment(payment);
  return NextResponse.json({ success: true, data: created }, { status: 201 });
}

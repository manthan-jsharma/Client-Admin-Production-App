import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, createPayment } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { Payment } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let payments = await getAllPayments();
    if (status) payments = payments.filter(p => p.status === status);

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, clientId, clientName, amount, currency, status, paymentMethod, notes, dueDate } = body;

    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }
    if (!dueDate) return NextResponse.json({ error: 'dueDate is required' }, { status: 400 });

    const payment: Payment = {
      projectId,
      clientId: clientId || undefined,
      clientName: clientName || undefined,
      amount,
      currency: currency || 'USD',
      status: status || 'pending',
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
      dueDate: new Date(dueDate),
    };

    const created = await createPayment(payment);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

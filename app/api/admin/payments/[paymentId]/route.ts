import { NextRequest, NextResponse } from 'next/server';
import { updatePayment, getUserById } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { sendPaymentUpdated } from '@/lib/email';
import { tgPaymentUpdated } from '@/lib/telegram';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { paymentId } = await params;
    const body = await request.json();
    const { amount, status, paymentMethod, notes, dueDate, paidDate } = body;

    const validStatuses = ['pending', 'paid', 'overdue'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 });
    }
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (amount !== undefined) updates.amount = amount;
    if (status !== undefined) updates.status = status;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (notes !== undefined) updates.notes = notes;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (paidDate !== undefined) updates.paidDate = paidDate ? new Date(paidDate) : undefined;

    // Auto-set paidDate when marking as paid
    if (status === 'paid' && !updates.paidDate) {
      updates.paidDate = new Date();
    }

    const updated = await updatePayment(paymentId, updates);
    if (!updated) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // Notify client about payment update when status or amount changes
    if ((updates.status || updates.amount) && updated.clientId) {
      const clientUser = await getUserById(updated.clientId);
      if (clientUser) {
        sendPaymentUpdated({
          clientEmail: clientUser.email,
          clientName: clientUser.name,
          amount: updated.amount,
          currency: updated.currency,
          newStatus: updated.status,
          notes: updated.notes,
          dueDate: updated.dueDate,
        });
        void tgPaymentUpdated({
          clientId: updated.clientId,
          amount: updated.amount,
          status: updated.status,
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

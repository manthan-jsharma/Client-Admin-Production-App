import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { updateDevPayment } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const { paymentId } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.amount !== undefined) updates.amount = parseFloat(body.amount);
  if (body.status !== undefined) updates.status = body.status;
  if (body.paymentMethod !== undefined) updates.paymentMethod = body.paymentMethod || undefined;
  if (body.notes !== undefined) updates.notes = body.notes || undefined;
  if (body.paidDate !== undefined) updates.paidDate = body.paidDate ? new Date(body.paidDate) : undefined;
  const updated = await updateDevPayment(paymentId, updates);
  if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: updated });
}

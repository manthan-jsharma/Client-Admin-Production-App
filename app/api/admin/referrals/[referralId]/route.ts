import { NextRequest, NextResponse } from 'next/server';
import { updateReferral } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ referralId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { referralId } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'contacted', 'converted', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await updateReferral(referralId, { status });
    if (!updated) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

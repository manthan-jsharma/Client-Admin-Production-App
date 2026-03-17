import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getLeadGenRequestById, updateLeadGenRequest } from '@/lib/db';
import { tgLeadGenReviewed } from '@/lib/telegram';

// PATCH /api/admin/lead-gen/[requestId]
// Admin approves or rejects a lead gen request with optional feedback
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { requestId } = await params;
    const existing = await getLeadGenRequestById(requestId);
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const body = await request.json();
    const { status, adminFeedback } = body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminFeedback !== undefined) updates.adminFeedback = adminFeedback?.trim() || undefined;

    const updated = await updateLeadGenRequest(requestId, updates);

    // Notify client when status changes
    if (updates.status && updates.status !== existing.status) {
      const newStatus = updates.status as string;
      if (newStatus === 'approved' || newStatus === 'rejected') {
        void tgLeadGenReviewed({
          clientId: existing.clientId,
          status: newStatus,
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating lead gen request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

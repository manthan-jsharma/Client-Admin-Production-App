import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getMaintenanceFeedbackById, updateMaintenanceFeedback, getUserById } from '@/lib/db';
import { sendMaintenanceResponse } from '@/lib/email';
import { tgMaintenanceResponse } from '@/lib/telegram';

// PATCH /api/admin/maintenance/[submissionId]
// Admin responds to a submission and/or updates its status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { submissionId } = await params;
    const existing = await getMaintenanceFeedbackById(submissionId);
    if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    const body = await request.json();
    const { status, adminResponse } = body;

    const validStatuses = ['new', 'open', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminResponse !== undefined) {
      const trimmed = adminResponse?.trim() || '';
      updates.adminResponse = trimmed || undefined;
      if (trimmed) updates.respondedAt = new Date();
    }

    const updated = await updateMaintenanceFeedback(submissionId, updates);

    // If admin just added/updated a response, notify the client
    const newResponse = (updates.adminResponse as string | undefined);
    if (newResponse) {
      const client = await getUserById(existing.clientId);
      if (client?.email) {
        void sendMaintenanceResponse({
          clientEmail: client.email,
          clientName: existing.clientName || client.name || 'Client',
          originalMessage: existing.message,
          adminResponse: newResponse,
          status: (updates.status as string) || existing.status,
        });
        void tgMaintenanceResponse({
          clientId: existing.clientId,
          adminResponse: newResponse,
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating maintenance feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

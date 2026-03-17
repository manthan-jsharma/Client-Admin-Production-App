import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { approveClient } from '@/lib/db';
import { ApiResponse, User } from '@/lib/types';
import { sendAccountApproved } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { clientId } = await params;
    const updated = await approveClient(clientId);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    sendAccountApproved({ name: updated.name, email: updated.email });

    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json(
      { success: true, message: 'Client approved', data: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin] Approve client error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

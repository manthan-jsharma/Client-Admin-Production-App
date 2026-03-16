import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { rejectClient } from '@/lib/db';
import { ApiResponse, User } from '@/lib/types';

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
    const body = await request.json();
    const { feedback } = body;

    if (!feedback || feedback.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Please provide a reason for rejection (at least 5 characters)' },
        { status: 400 }
      );
    }

    const updated = await rejectClient(clientId, feedback.trim());

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json(
      { success: true, message: 'Client rejected', data: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin] Reject client error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

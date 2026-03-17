import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getAdminNotificationCounts, getClientNotificationCounts } from '@/lib/db';

// GET /api/notifications — returns badge counts for the sidebar
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    if (payload.role === 'admin') {
      const counts = await getAdminNotificationCounts(payload.userId);
      return NextResponse.json({ success: true, data: counts });
    } else {
      const counts = await getClientNotificationCounts(payload.userId);
      return NextResponse.json({ success: true, data: counts });
    }
  } catch (error) {
    console.error('[notifications] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

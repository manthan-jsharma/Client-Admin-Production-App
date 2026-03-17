import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getAllMaintenanceFeedback } from '@/lib/db';

// GET /api/admin/maintenance — admin: get all submissions (optionally filtered by status)
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let items = await getAllMaintenanceFeedback();
    if (statusFilter) {
      items = items.filter(f => f.status === statusFilter);
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching maintenance feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

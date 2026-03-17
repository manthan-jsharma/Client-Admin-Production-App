import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getAllLeadGenRequests } from '@/lib/db';

// GET /api/admin/lead-gen — admin: get all lead gen requests
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

    let requests = await getAllLeadGenRequests();
    if (statusFilter) {
      requests = requests.filter(r => r.status === statusFilter);
    }

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching lead gen requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { deleteUser } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ devId: string }> }
) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { devId } = await params;
  const ok = await deleteUser(devId);
  if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  return NextResponse.json({ success: true });
}

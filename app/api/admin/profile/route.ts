import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, hashPassword } from '@/lib/auth';
import { adminUpdateStaff } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || !['admin', 'support_admin'].includes(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { currentPassword, newPassword } = await request.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  const updated = await adminUpdateStaff(payload.userId, { password: hashed });
  if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  return NextResponse.json({ success: true });
}

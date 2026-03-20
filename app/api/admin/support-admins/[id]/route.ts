import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { deleteUser, adminUpdateStaff } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendSupportAdminUpdated } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { name, email, password } = await request.json();
  if (!name && !email && !password) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const hashed = password ? await hashPassword(password) : undefined;
  const updated = await adminUpdateStaff(id, { name, email, password: hashed });
  if (!updated) return NextResponse.json({ error: 'Failed to update' }, { status: 500 });

  void sendSupportAdminUpdated({ name: updated.name, email: updated.email, ...(password && { newPassword: password }) });
  const { password: _p, ...safe } = updated;
  return NextResponse.json({ success: true, data: safe });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const ok = await deleteUser(id);
  if (!ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  return NextResponse.json({ success: true });
}

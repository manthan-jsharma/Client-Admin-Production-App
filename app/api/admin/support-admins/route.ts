import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, hashPassword } from '@/lib/auth';
import { getAllSupportAdmins, createUser } from '@/lib/db';
import { User } from '@/lib/types';
import { sendSupportAdminCreated } from '@/lib/email';

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const list = await getAllSupportAdmins();
  return NextResponse.json({ success: true, data: list.map(({ password: _p, ...r }) => r) });
}

export async function POST(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, password } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ error: 'name, email, password required' }, { status: 400 });

  const hashed = await hashPassword(password);
  const user: User = { name, email, password: hashed, role: 'support_admin', status: 'approved', addedByAdmin: true };
  const created = await createUser(user);
  void sendSupportAdminCreated({ name, email, password });
  const { password: _p, ...safe } = created;
  return NextResponse.json({ success: true, data: safe }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, hashPassword } from '@/lib/auth';
import { getAllDevs, createUser } from '@/lib/db';
import { User } from '@/lib/types';
import { sendDevAccountCreated } from '@/lib/email';

// GET /api/admin/devs — list all devs
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const devs = await getAllDevs();
    // Strip passwords from response
    const safe = devs.map(({ password: _p, ...rest }) => rest);
    return NextResponse.json({ success: true, data: safe });
  } catch (error) {
    console.error('[admin/devs] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/devs — create a new dev user
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password are required' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      name,
      email,
      password: hashedPassword,
      role: 'dev',
      status: 'approved',
      addedByAdmin: true,
    };

    const created = await createUser(newUser);
    void sendDevAccountCreated({ name, email, password });
    const { password: _p, ...safe } = created;
    return NextResponse.json({ success: true, data: safe }, { status: 201 });
  } catch (error) {
    console.error('[admin/devs] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

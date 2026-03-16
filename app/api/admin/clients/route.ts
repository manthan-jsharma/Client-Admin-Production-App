import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, hashPassword, isValidEmail, isValidPassword } from '@/lib/auth';
import { getAllUsers, createUser, getUserByEmail } from '@/lib/db';
import { User, ApiResponse } from '@/lib/types';

// GET /api/admin/clients — list all clients
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<User[]>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }

    const allUsers = await getAllUsers();
    const clients = allUsers
      .filter(u => u.role === 'client')
      .map(({ password, ...u }) => u);

    return NextResponse.json({ success: true, data: clients }, { status: 200 });
  } catch (error) {
    console.error('[admin] GET clients error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/clients — admin manually adds a client (auto-approved)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, businessName, password, phone, company } = body;

    // Validate
    if (!name || !email || !businessName || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, business name, and password are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters with uppercase, lowercase, and a number' },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: 'client',
      businessName: businessName.trim(),
      phone: phone?.trim() || undefined,
      company: company?.trim() || businessName.trim(),
      status: 'approved',      // Admin-added clients are auto-approved
      addedByAdmin: true,
      approvedAt: new Date(),
    };

    const created = await createUser(newUser);
    const { password: _, ...userWithoutPassword } = created;

    return NextResponse.json(
      { success: true, message: 'Client created successfully', data: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('[admin] POST clients error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

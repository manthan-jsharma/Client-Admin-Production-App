import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { comparePassword, createToken, isValidEmail } from '@/lib/auth';
import { ApiResponse, AuthResponse } from '@/lib/types';

// POST /api/auth/admin-login
// Like /api/auth/login but explicitly rejects non-admin accounts.
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    // Use a generic error so we don't reveal whether the email exists
    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Hard-reject non-admin accounts — gives no clue about role to an attacker
    if (user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createToken({ userId: user._id!, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { success: true, message: 'Login successful', data: { success: true, token, user: userWithoutPassword } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[auth] Admin login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

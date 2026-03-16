import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { comparePassword, createToken, isValidEmail } from '@/lib/auth';
import { ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Find user
    const user = await getUserByEmail(email);
    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // ── Status checks (clients only — admins are always approved) ──
    if (user.role === 'client') {
      if (user.status === 'pending') {
        // Issue a limited token so the pending page can identify the user
        const token = createToken({ userId: user._id!, email: user.email, role: user.role });
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(
          {
            success: true,
            message: 'Account pending approval',
            data: { success: true, token, user: userWithoutPassword }
          },
          { status: 200 }
        );
      }

      if (user.status === 'rejected') {
        const feedback = user.approvalFeedback
          ? `Your account was not approved. Reason: ${user.approvalFeedback}`
          : 'Your account was not approved. Please contact support.';
        return NextResponse.json({ success: false, error: feedback }, { status: 403 });
      }
    }

    // Generate token
    const token = createToken({ userId: user._id!, email: user.email, role: user.role });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: { success: true, token, user: userWithoutPassword }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[auth] Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

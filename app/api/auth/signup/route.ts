import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, createToken, isValidEmail, isValidPassword } from '@/lib/auth';
import { User, ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, businessName, phone, company } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!email || !password || !name || !businessName) {
      return NextResponse.json(
        { success: false, error: 'Name, business name, email, and password are required' },
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

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match' }, { status: 400 });
    }

    // ── Duplicate email check ─────────────────────────────────────────────────
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }

    // ── Create user (always client, always pending) ───────────────────────────
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: 'client',
      businessName: businessName.trim(),
      phone: phone?.trim() || undefined,
      company: company?.trim() || businessName.trim(),
      status: 'pending',   // Requires admin approval
      addedByAdmin: false,
    };

    const createdUser = await createUser(newUser);

    // Issue a token even for pending users so the pending page can identify them
    const token = createToken({
      userId: createdUser._id!,
      email: createdUser.email,
      role: createdUser.role
    });

    const { password: _, ...userWithoutPassword } = createdUser;

    return NextResponse.json(
      {
        success: true,
        message: 'Account created. Waiting for admin approval.',
        data: { success: true, token, user: userWithoutPassword }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[auth] Signup error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

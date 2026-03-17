import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, createToken, isValidEmail, isValidPassword } from '@/lib/auth';
import { User, ApiResponse, AuthResponse } from '@/lib/types';

// POST /api/auth/admin-register
// Creates a new admin account — immediately approved, no pending state.
// Supabase trigger rejects the insert if there are already 3 admin accounts.
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    if (!name?.trim() || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
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

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin: User = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      role: 'admin',
      status: 'approved',        // admins are auto-approved
      approvedAt: new Date(),
      addedByAdmin: false,
    };

    // createUser → INSERT into users → Supabase trigger fires here
    // If there are already 3 admins the trigger raises an exception,
    // which surfaces as a 500 with the DB error message.
    let createdAdmin: User;
    try {
      createdAdmin = await createUser(newAdmin);
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      // Surface the trigger's message cleanly
      if (msg.includes('Maximum of 3 admin')) {
        return NextResponse.json(
          { success: false, error: 'Maximum of 3 admin accounts are allowed. Remove an existing admin before adding a new one.' },
          { status: 409 }
        );
      }
      throw dbErr; // re-throw anything else
    }

    const token = createToken({
      userId: createdAdmin._id!,
      email: createdAdmin.email,
      role: createdAdmin.role,
    });

    const { password: _, ...adminWithoutPassword } = createdAdmin;

    return NextResponse.json(
      {
        success: true,
        message: 'Admin account created successfully.',
        data: { success: true, token, user: adminWithoutPassword },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[auth] Admin register error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

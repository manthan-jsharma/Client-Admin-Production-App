import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, createToken, isValidEmail, isValidPassword } from '@/lib/auth';
import { User, ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, role, phone, company } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passwords do not match'
        },
        { status: 400 }
      );
    }

    if (!['admin', 'client'].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role'
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already registered'
        },
        { status: 409 }
      );
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role,
      phone,
      company
    };

    const createdUser = await createUser(newUser);

    // Create token
    const token = createToken({
      userId: createdUser._id!,
      email: createdUser.email,
      role: createdUser.role
    });

    // Return response without password
    const { password: _, ...userWithoutPassword } = createdUser;

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: {
          success: true,
          token,
          user: userWithoutPassword
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { comparePassword, createToken, isValidEmail } from '@/lib/auth';
import { ApiResponse, AuthResponse } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthResponse>>> {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required'
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

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password || !comparePassword(password, user.password)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Create token
    const token = createToken({
      userId: user._id!,
      email: user.email,
      role: user.role
    });

    // Return response without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          success: true,
          token,
          user: userWithoutPassword
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

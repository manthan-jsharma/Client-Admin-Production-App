import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, isValidUrl } from '@/lib/auth';
import { getUserById, updateUserProfile } from '@/lib/db';
import { ApiResponse, User } from '@/lib/types';

// PATCH /api/profile — update authenticated user's profile
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { name, phone, company, businessName, about, website } = body;

    // Input validation
    const errors: Record<string, string> = {};

    if (name !== undefined && typeof name === 'string' && name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (website !== undefined && website !== '' && !isValidUrl(website)) {
      errors.website = 'Please enter a valid URL (e.g. https://example.com)';
    }

    if (about !== undefined && typeof about === 'string' && about.length > 500) {
      errors.about = 'About section must be 500 characters or fewer';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, error: 'Validation failed', errors }, { status: 400 });
    }

    const updates: Partial<User> = {};
    if (name !== undefined) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim() || undefined;
    if (company !== undefined) updates.company = company.trim() || undefined;
    if (businessName !== undefined) updates.businessName = businessName.trim() || undefined;
    if (about !== undefined) updates.about = about.trim() || undefined;
    if (website !== undefined) updates.website = website.trim() || undefined;

    const updatedUser = await updateUserProfile(payload.userId, updates);
    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(
      { success: true, message: 'Profile updated', data: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('[profile] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/profile — get authenticated user's profile
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const user = await getUserById(payload.userId);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, data: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('[profile] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

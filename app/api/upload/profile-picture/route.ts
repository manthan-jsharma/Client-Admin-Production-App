import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/auth';
import { updateUserProfile } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

// POST /api/upload/profile-picture
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ url: string }>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // ── File type validation ───────────────────────────────────────────────────
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // ── File size validation ───────────────────────────────────────────────────
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5 MB' },
        { status: 400 }
      );
    }

    // Convert to base64 data URL for in-memory storage
    // In production: upload to S3 / Vercel Blob / Cloudinary and store the URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await updateUserProfile(payload.userId, { profilePicture: dataUrl });

    return NextResponse.json(
      { success: true, message: 'Profile picture updated', data: { url: dataUrl } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[upload] Profile picture error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

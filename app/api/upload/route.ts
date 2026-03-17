/**
 * POST /api/upload
 *
 * Generic file upload endpoint backed by Vercel Blob.
 * Accepts multipart/form-data with:
 *   - file      (File, required)
 *   - folder    (string, optional — e.g. "projects", "deliveries", "content")
 *
 * Returns: { success: true, data: { url, filename, size, contentType } }
 *
 * The returned `url` is the public Vercel Blob URL.
 * Store it directly in the database — no separate "get URL" step needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getStorageService, FileValidation } from '@/lib/services/storage-service';

const MAX_SIZE_MB = 100;

const ALLOWED_TYPES = [
  ...FileValidation.allowedImageTypes,
  ...FileValidation.allowedDocumentTypes,
  ...FileValidation.allowedVideoTypes,
  ...FileValidation.allowedAudioTypes,
];

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string | null) ?? 'uploads';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported` },
        { status: 400 }
      );
    }

    if (!FileValidation.isValidSize(file.size, MAX_SIZE_MB)) {
      return NextResponse.json(
        { error: `File exceeds ${MAX_SIZE_MB} MB limit` },
        { status: 400 }
      );
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storage = getStorageService();

    const result = await storage.upload({
      file,
      filename: safeFilename,
      contentType: file.type,
      folder: `${folder}/${payload.userId}`,
    });

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error ?? 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          url: result.url,
          filename: safeFilename,
          size: file.size,
          contentType: file.type,
          category: FileValidation.getCategory(file.type),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[upload] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

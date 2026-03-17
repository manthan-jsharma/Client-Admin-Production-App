import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getStorageService, FileValidation } from '@/lib/services/storage-service';
import { ChatAttachment } from '@/lib/types';

const ALLOWED_VOICE_TYPES = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
const ALLOWED_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/ogg', 'video/quicktime'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_VOICE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...FileValidation.allowedImageTypes,
  ...FileValidation.allowedDocumentTypes,
  'text/plain',
];
const MAX_SIZE_MB = 50;

function getAttachmentType(mimeType: string): ChatAttachment['type'] {
  if (ALLOWED_VOICE_TYPES.includes(mimeType)) return 'voice';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (mimeType.startsWith('image/')) return 'image';
  return 'file';
}

// POST /api/chat/upload
// FormData: file (File), projectId (string)
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not allowed` },
        { status: 400 }
      );
    }

    if (!FileValidation.isValidSize(file.size, MAX_SIZE_MB)) {
      return NextResponse.json({ error: `File exceeds ${MAX_SIZE_MB} MB limit` }, { status: 400 });
    }

    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storage = getStorageService();

    const result = await storage.upload({
      file,
      filename: safeFilename,
      contentType: file.type,
      folder: `chat/${projectId}/${payload.userId}`,
    });

    if (!result.success || !result.url) {
      return NextResponse.json({ error: result.error ?? 'Upload failed' }, { status: 500 });
    }

    const attachment: ChatAttachment = {
      s3Key: result.url, // stores the Vercel Blob URL (field name kept for DB compatibility)
      filename: safeFilename,
      mimeType: file.type,
      size: file.size,
      type: getAttachmentType(file.type),
    };

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  } catch (error) {
    console.error('[chat/upload] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

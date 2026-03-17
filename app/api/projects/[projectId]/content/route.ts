import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, updateProject } from '@/lib/db';

// GET /api/projects/[projectId]/content
// Returns content-distribution-specific fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { projectId } = await params;
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (payload.role === 'client' && project.clientId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (project.type !== 'content_distribution') {
      return NextResponse.json({ error: 'Not a content distribution project' }, { status: 400 });
    }

    const content = {
      hdPhotoS3Key: project.hdPhotoS3Key,
      hdPhotoStatus: project.hdPhotoStatus,
      hdPhotoAdminFeedback: project.hdPhotoAdminFeedback,
      teamSelfieVideoS3Key: project.teamSelfieVideoS3Key,
      teamSelfieVideoStatus: project.teamSelfieVideoStatus,
      teamSelfieVideoAdminFeedback: project.teamSelfieVideoAdminFeedback,
      aiCloneSampleS3Key: project.aiCloneSampleS3Key,
      aiCloneApprovalStatus: project.aiCloneApprovalStatus,
      aiCloneClientFeedback: project.aiCloneClientFeedback,
      domainName: project.domainName,
      designPreferences: project.designPreferences,
      logoS3Key: project.logoS3Key,
    };

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/projects/[projectId]/content
// Role-specific field updates for Division B
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { projectId } = await params;
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (payload.role === 'client' && project.clientId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (project.type !== 'content_distribution') {
      return NextResponse.json({ error: 'Not a content distribution project' }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (payload.role === 'client') {
      // Client can upload photos/videos and provide domain/design/logo/AI clone feedback
      const clientFields = [
        'hdPhotoS3Key',
        'teamSelfieVideoS3Key',
        'domainName',
        'designPreferences',
        'logoS3Key',
        'aiCloneApprovalStatus',
        'aiCloneClientFeedback',
      ];
      for (const key of clientFields) {
        if (key in body) updates[key] = body[key];
      }
      // Auto-set pending_review status when client uploads
      if (body.hdPhotoS3Key) updates.hdPhotoStatus = 'pending_review';
      if (body.teamSelfieVideoS3Key) updates.teamSelfieVideoStatus = 'pending_review';
      // Auto-set AI clone approval status
      if (body.aiCloneApprovalStatus) updates.aiCloneApprovalStatus = body.aiCloneApprovalStatus;
    } else {
      // Admin can review uploads, upload AI clone sample, update feedback
      const adminFields = [
        'hdPhotoStatus',
        'hdPhotoAdminFeedback',
        'teamSelfieVideoStatus',
        'teamSelfieVideoAdminFeedback',
        'aiCloneSampleS3Key',
      ];
      for (const key of adminFields) {
        if (key in body) updates[key] = body[key];
      }
      // When admin uploads AI clone sample, set status to pending_review
      if (body.aiCloneSampleS3Key) updates.aiCloneApprovalStatus = 'pending_review';
    }

    const updated = await updateProject(projectId, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating content data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

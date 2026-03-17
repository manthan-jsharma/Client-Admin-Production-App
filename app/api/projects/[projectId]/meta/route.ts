import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, updateProject } from '@/lib/db';

// PATCH /api/projects/[projectId]/meta
// Updates project-level metadata fields (github, demo video, proof, contract, scope, totalPrice)
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

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (payload.role === 'client') {
      // Client submits GitHub username and demo video
      const clientFields = ['githubUsername', 'demoVideoS3Key'];
      for (const key of clientFields) {
        if (key in body) updates[key] = body[key];
      }
    } else {
      // Admin can update contract, scope, totalPrice, proof of code, status, name, description
      const adminFields = [
        'name', 'description', 'status', 'totalPrice',
        'contractPDF', 'scopePDF', 'proofOfCodeS3Key',
        'startDate', 'endDate',
      ];
      for (const key of adminFields) {
        if (key in body) updates[key] = body[key];
      }
      if (body.startDate) updates.startDate = new Date(body.startDate);
      if (body.endDate) updates.endDate = new Date(body.endDate);
    }

    const updated = await updateProject(projectId, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating project meta:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

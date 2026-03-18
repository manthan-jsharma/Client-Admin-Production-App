import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { removeDevFromProject } from '@/lib/db';

// DELETE /api/admin/devs/[devId]/projects/[projectId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ devId: string; projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { devId, projectId } = await params;
    const success = await removeDevFromProject(projectId, devId);
    if (!success) return NextResponse.json({ error: 'Failed to remove dev from project' }, { status: 400 });

    return NextResponse.json({ success: true, message: 'Dev removed from project' });
  } catch (error) {
    console.error('[admin/devs/projects] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

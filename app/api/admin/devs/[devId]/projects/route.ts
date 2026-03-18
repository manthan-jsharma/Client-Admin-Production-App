import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectsByUserId, assignDevToProject, removeDevFromProject } from '@/lib/db';

// GET /api/admin/devs/[devId]/projects — projects assigned to this dev
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ devId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { devId } = await params;
    const projects = await getProjectsByUserId(devId, 'dev');
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('[admin/devs/[devId]/projects] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/devs/[devId]/projects — assign dev to a project
// body: { projectId }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ devId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { devId } = await params;
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const success = await assignDevToProject(projectId, devId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to assign dev to project' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Dev assigned to project' });
  } catch (error) {
    console.error('[admin/devs/[devId]/projects] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/devs/[devId]/projects — remove dev from a project
// body: { projectId }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ devId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { devId } = await params;
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const success = await removeDevFromProject(projectId, devId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove dev from project' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Dev removed from project' });
  } catch (error) {
    console.error('[admin/devs/[devId]/projects] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

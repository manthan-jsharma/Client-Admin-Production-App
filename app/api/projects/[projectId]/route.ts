import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, updateProject } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { projectId } = await params;
    const project = await getProjectById(projectId);

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (decoded.role === 'client' && project.clientId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId } = await params;
    const body = await request.json();

    if (body.name && typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Invalid project name' }, { status: 400 });
    }

    const updated = await updateProject(projectId, body);
    if (!updated) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

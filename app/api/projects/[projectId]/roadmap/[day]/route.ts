import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, updateRoadmapItem } from '@/lib/db';
// PATCH /api/projects/[projectId]/roadmap/[day]
// Admin updates a roadmap day: title, description, videoUrl, completed, adminNotes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; day: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'dev')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { projectId, day } = await params;
    const dayNum = parseInt(day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 14) {
      return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Dev can only update videoUrl, and only for assigned projects
    if (payload.role === 'dev') {
      if (!project.assignedDevs?.includes(payload.userId)) {
        return NextResponse.json({ error: 'Forbidden — not assigned to this project' }, { status: 403 });
      }
    }

    const body = await request.json();
    // Dev can only update videoUrl; admin can update all fields
    const allowedFields = payload.role === 'dev'
      ? ['videoUrl']
      : ['title', 'description', 'videoUrl', 'completed', 'adminNotes'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key];
    }

    const wasCompleted = project.roadmap.find(r => r.day === dayNum)?.completed;
    const updated = await updateRoadmapItem(projectId, dayNum, updates);
    if (!updated) return NextResponse.json({ error: 'Day not found in roadmap' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating roadmap day:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/projects/[projectId]/roadmap/[day]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; day: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { projectId, day } = await params;
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (payload.role === 'client' && project.clientId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role === 'dev' && !project.assignedDevs?.includes(payload.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dayNum = parseInt(day, 10);
    const item = project.roadmap.find(r => r.day === dayNum);
    if (!item) return NextResponse.json({ error: 'Day not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching roadmap day:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

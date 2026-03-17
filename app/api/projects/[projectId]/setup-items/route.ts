import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, getProjectSetupItems, createSetupItem, seedDefaultSetupItems } from '@/lib/db';

// GET /api/projects/[projectId]/setup-items
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

    const items = await getProjectSetupItems(projectId);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching setup items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/setup-items
// Admin: create a single item OR seed defaults (body: { defaults: true })
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { projectId } = await params;
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const body = await request.json();

    // Seed defaults mode
    if (body.defaults === true) {
      const items = await seedDefaultSetupItems(projectId, project.type);
      return NextResponse.json({ success: true, data: items }, { status: 201 });
    }

    // Single item creation
    const { title, value, itemNumber } = body;
    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Auto-assign itemNumber if not provided
    const existing = await getProjectSetupItems(projectId);
    const nextNumber = itemNumber ?? (existing.length + 1);

    const created = await createSetupItem({
      projectId,
      itemNumber: Number(nextNumber),
      title: title.trim(),
      value: value?.trim() || undefined,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating setup item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

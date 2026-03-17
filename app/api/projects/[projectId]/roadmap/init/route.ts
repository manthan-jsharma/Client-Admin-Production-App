import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, seedDefaultRoadmapItems } from '@/lib/db';

// POST /api/projects/[projectId]/roadmap/init
// Admin only — seeds 14 default roadmap items for projects that have none
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

    if (project.type !== 'ai_saas') {
      return NextResponse.json({ error: 'Roadmap is only for AI SaaS projects' }, { status: 400 });
    }

    if (project.roadmap.length > 0) {
      return NextResponse.json({ error: 'Roadmap already initialised' }, { status: 409 });
    }

    const items = await seedDefaultRoadmapItems(projectId);
    return NextResponse.json({ success: true, data: items }, { status: 201 });
  } catch (error) {
    console.error('Error initialising roadmap:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

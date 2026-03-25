import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectsByUserId, createProject, migrateInboxToProject } from '@/lib/db';
import { Project, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Project[]>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const projects = await getProjectsByUserId(payload.userId, payload.role);

    return NextResponse.json(
      {
        success: true,
        data: projects
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching projects:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Project>>> {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clientId, name, description, type, status, startDate, endDate, totalPrice, contractPDF, scopePDF } = body;

    if (!clientId || !name || !description || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientId, name, description, type' },
        { status: 400 }
      );
    }

    if (!['ai_saas', 'content_distribution'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type — must be ai_saas or content_distribution' },
        { status: 400 }
      );
    }

    // Build 14-day roadmap for ai_saas, empty for content_distribution
    const roadmap = type === 'ai_saas'
      ? Array.from({ length: 14 }, (_, i) => ({
          _id: `roadmap-new-${Date.now()}-${i}`,
          projectId: '',  // filled after project creation
          day: i + 1,
          title: `Day ${i + 1}`,
          description: `Deliverables for day ${i + 1}`,
          completed: false,
          createdAt: new Date(),
        }))
      : [];

    const project = await createProject({
      clientId,
      adminId: payload.userId,
      name,
      description,
      type,
      status: status || 'planning',
      totalPrice: totalPrice ? Number(totalPrice) : undefined,
      contractPDF,
      scopePDF,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      roadmap,
      dailyProgress: [],
      deliveries: [],
    });

    // Patch roadmap projectId after project has its _id
    if (project.roadmap.length > 0) {
      project.roadmap.forEach(r => { r.projectId = project._id!; });
    }

    // If this is the client's first project, migrate inbox messages into it
    const existingProjects = await getProjectsByUserId(clientId, 'client');
    const isFirstProject = existingProjects.filter(p => p._id !== project._id).length === 0;
    if (isFirstProject && project._id) {
      await migrateInboxToProject(clientId, project._id);
    }

    return NextResponse.json(
      {
        success: true,
        data: project
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Error creating project:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

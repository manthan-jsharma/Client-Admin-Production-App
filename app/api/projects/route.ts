import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectsByUserId, createProject } from '@/lib/db';
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
    const { clientId, name, description, status, startDate, endDate } = body;

    if (!clientId || !name || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const project = await createProject({
      clientId,
      adminId: payload.userId,
      name,
      description,
      status: status || 'planning',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      roadmap: [],
      dailyProgress: []
    });

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

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectsByUserId, getProjectSetupItems } from '@/lib/db';
import { SetupItem, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SetupItem[]>>> {
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

    // Get all projects for this user
    const projects = await getProjectsByUserId(payload.userId, payload.role);
    
    // Collect all setup items from all projects
    let allSetupItems: SetupItem[] = [];
    for (const project of projects) {
      const items = await getProjectSetupItems(project._id!);
      allSetupItems = [...allSetupItems, ...items];
    }

    return NextResponse.json(
      {
        success: true,
        data: allSetupItems
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching setup items:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getAllUsers } from '@/lib/db';
import { User, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<User[]>>> {
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

    const allUsers = await getAllUsers();
    // Filter to only show clients
    const clients = allUsers.filter(u => u.role === 'client');

    return NextResponse.json(
      {
        success: true,
        data: clients.map(c => {
          const { password, ...userWithoutPassword } = c;
          return userWithoutPassword;
        })
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching clients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

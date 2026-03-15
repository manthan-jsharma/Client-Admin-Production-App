import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectsByUserId, getProjectPayments } from '@/lib/db';
import { Payment, ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Payment[]>>> {
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
    
    // Collect all payments from all projects
    let allPayments: Payment[] = [];
    for (const project of projects) {
      const payments = await getProjectPayments(project._id!);
      allPayments = [...allPayments, ...payments];
    }

    return NextResponse.json(
      {
        success: true,
        data: allPayments
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

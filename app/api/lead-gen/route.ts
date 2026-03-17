import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getLeadGenRequestsByClientId, createLeadGenRequest, getUserById, getProjectsByUserId } from '@/lib/db';
import { tgAdminNewLeadGen } from '@/lib/telegram';
import { LeadGenRequest } from '@/lib/types';

// GET /api/lead-gen — client: get own requests
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const requests = await getLeadGenRequestsByClientId(payload.userId);
    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching lead gen requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/lead-gen — client: submit a lead gen request
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { details, budget, timeline, projectId } = body;

    if (!details?.trim()) {
      return NextResponse.json({ error: 'Details are required' }, { status: 400 });
    }

    const user = await getUserById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const projects = await getProjectsByUserId(payload.userId, 'client');
      if (projects.length === 0) {
        return NextResponse.json({ error: 'No projects found' }, { status: 400 });
      }
      resolvedProjectId = projects[0]._id!;
    }

    const leadGenRequest: LeadGenRequest = {
      projectId: resolvedProjectId,
      clientId: payload.userId,
      clientName: user.name,
      details: details.trim(),
      budget: budget?.trim() || undefined,
      timeline: timeline?.trim() || undefined,
      status: 'pending',
    };

    const created = await createLeadGenRequest(leadGenRequest);
    void tgAdminNewLeadGen({
      clientName: user.name,
      budget: created.budget,
      timeline: created.timeline,
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead gen request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

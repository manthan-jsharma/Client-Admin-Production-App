import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, getProjectDeliveries, createDelivery, getUserById } from '@/lib/db';
import { Delivery } from '@/lib/types';
import { tgDeliveryReady, tgDevDeliverySubmitted } from '@/lib/telegram';

// GET /api/projects/[projectId]/deliveries
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

    const deliveries = await getProjectDeliveries(projectId);
    return NextResponse.json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/deliveries
// Admin or assigned dev creates a delivery card
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !['admin', 'support_admin', 'dev'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden — admin, support admin or dev only' }, { status: 403 });
    }

    const { projectId } = await params;
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // Dev must be assigned to the project
    if (payload.role === 'dev' && !project.assignedDevs?.includes(payload.userId)) {
      return NextResponse.json({ error: 'Forbidden — dev not assigned to this project' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, deliveryNumber, proofVideoUrl, adminNotes } = body;

    if (!title || !description || !deliveryNumber) {
      return NextResponse.json({ error: 'title, description, deliveryNumber are required' }, { status: 400 });
    }

    // Dev submissions start as 'submitted'; support_admin goes directly to client_reviewing;
    // admin uses proofVideoUrl to determine status
    const status = payload.role === 'dev'
      ? 'submitted'
      : payload.role === 'support_admin'
      ? 'client_reviewing'
      : (proofVideoUrl ? 'client_reviewing' : 'pending');

    const delivery: Delivery = {
      projectId,
      deliveryNumber: Number(deliveryNumber),
      title,
      description,
      status,
      proofVideoUrl,
      adminNotes,
      createdByRole: (payload.role === 'dev' ? 'dev' : 'admin') as 'admin' | 'dev',
      createdById: payload.userId,
    };

    const created = await createDelivery(delivery);

    if (created.createdByRole === 'dev') {
      const devUser = await getUserById(payload.userId);
      void tgDevDeliverySubmitted({
        devName: devUser?.name ?? 'Developer',
        projectName: project.name,
        deliveryTitle: created.title,
        deliveryNumber: created.deliveryNumber,
        projectId,
      });
    } else if (created.status === 'client_reviewing') {
      const clientUser = await getUserById(project.clientId);
      if (clientUser) {
        void tgDeliveryReady({
          clientId: project.clientId,
          projectName: project.name,
          deliveryTitle: created.title,
          projectId,
        });
      }
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

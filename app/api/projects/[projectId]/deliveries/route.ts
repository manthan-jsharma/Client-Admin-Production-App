import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, getProjectDeliveries, createDelivery, getUserById } from '@/lib/db';
import { Delivery } from '@/lib/types';
import { sendDeliveryCreated } from '@/lib/email';
import { tgDeliveryReady } from '@/lib/telegram';

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
// Admin creates a delivery card
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
    const { title, description, deliveryNumber, proofS3Key, adminNotes } = body;

    if (!title || !description || !deliveryNumber) {
      return NextResponse.json({ error: 'title, description, deliveryNumber are required' }, { status: 400 });
    }

    const delivery: Delivery = {
      projectId,
      deliveryNumber: Number(deliveryNumber),
      title,
      description,
      status: proofS3Key ? 'client_reviewing' : 'pending',
      proofS3Key,
      adminNotes,
    };

    const created = await createDelivery(delivery);

    // Notify client when delivery is ready for review
    if (created.status === 'client_reviewing') {
      const clientUser = await getUserById(project.clientId);
      if (clientUser) {
        sendDeliveryCreated({
          clientEmail: clientUser.email,
          clientName: clientUser.name,
          projectName: project.name,
          deliveryNumber: created.deliveryNumber,
          deliveryTitle: created.title,
          projectId,
        });
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

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getProjectById, getDeliveryById, updateDelivery, deleteDelivery, getUserById } from '@/lib/db';
import { sendDeliveryApproved, sendDeliveryRevisionRequested, sendDeliveryCreated } from '@/lib/email';
import { tgDeliveryReady, tgDeliveryApproved } from '@/lib/telegram';

// PATCH /api/projects/[projectId]/deliveries/[deliveryId]
// Admin: update proof, adminNotes, status
// Client: add clientFeedback and sign off (status → approved | revision_requested)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; deliveryId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { projectId, deliveryId } = await params;
    const project = await getProjectById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    if (payload.role === 'client' && project.clientId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const delivery = await getDeliveryById(deliveryId);
    if (!delivery || delivery.projectId !== projectId) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (payload.role === 'admin') {
      // Admin can update: title, description, proofS3Key, adminNotes, status, deliveryNumber
      const adminFields = ['title', 'description', 'proofS3Key', 'adminNotes', 'status', 'deliveryNumber'];
      for (const key of adminFields) {
        if (key in body) updates[key] = body[key];
      }
      // Auto-set to client_reviewing when proof is added
      if (body.proofS3Key && !body.status) {
        updates.status = 'client_reviewing';
      }
    } else {
      // Client can: add feedback, sign off (approve or request revision)
      if (body.clientFeedback !== undefined) updates.clientFeedback = body.clientFeedback;
      if (body.action === 'approve') {
        updates.status = 'approved';
        updates.signedOffAt = new Date();
      } else if (body.action === 'request_revision') {
        updates.status = 'revision_requested';
      }
    }

    const updated = await updateDelivery(deliveryId, updates);

    // Email notifications based on action taken
    if (payload.role === 'client') {
      // Client signed off or requested revision → notify admin
      if (body.action === 'approve') {
        sendDeliveryApproved({
          projectName: project.name,
          deliveryNumber: delivery.deliveryNumber,
          deliveryTitle: delivery.title,
          clientName: payload.userId, // resolved below
          clientFeedback: body.clientFeedback,
        });
      } else if (body.action === 'request_revision') {
        sendDeliveryRevisionRequested({
          projectName: project.name,
          deliveryNumber: delivery.deliveryNumber,
          deliveryTitle: delivery.title,
          clientName: payload.userId,
          clientFeedback: body.clientFeedback,
        });
      }
    } else if (payload.role === 'admin') {
      // Admin sent delivery for review → notify client
      if ((body.status === 'client_reviewing' || body.proofS3Key) && project.clientId) {
        const clientUser = await getUserById(project.clientId);
        if (clientUser) {
          sendDeliveryCreated({
            clientEmail: clientUser.email,
            clientName: clientUser.name,
            projectName: project.name,
            deliveryNumber: delivery.deliveryNumber,
            deliveryTitle: delivery.title,
            projectId,
          });
          void tgDeliveryReady({
            clientId: project.clientId,
            projectName: project.name,
            deliveryTitle: delivery.title,
            projectId,
          });
        }
      }
      // Admin approved delivery on behalf → Telegram client
      if (body.action === 'approve') {
        void tgDeliveryApproved({ clientId: project.clientId, deliveryTitle: delivery.title, projectId });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/deliveries/[deliveryId] — admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; deliveryId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { deliveryId } = await params;
    const deleted = await deleteDelivery(deliveryId);
    if (!deleted) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

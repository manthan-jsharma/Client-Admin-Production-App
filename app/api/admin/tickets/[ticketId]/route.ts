import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicket, getUserById, createMessage } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { tgTicketResponse } from '@/lib/telegram';
import { ChatMessage } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticketId } = await params;
    const ticket = await getTicketById(ticketId);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ticketId } = await params;
    const ticket = await getTicketById(ticketId);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const body = await request.json();
    const { status, priority, adminResponse } = body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (adminResponse !== undefined) updates.adminResponse = adminResponse.trim();

    const prevStatus = ticket.status;
    const updated = await updateTicket(ticketId, updates);

    // Notify client if status changed or admin added a response
    const statusChanged = updates.status && updates.status !== prevStatus;
    const responseAdded = updates.adminResponse && updates.adminResponse !== ticket.adminResponse;
    if ((statusChanged || responseAdded) && ticket.clientId) {
      const clientUser = await getUserById(ticket.clientId);
      if (clientUser) {
        void tgTicketResponse({
          clientId: ticket.clientId,
          subject: ticket.subject,
          newStatus: (updates.status as string) || ticket.status,
          adminResponse: updates.adminResponse as string | undefined,
          ticketId,
        });
      }
    }

    // Mirror admin response back into the project's chat thread
    const newAdminResponse = updates.adminResponse as string | undefined;
    if (newAdminResponse && ticket.projectId) {
      const admin = await getUserById(decoded.userId);
      const chatMsg: ChatMessage = {
        projectId: ticket.projectId,
        senderId: decoded.userId,
        senderName: admin?.name || 'Admin',
        senderRole: 'admin',
        message: `**Re: ${ticket.subject}**\n\n${newAdminResponse}`,
        type: 'text',
        readBy: [decoded.userId],
        createdAt: new Date(),
      };
      void createMessage(chatMsg);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

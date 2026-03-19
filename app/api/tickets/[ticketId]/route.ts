import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getTicketById, updateTicket } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    const payload = token ? verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ticketId } = await params;
    const ticket = await getTicketById(ticketId);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    // Clients can only close their own tickets
    if (payload.role === 'client' && ticket.clientId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();
    // Clients may only set status to 'closed'
    if (payload.role === 'client' && status !== 'closed') {
      return NextResponse.json({ error: 'Clients can only close tickets' }, { status: 403 });
    }

    const updated = await updateTicket(ticketId, { status });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

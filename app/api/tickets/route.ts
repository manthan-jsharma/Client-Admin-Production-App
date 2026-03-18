import { NextRequest, NextResponse } from 'next/server';
import { getTicketsByClientId, createTicket, getUserById } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { Ticket } from '@/lib/types';
import { tgAdminNewTicket } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const tickets = await getTicketsByClientId(decoded.userId);
    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { subject, description, type, priority, projectId } = body;

    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 });

    const validTypes = ['support', 'feature_request', 'bug', 'billing', 'general'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 });
    }

    const user = await getUserById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const ticket: Ticket = {
      clientId: decoded.userId,
      clientName: user.name,
      subject: subject.trim(),
      description: description.trim(),
      type: type || 'support',
      status: 'open',
      priority: priority || 'medium',
      projectId: projectId || undefined,
    };

    const created = await createTicket(ticket);

    void tgAdminNewTicket({
      clientName: user.name,
      subject: created.subject,
      type: created.type,
      ticketId: created._id!,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

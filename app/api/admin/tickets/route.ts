import { NextRequest, NextResponse } from 'next/server';
import { getAllTickets, createTicket } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { Ticket } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || !['admin', 'support_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let tickets = await getAllTickets();

    if (status) tickets = tickets.filter(t => t.status === status);
    if (type) tickets = tickets.filter(t => t.type === type);

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
    if (!decoded || !['admin', 'support_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, clientName, subject, description, type, priority, projectId } = body;

    if (!clientId || !subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'clientId, subject, and description are required' }, { status: 400 });
    }

    const validTypes = ['support', 'feature_request', 'bug', 'billing', 'general'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 });
    }
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    const ticket: Ticket = {
      clientId,
      clientName: clientName || 'Unknown',
      subject: subject.trim(),
      description: description.trim(),
      type: type || 'general',
      status: 'open',
      priority: priority || 'medium',
      projectId: projectId || undefined,
    };

    const created = await createTicket(ticket);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

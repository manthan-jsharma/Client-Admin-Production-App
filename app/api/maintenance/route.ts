import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getUserById, createMaintenanceFeedback, getMaintenanceFeedbackByClientId } from '@/lib/db';
import { sendMaintenanceSubmitted } from '@/lib/email';
import { tgAdminNewMaintenance } from '@/lib/telegram';

// GET /api/maintenance — client: get own submissions
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await getMaintenanceFeedbackByClientId(payload.userId);
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching maintenance feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/maintenance — client: submit new feedback
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
    }
    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Message must be under 2000 characters' }, { status: 400 });
    }

    const user = await getUserById(payload.userId);

    const item = await createMaintenanceFeedback({
      clientId: payload.userId,
      clientName: user?.name || 'Client',
      message: message.trim(),
      status: 'new',
    });

    // Email + Telegram admin
    void sendMaintenanceSubmitted({
      clientName: user?.name || 'Client',
      clientEmail: user?.email || '',
      message: item.message,
      submissionId: item._id!,
    });
    void tgAdminNewMaintenance({
      clientName: user?.name || 'Client',
      messagePreview: item.message,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

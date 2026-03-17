import { NextRequest, NextResponse } from 'next/server';
import { updateSetupItem } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { itemId } = await params;

    const updates: Record<string, unknown> = {};

    if (typeof body.completed === 'boolean') {
      updates.completed = body.completed;
      updates.completedAt = body.completed ? new Date() : undefined;
    }
    if (body.title !== undefined) updates.title = body.title;
    if (body.value !== undefined) updates.value = body.value;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await updateSetupItem(itemId, updates);
    if (!updated) return NextResponse.json({ error: 'Setup item not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating setup item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

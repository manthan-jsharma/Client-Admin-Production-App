import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateClient, getUserById, deleteUser } from '@/lib/db';
import { verifyToken, extractToken, isValidUrl } from '@/lib/auth';
import { sendClientAccountDeleted } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { clientId } = await params;
    const client = await getUserById(clientId);
    if (!client || client.role !== 'client') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, phone, company, businessName, website, about, status } = body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }
    if (email !== undefined && (typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (website && !isValidUrl(website)) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }
    if (about && about.length > 500) {
      return NextResponse.json({ error: 'About must be 500 characters or fewer' }, { status: 400 });
    }
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone.trim();
    if (company !== undefined) updates.company = company.trim();
    if (businessName !== undefined) updates.businessName = businessName.trim();
    if (website !== undefined) updates.website = website.trim();
    if (about !== undefined) updates.about = about.trim();
    if (status !== undefined) updates.status = status;

    const updated = await adminUpdateClient(clientId, updates);
    if (!updated) return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });

    const { password: _, ...safeUser } = updated;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    const decoded = token ? verifyToken(token) : null;
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { clientId } = await params;
    const client = await getUserById(clientId);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    const ok = await deleteUser(clientId);
    if (!ok) return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    void sendClientAccountDeleted({ name: client.name, email: client.email });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { clientId } = await params;
    const client = await getUserById(clientId);
    if (!client || client.role !== 'client') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { password: _, ...safeUser } = client;
    return NextResponse.json({ success: true, data: safeUser });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServiceById, updateService, deleteService } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { serviceId } = await params;
    const service = await getServiceById(serviceId);
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { serviceId } = await params;
    const service = await getServiceById(serviceId);
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const body = await request.json();
    const { name, description, price, currency, category, features, isActive, imageS3Key } = body;

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) updates.price = price;
    if (currency !== undefined) updates.currency = currency;
    if (category !== undefined) updates.category = category.trim();
    if (features !== undefined) updates.features = Array.isArray(features) ? features : [];
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (imageS3Key !== undefined) updates.imageS3Key = imageS3Key;

    const updated = await updateService(serviceId, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { serviceId } = await params;
    const deleted = await deleteService(serviceId);
    if (!deleted) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAllServices, createService } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { Service } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // Clients see only active services; admin sees all
    const activeOnly = decoded.role === 'client';
    const services = await getAllServices(activeOnly);

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, currency, category, features, isActive, imageS3Key } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Service name is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative number' }, { status: 400 });
    }
    if (!category?.trim()) return NextResponse.json({ error: 'Category is required' }, { status: 400 });

    const service: Service = {
      name: name.trim(),
      description: description.trim(),
      price,
      currency: currency || 'USD',
      category: category.trim(),
      isActive: isActive !== false,
      features: Array.isArray(features) ? features.filter((f: string) => f?.trim()) : [],
      imageS3Key: imageS3Key || undefined,
    };

    const created = await createService(service);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

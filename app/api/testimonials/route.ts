import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getTestimonialsByClientId, createTestimonial, getUserById, getProjectsByUserId } from '@/lib/db';
import { tgAdminNewTestimonial } from '@/lib/telegram';
import { Testimonial } from '@/lib/types';

// GET /api/testimonials — client: get own testimonials
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const testimonials = await getTestimonialsByClientId(payload.userId);
    return NextResponse.json({ success: true, data: testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/testimonials — client: submit a testimonial
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { testimonialText, rating, projectId, videoUrl } = body;

    if (!testimonialText?.trim()) {
      return NextResponse.json({ error: 'Testimonial text is required' }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const user = await getUserById(payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Resolve projectId — default to first project if not provided
    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const projects = await getProjectsByUserId(payload.userId, 'client');
      if (projects.length === 0) {
        return NextResponse.json({ error: 'No projects found — a project is required to submit a testimonial' }, { status: 400 });
      }
      resolvedProjectId = projects[0]._id!;
    }

    const testimonial: Testimonial = {
      projectId: resolvedProjectId,
      clientId: payload.userId,
      clientName: user.name,
      testimonialText: testimonialText.trim(),
      rating: Number(rating),
      ...(videoUrl?.trim() ? { videoUrl: videoUrl.trim() } : {}),
      status: 'pending',
    };

    const created = await createTestimonial(testimonial);
    void tgAdminNewTestimonial({
      clientName: user.name,
      rating: Number(rating),
      preview: testimonialText.trim(),
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

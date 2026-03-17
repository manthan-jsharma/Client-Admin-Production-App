import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getTestimonialById, updateTestimonial } from '@/lib/db';
import { tgTestimonialReviewed } from '@/lib/telegram';

// PATCH /api/admin/testimonials/[testimonialId]
// Admin approves or rejects a testimonial
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> }
) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const { testimonialId } = await params;
    const testimonial = await getTestimonialById(testimonialId);
    if (!testimonial) return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });

    const body = await request.json();
    const { status, adminFeedback } = body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminFeedback !== undefined) updates.adminFeedback = adminFeedback?.trim() || undefined;

    const updated = await updateTestimonial(testimonialId, updates);

    // Notify client when status changes
    if (updates.status && updates.status !== testimonial.status) {
      const newStatus = updates.status as string;
      if (newStatus === 'approved' || newStatus === 'rejected') {
        void tgTestimonialReviewed({
          clientId: testimonial.clientId,
          status: newStatus,
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getReferralsByUserId, createReferral, getUserById } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { Referral } from '@/lib/types';
import { sendReferralSubmitted } from '@/lib/email';
import { tgAdminNewReferral } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const referrals = await getReferralsByUserId(decoded.userId);
    return NextResponse.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
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
    const { refereeName, refereeEmail, refereePhone, refereeCompany, notes } = body;

    if (!refereeName?.trim()) return NextResponse.json({ error: 'Referee name is required' }, { status: 400 });
    if (!refereeEmail?.trim() || !refereeEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid referee email is required' }, { status: 400 });
    }

    const user = await getUserById(decoded.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Prevent self-referral
    if (refereeEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot refer yourself' }, { status: 400 });
    }

    const referral: Referral = {
      referredByUserId: decoded.userId,
      referredByName: user.name,
      refereeName: refereeName.trim(),
      refereeEmail: refereeEmail.trim().toLowerCase(),
      refereePhone: refereePhone?.trim() || undefined,
      refereeCompany: refereeCompany?.trim() || undefined,
      notes: notes?.trim() || undefined,
      status: 'pending',
    };

    const created = await createReferral(referral);

    sendReferralSubmitted({
      referrerEmail: user.email,
      referrerName: user.name,
      refereeName: created.refereeName,
      refereeEmail: created.refereeEmail,
      refereeCompany: created.refereeCompany,
    });
    void tgAdminNewReferral({
      referrerName: user.name,
      refereeName: created.refereeName,
      refereeEmail: created.refereeEmail,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

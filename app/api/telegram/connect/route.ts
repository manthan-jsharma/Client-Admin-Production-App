/**
 * POST /api/telegram/connect
 * Generates a unique one-time token and returns the bot deep link.
 *
 * GET /api/telegram/connect
 * Returns current connection status for the logged-in user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { getUserById, updateUserProfile } from '@/lib/db';
import crypto from 'crypto';

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'YourBotUsername';

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const user = await getUserById(payload.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      connected: !!user.telegramChatId,
      chatId: user.telegramChatId || null,
    },
  });
}

export async function POST(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const user = await getUserById(payload.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Generate a secure random token (32 hex chars)
  const connectToken = crypto.randomBytes(16).toString('hex');

  await updateUserProfile(payload.userId, {
    telegramConnectToken: connectToken,
  });

  const deepLink = `https://t.me/${BOT_USERNAME}?start=${connectToken}`;

  return NextResponse.json({
    success: true,
    data: { deepLink, botUsername: BOT_USERNAME },
  });
}

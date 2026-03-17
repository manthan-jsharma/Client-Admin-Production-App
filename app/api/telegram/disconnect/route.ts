/**
 * POST /api/telegram/disconnect
 * Removes the Telegram chat ID from the logged-in user's account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { updateUserProfile, getUserById } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const user = await getUserById(payload.userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.telegramChatId) {
    // Notify user on Telegram before disconnecting
    void sendTelegramMessage(
      user.telegramChatId,
      '🔕 Your AI APP LABS account has been disconnected from Telegram. You will no longer receive notifications here.'
    );
  }

  await updateUserProfile(payload.userId, {
    telegramChatId: undefined,
    telegramConnectToken: undefined,
  });

  return NextResponse.json({ success: true });
}

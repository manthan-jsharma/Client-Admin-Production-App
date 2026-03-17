/**
 * POST /api/telegram/webhook
 *
 * Telegram calls this endpoint for every bot update.
 * We handle the /start command to link a user's Telegram account.
 *
 * Security: requests are validated against TELEGRAM_WEBHOOK_SECRET
 * (sent by Telegram in the X-Telegram-Bot-Api-Secret-Token header).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramToken, updateUserProfile } from '@/lib/db';
import { sendTelegramMessage } from '@/lib/telegram';

const APP = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true }); // Always 200 to Telegram
  }

  try {
    const message = (body.message || body.edited_message) as Record<string, unknown> | undefined;
    if (!message) return NextResponse.json({ ok: true });

    const text = message.text as string | undefined;
    const chat = message.chat as Record<string, unknown> | undefined;
    const chatId = chat?.id as number | undefined;

    if (!text || !chatId) return NextResponse.json({ ok: true });

    // Handle /start <token>
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const token = parts[1]?.trim();
      const fromName = ((message.from as Record<string, unknown>)?.first_name as string) || 'there';

      if (!token) {
        await sendTelegramMessage(
          chatId,
          `👋 Hi <b>${fromName}</b>! To connect your AI APP LABS account, use the link from your profile page.`
        );
        return NextResponse.json({ ok: true });
      }

      const user = await getUserByTelegramToken(token);

      if (!user) {
        await sendTelegramMessage(
          chatId,
          `❌ This link has expired or is invalid. Please generate a new one from your <a href="${APP}/dashboard/client/profile">profile page</a>.`
        );
        return NextResponse.json({ ok: true });
      }

      // Link the account — store chat_id and clear the token
      await updateUserProfile(user._id!, {
        telegramChatId: String(chatId),
        telegramConnectToken: undefined,
      });

      const dashboardUrl = user.role === 'admin'
        ? `${APP}/dashboard/admin`
        : `${APP}/dashboard/client`;

      await sendTelegramMessage(
        chatId,
        [
          `✅ <b>Connected!</b> Hi ${user.name}!`,
          `Your AI APP LABS account is now linked. You'll receive notifications here for all key events on the platform.`,
          `\n<a href="${dashboardUrl}">Open your dashboard →</a>`,
        ].join('\n')
      );

      return NextResponse.json({ ok: true });
    }

    // Unknown message — send a help prompt
    await sendTelegramMessage(
      chatId,
      `ℹ️ This bot sends you notifications from AI APP LABS. To connect your account, use the link from your <a href="${APP}/dashboard/client/profile">profile page</a>.`
    );
  } catch (err) {
    console.error('[telegram/webhook] error:', err);
  }

  // Always return 200 — Telegram will retry on non-2xx
  return NextResponse.json({ ok: true });
}

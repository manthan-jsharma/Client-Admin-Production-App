/**
 * POST /api/telegram/setup-webhook
 * Admin-only: registers this app's webhook URL with the Telegram Bot API.
 *
 * Call this once after deploying to production (or after changing the URL).
 * Example: POST /api/telegram/setup-webhook
 *          Authorization: Bearer <admin_token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = extractToken(request.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  if (!appUrl || appUrl.includes('localhost')) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL must be a public HTTPS URL (not localhost). Use ngrok for local testing.' },
      { status: 400 }
    );
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  const body: Record<string, unknown> = { url: webhookUrl };
  if (secretToken) body.secret_token = secretToken;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await res.json() as { ok: boolean; description?: string };

  if (!result.ok) {
    return NextResponse.json({ error: result.description || 'Telegram API error' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    webhookUrl,
    message: 'Webhook registered successfully. Telegram will now POST updates to this URL.',
  });
}

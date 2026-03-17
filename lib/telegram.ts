/**
 * Telegram Notification Service
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN    — from @BotFather
 *   TELEGRAM_BOT_USERNAME — e.g. "BuildHubBot" (no @)
 *   NEXT_PUBLIC_APP_URL   — base URL for deep links in messages
 *
 * Messages use HTML parse mode. All sends are non-fatal.
 */

import { getAllUsers, getUserById } from '@/lib/db';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// ─── Core send ────────────────────────────────────────────────────────────────

export async function sendTelegramMessage(
  chatId: string | number,
  text: string
): Promise<void> {
  if (!BOT_TOKEN) {
    console.log(`[telegram] TELEGRAM_BOT_TOKEN not set — skipped to chat ${chatId}`);
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[telegram] sendMessage failed:', err);
    }
  } catch (err) {
    console.error('[telegram] sendMessage error:', err);
  }
}

/** Send to a user by their platform userId (no-op if no Telegram linked). */
async function notifyUser(userId: string, text: string): Promise<void> {
  const user = await getUserById(userId);
  if (user?.telegramChatId) {
    await sendTelegramMessage(user.telegramChatId, text);
  }
}

/** Send to every admin that has Telegram connected. */
async function notifyAllAdmins(text: string): Promise<void> {
  const users = await getAllUsers();
  const admins = users.filter(u => u.role === 'admin' && u.telegramChatId);
  await Promise.all(admins.map(a => sendTelegramMessage(a.telegramChatId!, text)));
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function link(label: string, url: string) {
  return `<a href="${url}">${label}</a>`;
}

function bold(text: string) {
  return `<b>${text}</b>`;
}

// ─── Client notifications ─────────────────────────────────────────────────────

export async function tgTicketResponse(params: {
  clientId: string;
  subject: string;
  newStatus: string;
  adminResponse?: string;
  ticketId: string;
}) {
  const lines = [
    `🎫 ${bold('Ticket Update')}`,
    `Subject: ${params.subject}`,
    `Status: ${bold(params.newStatus.replace('_', ' '))}`,
  ];
  if (params.adminResponse) lines.push(`\n💬 ${params.adminResponse}`);
  lines.push(`\n${link('View ticket →', `${APP}/dashboard/client/tickets`)}`);
  await notifyUser(params.clientId, lines.join('\n'));
}

export async function tgDeliveryReady(params: {
  clientId: string;
  projectName: string;
  deliveryTitle: string;
  projectId: string;
}) {
  const text = [
    `📦 ${bold('Delivery ready for review')}`,
    `Project: ${params.projectName}`,
    `Delivery: ${bold(params.deliveryTitle)}`,
    `\n${link('Review & sign off →', `${APP}/dashboard/client/${params.projectId}`)}`,
  ].join('\n');
  await notifyUser(params.clientId, text);
}

export async function tgDeliveryApproved(params: {
  clientId: string;
  deliveryTitle: string;
  projectId: string;
}) {
  const text = [
    `✅ ${bold('Delivery approved')}`,
    `${params.deliveryTitle} has been signed off.`,
    `${link('View project →', `${APP}/dashboard/client/${params.projectId}`)}`,
  ].join('\n');
  await notifyUser(params.clientId, text);
}

export async function tgMaintenanceResponse(params: {
  clientId: string;
  adminResponse: string;
}) {
  const text = [
    `🔧 ${bold('Maintenance update')}`,
    params.adminResponse,
    `${link('View in dashboard →', `${APP}/dashboard/client/maintenance`)}`,
  ].join('\n\n');
  await notifyUser(params.clientId, text);
}

export async function tgPaymentUpdated(params: {
  clientId: string;
  amount: number;
  status: string;
  description?: string;
}) {
  const text = [
    `💳 ${bold('Payment record updated')}`,
    `Amount: $${params.amount}`,
    `Status: ${bold(params.status)}`,
    params.description ? `Description: ${params.description}` : '',
    `${link('View payments →', `${APP}/dashboard/client/payments`)}`,
  ].filter(Boolean).join('\n');
  await notifyUser(params.clientId, text);
}

export async function tgTestimonialReviewed(params: {
  clientId: string;
  status: 'approved' | 'rejected';
  adminFeedback?: string;
}) {
  const icon = params.status === 'approved' ? '⭐' : '📝';
  const lines = [
    `${icon} ${bold('Testimonial ' + (params.status === 'approved' ? 'published!' : 'not published'))}`,
  ];
  if (params.adminFeedback) lines.push(params.adminFeedback);
  lines.push(link('View →', `${APP}/dashboard/client/testimonials`));
  await notifyUser(params.clientId, lines.join('\n'));
}

export async function tgLeadGenReviewed(params: {
  clientId: string;
  status: 'approved' | 'rejected';
  adminFeedback?: string;
}) {
  const icon = params.status === 'approved' ? '🎯' : '📋';
  const lines = [
    `${icon} ${bold('Lead generation request ' + params.status)}`,
  ];
  if (params.adminFeedback) lines.push(params.adminFeedback);
  lines.push(link('View →', `${APP}/dashboard/client/lead-gen`));
  await notifyUser(params.clientId, lines.join('\n'));
}

// ─── Admin notifications ──────────────────────────────────────────────────────

export async function tgAdminNewClient(params: {
  clientName: string;
  clientEmail: string;
}) {
  const text = [
    `👤 ${bold('New client registered')}`,
    `Name: ${params.clientName}`,
    `Email: ${params.clientEmail}`,
    link('Review & approve →', `${APP}/dashboard/admin/approvals`),
  ].join('\n');
  await notifyAllAdmins(text);
}

export async function tgAdminNewTicket(params: {
  clientName: string;
  subject: string;
  type: string;
  ticketId: string;
}) {
  const text = [
    `🎫 ${bold('New support ticket')}`,
    `From: ${params.clientName}`,
    `Subject: ${bold(params.subject)}`,
    `Type: ${params.type.replace('_', ' ')}`,
    link('Open ticket →', `${APP}/dashboard/admin/requests`),
  ].join('\n');
  await notifyAllAdmins(text);
}

export async function tgAdminNewMaintenance(params: {
  clientName: string;
  messagePreview: string;
}) {
  const preview = params.messagePreview.slice(0, 120) + (params.messagePreview.length > 120 ? '…' : '');
  const text = [
    `🔧 ${bold('New maintenance feedback')}`,
    `From: ${params.clientName}`,
    `"${preview}"`,
    link('Respond →', `${APP}/dashboard/admin/maintenance`),
  ].join('\n');
  await notifyAllAdmins(text);
}

export async function tgAdminNewReferral(params: {
  referrerName: string;
  refereeName: string;
  refereeEmail: string;
}) {
  const text = [
    `🔗 ${bold('New referral submitted')}`,
    `From: ${params.referrerName}`,
    `Referral: ${params.refereeName} (${params.refereeEmail})`,
    link('Review →', `${APP}/dashboard/admin/referrals`),
  ].join('\n');
  await notifyAllAdmins(text);
}

export async function tgAdminNewTestimonial(params: {
  clientName: string;
  rating: number;
  preview: string;
}) {
  const stars = '⭐'.repeat(params.rating);
  const text = [
    `${stars} ${bold('New testimonial')}`,
    `From: ${params.clientName}`,
    `"${params.preview.slice(0, 100)}…"`,
    link('Review →', `${APP}/dashboard/admin/testimonials`),
  ].join('\n');
  await notifyAllAdmins(text);
}

export async function tgAdminNewLeadGen(params: {
  clientName: string;
  budget?: string;
  timeline?: string;
}) {
  const lines = [
    `🎯 ${bold('New lead generation request')}`,
    `From: ${params.clientName}`,
  ];
  if (params.budget) lines.push(`Budget: ${params.budget}`);
  if (params.timeline) lines.push(`Timeline: ${params.timeline}`);
  lines.push(link('Review →', `${APP}/dashboard/admin/lead-gen`));
  await notifyAllAdmins(lines.join('\n'));
}

export async function tgAdminNewServiceInquiry(params: {
  clientName: string;
  serviceName: string;
}) {
  const text = [
    `📣 ${bold('New service inquiry')}`,
    `From: ${params.clientName}`,
    `Service: ${params.serviceName}`,
    link('Open chat →', `${APP}/dashboard/admin/chats`),
  ].join('\n');
  await notifyAllAdmins(text);
}

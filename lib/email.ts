/**
 * Email Notification Service — powered by Resend
 *
 * All sends are non-fatal: if RESEND_API_KEY is missing or a send fails,
 * we log to console and continue. This keeps API routes unaffected by
 * email failures.
 *
 * Required env vars:
 *   RESEND_API_KEY        — your Resend secret key
 *   RESEND_FROM_EMAIL     — verified sender address, e.g. "AI APP LABS <noreply@yourdomain.com>"
 *   ADMIN_EMAIL           — admin's email address for inbound notifications
 *   NEXT_PUBLIC_APP_URL   — base URL of the app, e.g. https://app.yourdomain.com
 */

import { Resend } from "resend";

// const resend = new Resend(process.env.RESEND_API_KEY);

const FROM =
  process.env.RESEND_FROM_EMAIL || "AI APP LABS <noreply@buildhub.app>";
const ADMIN = process.env.ADMIN_EMAIL || "admin@example.com";
const APP = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/$/, "");

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function send(to: string | string[], subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `[email] RESEND_API_KEY not set — skipped: "${subject}" → ${to}`
    );
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    // Non-fatal — log and continue
    console.error("[email] Send failed:", subject, err);
  }
}

/** Base HTML wrapper used by every template */
function wrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 16px;">

  <!-- Header -->
  <div style="background:#0f172a;border-radius:12px 12px 0 0;padding:22px 32px;display:flex;align-items:center;gap:12px;">
    <div style="width:34px;height:34px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
      <span style="color:#fff;font-weight:800;font-size:16px;line-height:1;">B</span>
    </div>
    <img src="https://clientportal.cgramm.org/icon.svg" alt="AI APP LABS" width="34" height="34" 
    style="width:34px;height:34px;border-radius:8px;display:block;flex-shrink:0;" />
  </div>

  <!-- Body -->
  <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;padding:36px 32px;">
    ${body}
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:18px 32px;text-align:center;">
    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
      © ${new Date().getFullYear()} AI APP LABS &nbsp;·&nbsp; You're receiving this because of account activity.<br/>
      Questions? Reply to this email or contact your admin.
    </p>
  </div>

</div>
</body>
</html>`;
}

/** Reusable CTA button */
function btn(href: string, label: string, color = "#2563eb"): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${color};color:#fff;font-size:14px;font-weight:600;border-radius:8px;text-decoration:none;">${label}</a>`;
}

/** Highlight box (blue info / green success / red warning) */
function infoBox(
  content: string,
  bg = "#eff6ff",
  border = "#bfdbfe",
  text = "#1e40af"
): string {
  return `<div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:14px 18px;margin:20px 0;">
    <p style="color:${text};font-size:14px;margin:0;line-height:1.6;">${content}</p>
  </div>`;
}

/** Two-column key–value detail row */
function detail(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;color:#64748b;font-size:13px;width:40%;vertical-align:top;">${label}</td>
    <td style="padding:7px 0;color:#0f172a;font-size:13px;font-weight:500;">${value}</td>
  </tr>`;
}

function detailTable(rows: string): string {
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;">${rows}</table>`;
}

function heading(text: string): string {
  return `<h1 style="color:#0f172a;font-size:22px;font-weight:700;margin:0 0 8px;line-height:1.3;">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>`;
}

// ─── 1. Client Signup Confirmation ─────────────────────────────────────────────

export async function sendSignupConfirmation(client: {
  name: string;
  email: string;
  businessName?: string;
}) {
  const html = wrap(
    "Welcome to AI APP LABS",
    `
    ${heading(`Welcome, ${client.name}!`)}
    ${para(
      "Your account has been created and is now <strong>pending admin review</strong>. We'll send you an email as soon as your account is approved — usually within 1 business day."
    )}
    ${infoBox(
      `<strong>Account Status:</strong> Pending Approval<br/><strong>Email:</strong> ${
        client.email
      }${
        client.businessName
          ? `<br/><strong>Business:</strong> ${client.businessName}`
          : ""
      }`
    )}
    ${para(
      "While you wait, you can log in to your pending account and review the platform."
    )}
    ${btn(`${APP}/login`, "Log In")}
  `
  );

  await send(
    client.email,
    "Welcome to AI APP LABS — Account Pending Approval",
    html
  );

  // Notify admin of new signup
  const adminHtml = wrap(
    "New Client Signup",
    `
    ${heading("New Client Signup")}
    ${para("A new client has registered and is waiting for your approval.")}
    ${detailTable(
      detail("Name", client.name) +
        detail("Email", client.email) +
        (client.businessName ? detail("Business", client.businessName) : "")
    )}
    ${btn(`${APP}/dashboard/admin/approvals`, "Review Signup", "#0f172a")}
  `
  );
  await send(ADMIN, `New client signup: ${client.name}`, adminHtml);
}

// ─── 2a. Admin-Created Account Welcome ───────────────────────────────────────

export async function sendAdminCreatedAccount(client: {
  name: string;
  email: string;
  password: string;
}) {
  const html = wrap(
    "Your AI APP LABS Account",
    `
    ${heading("Welcome to AI APP LABS!")}
    ${para(
      `Hi ${client.name}, an account has been created for you on AI APP LABS. You can log in immediately using the credentials below.`
    )}
    ${detailTable(
      detail("Login Email", client.email) + detail("Password", client.password)
    )}
    ${btn(`${APP}/login`, "Log In Now")}
    ${para("We recommend changing your password after your first login.")}
  `
  );
  await send(client.email, "Your AI APP LABS account is ready", html);
}

// ─── 2. Account Approved ──────────────────────────────────────────────────────

export async function sendAccountApproved(client: {
  name: string;
  email: string;
}) {
  const html = wrap(
    "Your Account is Approved",
    `
    ${heading("You're approved! 🎉")}
    ${para(
      `Hi ${client.name}, great news — your AI APP LABS account has been <strong>approved</strong> by the admin. You now have full access to the client portal.`
    )}
    ${infoBox(
      "<strong>Account Status:</strong> Approved &nbsp;✓",
      "#f0fdf4",
      "#bbf7d0",
      "#166534"
    )}
    ${para("Use the credentials below to log in:")}
    ${detailTable(
      detail("Login Email", client.email) +
        detail("Password", "The password you set during sign-up")
    )}
    ${btn(`${APP}/login`, "Log In Now")}
  `
  );
  await send(client.email, "Your AI APP LABS account has been approved", html);
}

// ─── 3. Account Rejected ──────────────────────────────────────────────────────

export async function sendAccountRejected(
  client: { name: string; email: string },
  feedback: string
) {
  const html = wrap(
    "Account Application Update",
    `
    ${heading("Application Update")}
    ${para(
      `Hi ${client.name}, thank you for your interest in AI APP LABS. After reviewing your application, we're unable to approve your account at this time.`
    )}
    ${infoBox(
      `<strong>Reason:</strong><br/>${feedback}`,
      "#fff7ed",
      "#fed7aa",
      "#9a3412"
    )}
    ${para(
      "If you believe this decision was made in error or have questions, please reply to this email or reach out to us directly."
    )}
  `
  );
  await send(
    client.email,
    "Update on your AI APP LABS account application",
    html
  );
}

// ─── 11. Payment Updated ─────────────────────────────────────────────────────

export async function sendPaymentUpdated(params: {
  clientEmail: string;
  clientName: string;
  amount: number;
  currency: string;
  newStatus: string;
  notes?: string;
  dueDate?: Date;
}) {
  const statusMeta: Record<
    string,
    { label: string; bg: string; border: string; color: string }
  > = {
    pending: {
      label: "Pending",
      bg: "#fffbeb",
      border: "#fde68a",
      color: "#92400e",
    },
    paid: {
      label: "Paid ✓",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      color: "#166534",
    },
    overdue: {
      label: "Overdue",
      bg: "#fff1f2",
      border: "#fecdd3",
      color: "#9f1239",
    },
  };
  const meta = statusMeta[params.newStatus] ?? statusMeta.pending;

  const html = wrap(
    "Payment Update",
    `
    ${heading("Payment record updated")}
    ${para(`Hi ${params.clientName}, your payment record has been updated.`)}
    ${detailTable(
      detail(
        "Amount",
        `${params.currency} $${params.amount.toLocaleString()}`
      ) +
        (params.dueDate
          ? detail(
              "Due Date",
              new Date(params.dueDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            )
          : "")
    )}
    ${infoBox(
      `<strong>Status: ${meta.label}</strong>${
        params.notes ? `<br/>${params.notes}` : ""
      }`,
      meta.bg,
      meta.border,
      meta.color
    )}
    ${btn(`${APP}/dashboard/client/payments`, "View Payments")}
  `
  );
  await send(
    params.clientEmail,
    `Payment ${meta.label.toLowerCase()} — ${
      params.currency
    } $${params.amount.toLocaleString()}`,
    html
  );
}

// ─── 12. Service Inquiry Received ────────────────────────────────────────────

export async function sendServiceInquiryReceived(params: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  messagePreview: string;
  projectId?: string;
}) {
  const html = wrap(
    "New Service Inquiry",
    `
    ${heading("New service inquiry")}
    ${para(
      `<strong>${params.clientName}</strong> has sent an inquiry about a service.`
    )}
    ${detailTable(
      detail("Client", `${params.clientName} (${params.clientEmail})`) +
        detail("Service", params.serviceName)
    )}
    <div style="background:#f8fafc;border-left:4px solid #8b5cf6;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
      <p style="color:#334155;font-size:14px;margin:0;line-height:1.6;font-style:italic;">"${
        params.messagePreview.length > 300
          ? params.messagePreview.slice(0, 300) + "…"
          : params.messagePreview
      }"</p>
    </div>
    ${btn(
      `${APP}/dashboard/admin/chats${
        params.projectId ? `?projectId=${params.projectId}` : ""
      }`,
      "Open Chat to Respond",
      "#0f172a"
    )}
  `
  );
  await send(
    ADMIN,
    `Service inquiry: ${params.serviceName} from ${params.clientName}`,
    html
  );
}

// ─── 13. Referral Submitted ───────────────────────────────────────────────────

export async function sendReferralSubmitted(params: {
  referrerEmail: string;
  referrerName: string;
  refereeName: string;
  refereeEmail: string;
  refereeCompany?: string;
}) {
  // Confirm to referrer
  const referrerHtml = wrap(
    "Referral Submitted",
    `
    ${heading("Referral received — thank you!")}
    ${para(
      `Hi ${params.referrerName}, your referral has been submitted and our team will reach out to ${params.refereeName} within 48 hours.`
    )}
    ${detailTable(
      detail("Referred", params.refereeName) +
        detail("Email", params.refereeEmail) +
        (params.refereeCompany ? detail("Company", params.refereeCompany) : "")
    )}
    ${infoBox(
      "<strong>Reward reminder:</strong> You'll receive a <strong>free AI software asset</strong> when your referral converts to a client.",
      "#faf5ff",
      "#e9d5ff",
      "#6b21a8"
    )}
    ${btn(`${APP}/dashboard/client/referrals`, "View My Referrals")}
  `
  );
  await send(
    params.referrerEmail,
    `Referral submitted for ${params.refereeName}`,
    referrerHtml
  );

  // Notify admin
  const adminHtml = wrap(
    "New Referral Submission",
    `
    ${heading("New referral submitted")}
    ${para(
      `<strong>${params.referrerName}</strong> has submitted a new referral.`
    )}
    ${detailTable(
      detail(
        "Referred by",
        `${params.referrerName} (${params.referrerEmail})`
      ) +
        detail("Referee name", params.refereeName) +
        detail("Referee email", params.refereeEmail) +
        (params.refereeCompany ? detail("Company", params.refereeCompany) : "")
    )}
    ${btn(`${APP}/dashboard/admin/referrals`, "Review Referrals", "#0f172a")}
  `
  );
  await send(
    ADMIN,
    `New referral: ${params.refereeName} from ${params.referrerName}`,
    adminHtml
  );
}

// ─── 14. Maintenance: new submission (admin notification) ─────────────────────

export async function sendMaintenanceSubmitted(params: {
  clientName: string;
  clientEmail: string;
  message: string;
  submissionId: string;
}) {
  const html = wrap(
    "New maintenance feedback",
    `
    ${heading("New maintenance feedback received")}
    ${para(
      `<strong>${params.clientName}</strong> has submitted a new maintenance feedback.`
    )}
    ${infoBox(
      `<em style="color:#374151;">"${params.message.slice(0, 300)}${
        params.message.length > 300 ? "…" : ""
      }"</em>`,
      "#f0fdf4",
      "#166534"
    )}
    ${btn(`${APP}/dashboard/admin/maintenance`, "View & Respond", "#0f172a")}
    `
  );
  await send(ADMIN, `New maintenance feedback from ${params.clientName}`, html);
}

// ─── 15. Maintenance: admin responded (client notification) ──────────────────

export async function sendMaintenanceResponse(params: {
  clientEmail: string;
  clientName: string;
  originalMessage: string;
  adminResponse: string;
  status: string;
}) {
  const html = wrap(
    "Response to your maintenance feedback",
    `
    ${heading("We've responded to your feedback")}
    ${para(
      `Hi ${params.clientName}, our team has replied to your maintenance submission.`
    )}
    ${detailTable(
      detail(
        "Your message",
        params.originalMessage.slice(0, 200) +
          (params.originalMessage.length > 200 ? "…" : "")
      ) +
        detail(
          "Status",
          params.status.charAt(0).toUpperCase() + params.status.slice(1)
        )
    )}
    ${infoBox(
      `<strong>Team response:</strong><br/>${params.adminResponse}`,
      "#eff6ff",
      "#1e40af"
    )}
    ${btn(`${APP}/dashboard/client/maintenance`, "View in Dashboard")}
    `
  );
  await send(params.clientEmail, "Response to your maintenance feedback", html);
}

// ─── 16. Dev Account Created ──────────────────────────────────────────────────

export async function sendDevAccountCreated(dev: {
  name: string;
  email: string;
  password: string;
}) {
  const html = wrap(
    "Your Developer Account is Ready",
    `
    ${heading(`Welcome to the team, ${dev.name}!`)}
    ${para(
      "Your developer account on <strong>AI APP LABS</strong> has been created by the admin. You can log in immediately using the credentials below."
    )}
    ${detailTable(
      detail("Email", dev.email) +
        detail(
          "Password",
          `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px;">${dev.password}</code>`
        )
    )}
    ${infoBox(
      "For security, please change your password after your first login.",
      "#fffbeb",
      "#fde68a",
      "#92400e"
    )}
    ${btn(`${APP}/login`, "Log In to Developer Portal")}
  `
  );
  await send(dev.email, "Your AI APP LABS developer account is ready", html);
}

// ─── 17. Support Admin Account Created ───────────────────────────────────────

export async function sendSupportAdminCreated(u: {
  name: string;
  email: string;
  password: string;
}) {
  const html = wrap(
    "Your Support Admin Account is Ready",
    `
    ${heading(`Welcome, ${u.name}!`)}
    ${para(
      "You've been added as a <strong>Support Admin</strong> on AI APP LABS. You can log in immediately using the credentials below."
    )}
    ${detailTable(
      detail("Email", u.email) +
        detail(
          "Password",
          `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px;">${u.password}</code>`
        )
    )}
    ${infoBox(
      "You can handle tickets, projects, deliveries and chats. Please change your password after first login.",
      "#f0fdf4",
      "#a7f3d0",
      "#065f46"
    )}
    ${btn(`${APP}/login`, "Log In Now")}
  `
  );
  await send(u.email, "Your AI APP LABS support admin account is ready", html);
}

// ─── 18. Dev Account Updated ──────────────────────────────────────────────────

export async function sendDevAccountUpdated(dev: {
  name: string;
  email: string;
  newPassword?: string;
}) {
  const html = wrap(
    "Your Developer Account Has Been Updated",
    `
    ${heading(`Hi ${dev.name},`)}
    ${para(
      "Your developer account on <strong>AI APP LABS</strong> has been updated by the admin. Your current login details are below."
    )}
    ${detailTable(
      detail("Email", dev.email) +
        (dev.newPassword
          ? detail(
              "New Password",
              `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px;">${dev.newPassword}</code>`
            )
          : "")
    )}
    ${btn(`${APP}/login`, "Log In to Developer Portal")}
  `
  );
  await send(
    dev.email,
    "Your AI APP LABS developer account has been updated",
    html
  );
}

// ─── 19. Support Admin Account Updated ───────────────────────────────────────

export async function sendSupportAdminUpdated(u: {
  name: string;
  email: string;
  newPassword?: string;
}) {
  const html = wrap(
    "Your Support Admin Account Has Been Updated",
    `
    ${heading(`Hi ${u.name},`)}
    ${para(
      "Your support admin account on <strong>AI APP LABS</strong> has been updated by the admin. Your current login details are below."
    )}
    ${detailTable(
      detail("Email", u.email) +
        (u.newPassword
          ? detail(
              "New Password",
              `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:13px;">${u.newPassword}</code>`
            )
          : "")
    )}
    ${btn(`${APP}/login`, "Log In Now")}
  `
  );
  await send(
    u.email,
    "Your AI APP LABS support admin account has been updated",
    html
  );
}

// ─── Client Account Deleted ───────────────────────────────────────────────────

export async function sendClientAccountDeleted(client: { name: string; email: string }) {
  const html = wrap(
    "Account Removed",
    `
    ${heading("Your Account Has Been Removed")}
    ${para(`Hi ${client.name}, we're writing to let you know that your AI APP LABS account has been permanently deleted by an administrator.`)}
    ${infoBox("All your data, projects, and associated records have been removed from our platform.", "#fff7ed", "#fed7aa", "#9a3412")}
    ${para("If you believe this was a mistake or have questions, please reply to this email and we'll look into it.")}
  `
  );
  await send(client.email, "Your AI APP LABS account has been removed", html);
}

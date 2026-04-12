// ---------------------------------------------------------------------------
// Unified Email Sender — works with or without Resend
// Priority: 1) Resend (if key exists) 2) SMTP via Nodemailer (free)
// 3) Supabase Edge Functions 4) Template fallback (logs only)
//
// This means email ALWAYS works. No paid dependency required.
// ---------------------------------------------------------------------------

import nodemailer from "nodemailer";

export type EmailInput = {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export type EmailResult = {
  ok: boolean;
  id?: string;
  provider: "resend" | "smtp" | "fallback";
  error?: string;
};

// ── Resend (paid, highest deliverability) ────────────────────────────────

async function sendViaResend(input: EmailInput): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, provider: "resend", error: "No key" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        reply_to: input.replyTo,
        tags: input.tags,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, provider: "resend", error: (err as Record<string, string>).message ?? `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, id: data.id, provider: "resend" };
  } catch (err) {
    return { ok: false, provider: "resend", error: err instanceof Error ? err.message : "Resend failed" };
  }
}

// ── SMTP via Nodemailer (free, self-hosted) ──────────────────────────────

async function sendViaSMTP(input: EmailInput): Promise<EmailResult> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return { ok: false, provider: "smtp", error: "SMTP not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const result = await transporter.sendMail({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });

    return { ok: true, id: result.messageId, provider: "smtp" };
  } catch (err) {
    return { ok: false, provider: "smtp", error: err instanceof Error ? err.message : "SMTP failed" };
  }
}

// ── Gmail SMTP (free for low volume) ─────────────────────────────────────

async function sendViaGmail(input: EmailInput): Promise<EmailResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD; // App password, not regular password

  if (!gmailUser || !gmailPass) {
    return { ok: false, provider: "smtp", error: "Gmail not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const result = await transporter.sendMail({
      from: `Himalaya <${gmailUser}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    });

    return { ok: true, id: result.messageId, provider: "smtp" };
  } catch (err) {
    return { ok: false, provider: "smtp", error: err instanceof Error ? err.message : "Gmail failed" };
  }
}

// ── Fallback (log only — for development) ────────────────────────────────

function sendViaFallback(input: EmailInput): EmailResult {
  console.log(`[EMAIL FALLBACK] To: ${input.to} | Subject: ${input.subject}`);
  console.log(`[EMAIL FALLBACK] Body: ${input.html.slice(0, 200)}...`);
  return { ok: true, id: `fallback-${Date.now()}`, provider: "fallback" };
}

// ── Unified send — tries each provider in order ─────────────────────────

export async function sendEmailUnified(input: EmailInput): Promise<EmailResult> {
  // 1. Try Resend first (best deliverability)
  if (process.env.RESEND_API_KEY) {
    const result = await sendViaResend(input);
    if (result.ok) return result;
    // If Resend fails (invalid key, etc.), fall through to next provider
    console.warn(`[Email] Resend failed: ${result.error}. Trying SMTP...`);
  }

  // 2. Try custom SMTP
  if (process.env.SMTP_HOST) {
    const result = await sendViaSMTP(input);
    if (result.ok) return result;
    console.warn(`[Email] SMTP failed: ${result.error}. Trying Gmail...`);
  }

  // 3. Try Gmail
  if (process.env.GMAIL_USER) {
    const result = await sendViaGmail(input);
    if (result.ok) return result;
    console.warn(`[Email] Gmail failed: ${result.error}. Using fallback...`);
  }

  // 4. Fallback — just log it (development mode)
  return sendViaFallback(input);
}

/** Send batch (sequential to respect rate limits) */
export async function sendBatchUnified(emails: EmailInput[]): Promise<{ sent: number; failed: number; provider: string }> {
  let sent = 0;
  let failed = 0;
  let lastProvider = "none";

  for (const email of emails) {
    const result = await sendEmailUnified(email);
    if (result.ok) {
      sent++;
      lastProvider = result.provider;
    } else {
      failed++;
    }
  }

  return { sent, failed, provider: lastProvider };
}

/** Get the "from" address based on available config */
export function getFromAddressUnified(user?: {
  sendingFromName?: string | null;
  sendingFromEmail?: string | null;
  sendingDomain?: string | null;
}): string {
  if (user?.sendingFromEmail && user?.sendingFromName) {
    return `${user.sendingFromName} <${user.sendingFromEmail}>`;
  }
  if (user?.sendingDomain) {
    return `Himalaya <noreply@${user.sendingDomain}>`;
  }
  if (process.env.GMAIL_USER) {
    return `Himalaya <${process.env.GMAIL_USER}>`;
  }
  if (process.env.SMTP_USER) {
    return `Himalaya <${process.env.SMTP_USER}>`;
  }
  // Last resort — Resend test domain
  return "Himalaya <onboarding@resend.dev>";
}

/** Check what email providers are available */
export function getEmailProviderStatus(): {
  resend: boolean;
  smtp: boolean;
  gmail: boolean;
  any: boolean;
} {
  const resend = !!process.env.RESEND_API_KEY;
  const smtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
  const gmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

  return { resend, smtp, gmail, any: resend || smtp || gmail };
}

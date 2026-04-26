// ---------------------------------------------------------------------------
// Resend Email Service — sends transactional emails via Resend API
// Handles email delivery, tracking, and error handling
// ---------------------------------------------------------------------------

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailPayload = {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Record<string, string>;
};

export type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Send a single email via Resend
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  try {
    const fromEmail = payload.from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
      tags: payload.tags,
    });

    if (result.error) {
      console.error("[Resend] Email send error:", result.error);
      return {
        success: false,
        error: result.error.message || "Unknown error",
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (err) {
    console.error("[Resend] Email send exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send batch of emails via Resend
 */
export async function sendBatchEmails(payloads: EmailPayload[]): Promise<EmailResult[]> {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const emails = payloads.map((p) => ({
      from: p.from || fromEmail,
      to: Array.isArray(p.to) ? p.to : [p.to],
      subject: p.subject,
      html: p.html,
      text: p.text,
      replyTo: p.replyTo,
      tags: p.tags,
    }));

    const result = await resend.batch.send(emails);

    if (result.error) {
      console.error("[Resend] Batch send error:", result.error);
      return payloads.map(() => ({
        success: false,
        error: result.error?.message || "Unknown error",
      }));
    }

    return (result.data?.data || []).map((d) => ({
      success: true,
      messageId: d.id,
    }));
  } catch (err) {
    console.error("[Resend] Batch send exception:", err);
    return payloads.map(() => ({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }));
  }
}

/**
 * Verify domain configuration with Resend
 */
export async function verifyDomain(domain: string): Promise<{ verified: boolean; error?: string }> {
  try {
    const result = await resend.domains.get(domain);

    if (result.error) {
      return { verified: false, error: result.error.message };
    }

    return {
      verified: result.data?.status === "verified",
    };
  } catch (err) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

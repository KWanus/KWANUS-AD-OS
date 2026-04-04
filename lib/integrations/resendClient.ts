// ---------------------------------------------------------------------------
// Resend Email Client — real email sending infrastructure
// ---------------------------------------------------------------------------

import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _resend = new Resend(key);
  }
  return _resend;
}

export type SendEmailInput = {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  scheduledAt?: string; // ISO 8601 or natural language
  tags?: { name: string; value: string }[];
};

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

/** Send a single email via Resend */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
      scheduledAt: input.scheduledAt,
      tags: input.tags,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

/** Send a batch of emails (up to 100) via Resend */
export async function sendBatch(
  emails: SendEmailInput[]
): Promise<{ ok: boolean; results?: { id: string }[]; error?: string }> {
  try {
    const resend = getResend();
    const { data, error } = await resend.batch.send(
      emails.map((e) => ({
        from: e.from,
        to: [e.to],
        subject: e.subject,
        html: e.html,
        replyTo: e.replyTo,
        tags: e.tags,
      }))
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true, results: data?.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Batch send failed" };
  }
}

/** Create or get a contact in Resend (for audience management) */
export async function upsertContact(input: {
  audienceId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const resend = getResend();
    const { data, error } = await resend.contacts.create({
      audienceId: input.audienceId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      unsubscribed: input.unsubscribed ?? false,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Contact creation failed" };
  }
}

/** Default "from" address — uses user's domain if configured, else Himalaya default */
export function getFromAddress(user?: {
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
  // Fallback to Resend test domain
  return "Himalaya <onboarding@resend.dev>";
}

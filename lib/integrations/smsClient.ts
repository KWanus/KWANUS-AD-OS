// ---------------------------------------------------------------------------
// SMS Client — Twilio integration for sending SMS in flow sequences
// Falls back gracefully when Twilio is not configured
// ---------------------------------------------------------------------------

export type SendSMSInput = {
  to: string;       // E.164 format: +15551234567
  body: string;
  from?: string;    // Override default number
};

export type SMSResult = {
  ok: boolean;
  sid?: string;
  error?: string;
};

/** Send SMS via Twilio */
export async function sendSMS(input: SendSMSInput): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = input.from ?? process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "Twilio not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.to,
        From: fromNumber,
        Body: input.body,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as Record<string, string>).message ?? `Twilio error: ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, sid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SMS send failed" };
  }
}

/** Send batch SMS (sequential — Twilio rate limits) */
export async function sendSMSBatch(messages: SendSMSInput[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    const result = await sendSMS(msg);
    if (result.ok) sent++;
    else failed++;
    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  return { sent, failed };
}

/** Check if SMS is configured */
export function hasSMSConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

/** Personalize SMS body with contact data */
export function personalizeSMS(body: string, contact: { firstName?: string; email?: string }): string {
  return body
    .replace(/\{firstName\}/gi, contact.firstName ?? "there")
    .replace(/\{email\}/gi, contact.email ?? "");
}

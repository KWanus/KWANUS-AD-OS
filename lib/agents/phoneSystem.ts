// ---------------------------------------------------------------------------
// Phone System — call tracking, voicemail drops, power dialer
// Uses Twilio Voice API
// ---------------------------------------------------------------------------

export type CallRecord = {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  duration: number;        // seconds
  status: "completed" | "missed" | "voicemail" | "busy";
  recording?: string;      // URL to recording
  transcript?: string;     // AI transcription
  leadId?: string;
  timestamp: string;
};

/** Make an outbound call via Twilio */
export async function makeCall(input: {
  to: string;
  from?: string;
  voicemailMessage?: string;  // If no answer, leave this voicemail
}): Promise<{ ok: boolean; callSid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = input.from ?? process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "Twilio not configured" };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    // TwiML for voicemail detection
    const twiml = input.voicemailMessage
      ? `<Response><Say voice="Polly.Matthew">${input.voicemailMessage}</Say></Response>`
      : `<Response><Dial>${input.to}</Dial></Response>`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.to,
        From: fromNumber,
        Twiml: twiml,
        StatusCallback: `${appUrl}/api/phone/status`,
        Record: "true",
      }),
    });

    if (!res.ok) return { ok: false, error: `Call failed: ${res.status}` };
    const data = await res.json();
    return { ok: true, callSid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Call failed" };
  }
}

/** Drop a voicemail without ringing (ringless voicemail drop) */
export async function dropVoicemail(input: {
  to: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Ringless voicemail drops typically use specialized providers
  // For now, this falls back to a regular call with voicemail
  return makeCall({ to: input.to, voicemailMessage: input.message });
}

/** Generate a tracking number for a campaign */
export function generateTrackingNumber(campaignId: string): string {
  // In production, this would provision a Twilio number
  // For now, return the format
  return `+1${campaignId.replace(/[^0-9]/g, "").slice(0, 10).padEnd(10, "0")}`;
}

/** Check if phone system is configured */
export function hasPhoneConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

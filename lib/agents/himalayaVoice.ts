// ---------------------------------------------------------------------------
// Himalaya Voice Agent — our own AI calling system
//
// Three modes:
// 1. Twilio + AI Brain ($0.013/min — 5x cheaper than Retell, 4x cheaper than Vapi)
//    Makes real phone calls with AI-generated speech
// 2. Browser Voice Widget (FREE — $0/min)
//    Embeds on published sites, talks to visitors in real-time via Web Speech API
// 3. SMS Follow-up (FREE via email-to-SMS or $0.0075/msg via Twilio)
//    For leads without voice — rapid text follow-up
//
// The AI brain uses our unified inference (Anthropic → OpenAI → Groq → template)
// so it works with zero paid API keys if Groq is configured.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { generateAI } from "@/lib/integrations/aiInference";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";
import { createNotification } from "@/lib/notifications/notify";

// ── Types ────────────────────────────────────────────────────────────────────

export type VoiceCallResult = {
  ok: boolean;
  method: "twilio" | "sms" | "email_sms" | "none";
  callSid?: string;
  messageSid?: string;
  transcript?: string;
  error?: string;
};

export type LeadContactInput = {
  userId: string;
  leadId: string;
  leadName: string;
  leadPhone?: string;
  leadEmail?: string;
  niche: string;
  businessName: string;
  ownerName?: string;
};

// ── Twilio Voice Call ($0.013/min) ───────────────────────────────────────────

async function callWithTwilio(input: {
  toPhone: string;
  fromPhone: string;
  twimlUrl: string;
  accountSid: string;
  authToken: string;
}): Promise<{ ok: boolean; callSid?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${input.accountSid}:${input.authToken}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${input.accountSid}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.toPhone,
        From: input.fromPhone,
        Url: input.twimlUrl,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Twilio ${res.status}: ${err.slice(0, 200)}` };
    }

    const data = await res.json();
    return { ok: true, callSid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Twilio call failed" };
  }
}

// ── SMS Follow-up ($0.0075/msg via Twilio, or free via email-to-SMS) ────────

const CARRIER_GATEWAYS: Record<string, string> = {
  att: "txt.att.net",
  tmobile: "tmomail.net",
  verizon: "vtext.com",
  sprint: "messaging.sprintpcs.com",
};

async function sendSmsViaTwilio(input: {
  toPhone: string;
  message: string;
  accountSid: string;
  authToken: string;
  fromPhone: string;
}): Promise<{ ok: boolean; messageSid?: string; error?: string }> {
  try {
    const auth = Buffer.from(`${input.accountSid}:${input.authToken}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${input.accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.toPhone,
        From: input.fromPhone,
        Body: input.message,
      }).toString(),
    });

    if (!res.ok) return { ok: false, error: `Twilio SMS ${res.status}` };
    const data = await res.json();
    return { ok: true, messageSid: data.sid };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "SMS failed" };
  }
}

async function sendSmsViaEmail(input: {
  toPhone: string;
  message: string;
  userId: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Try all major US carrier gateways
  const cleanPhone = input.toPhone.replace(/\D/g, "").replace(/^1/, "");
  if (cleanPhone.length !== 10) return { ok: false, error: "Invalid US phone" };

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { name: true, sendingFromName: true, sendingFromEmail: true, sendingDomain: true },
  });

  const from = getFromAddressUnified(user ?? {});
  let sent = false;

  for (const [, gateway] of Object.entries(CARRIER_GATEWAYS)) {
    const result = await sendEmailUnified({
      from,
      to: `${cleanPhone}@${gateway}`,
      subject: "",
      html: input.message,
    });
    if (result.ok) { sent = true; break; }
  }

  return { ok: sent, error: sent ? undefined : "Could not send via any carrier gateway" };
}

// ── AI Script Generator ─────────────────────────────────────────────────────

async function generateCallScript(input: {
  leadName: string;
  niche: string;
  businessName: string;
  ownerName?: string;
}): Promise<string> {
  const result = await generateAI({
    prompt: `Generate a brief, warm phone call script for calling ${input.leadName} about ${input.niche} services from ${input.businessName}.

The script should:
- Open with a friendly greeting mentioning they recently showed interest
- Ask 2-3 qualifying questions (biggest challenge, timeline, budget)
- Offer to book a 15-min call with ${input.ownerName ?? "the team"}
- Be under 200 words
- Sound natural, not salesy
- Include pause points marked with [PAUSE]

Return ONLY the script text, no formatting.`,
    systemPrompt: "You write natural, conversational phone scripts. Be warm, brief, professional.",
    maxTokens: 500,
  });

  return result.content || `Hi ${input.leadName}, this is ${input.businessName}. You recently reached out about ${input.niche} — I wanted to follow up personally. Do you have a quick minute?`;
}

async function generateSmsMessage(input: {
  leadName: string;
  niche: string;
  businessName: string;
}): Promise<string> {
  const result = await generateAI({
    prompt: `Write a brief SMS follow-up message (under 160 chars) to ${input.leadName} about ${input.niche} from ${input.businessName}. Be warm, direct, include a question to prompt a reply. No emojis.`,
    systemPrompt: "You write brief, high-converting SMS messages.",
    maxTokens: 100,
  });

  const msg = result.content?.trim();
  if (msg && msg.length <= 320) return msg;

  return `Hi ${input.leadName.split(" ")[0]}, this is ${input.businessName}. Saw you were looking into ${input.niche} — still need help with that? Happy to chat if so.`;
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

/** Contact a lead using the best available method */
export async function contactLead(input: LeadContactInput): Promise<VoiceCallResult> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kwanus-ad-os-hazel.vercel.app";

  // ── Strategy 1: Twilio voice call (if configured + lead has phone) ────────
  if (twilioSid && twilioToken && twilioPhone && input.leadPhone) {
    // Generate TwiML URL that serves the AI script
    const script = await generateCallScript({
      leadName: input.leadName,
      niche: input.niche,
      businessName: input.businessName,
      ownerName: input.ownerName,
    });

    // Store script for the TwiML endpoint
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "voice_script",
        metadata: JSON.parse(JSON.stringify({
          leadId: input.leadId,
          script,
          createdAt: new Date().toISOString(),
        })),
      },
    }).catch(() => {});

    const twimlUrl = `${appUrl}/api/voice/twiml?leadId=${input.leadId}`;

    const result = await callWithTwilio({
      toPhone: input.leadPhone,
      fromPhone: twilioPhone,
      twimlUrl,
      accountSid: twilioSid,
      authToken: twilioToken,
    });

    if (result.ok) {
      await logContact(input, "twilio", result.callSid);
      return { ok: true, method: "twilio", callSid: result.callSid };
    }
  }

  // ── Strategy 2: SMS via Twilio (if phone + Twilio configured) ─────────────
  if (twilioSid && twilioToken && twilioPhone && input.leadPhone) {
    const smsText = await generateSmsMessage({
      leadName: input.leadName,
      niche: input.niche,
      businessName: input.businessName,
    });

    const result = await sendSmsViaTwilio({
      toPhone: input.leadPhone,
      message: smsText,
      accountSid: twilioSid,
      authToken: twilioToken,
      fromPhone: twilioPhone,
    });

    if (result.ok) {
      await logContact(input, "sms", result.messageSid);
      return { ok: true, method: "sms", messageSid: result.messageSid };
    }
  }

  // ── Strategy 3: SMS via email gateway (FREE — if phone available) ─────────
  if (input.leadPhone) {
    const smsText = await generateSmsMessage({
      leadName: input.leadName,
      niche: input.niche,
      businessName: input.businessName,
    });

    const result = await sendSmsViaEmail({
      toPhone: input.leadPhone,
      message: smsText,
      userId: input.userId,
    });

    if (result.ok) {
      await logContact(input, "email_sms");
      return { ok: true, method: "email_sms" };
    }
  }

  // ── No phone-based method available ───────────────────────────────────────
  return { ok: false, method: "none", error: "No phone contact method available. Lead will receive email outreach only." };
}

async function logContact(input: LeadContactInput, method: string, externalId?: string) {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "lead_contacted",
      metadata: JSON.parse(JSON.stringify({
        leadId: input.leadId,
        leadName: input.leadName,
        method,
        externalId,
        contactedAt: new Date().toISOString(),
      })),
    },
  }).catch(() => {});

  await prisma.lead.update({
    where: { id: input.leadId },
    data: { status: "called" },
  }).catch(() => {});

  await createNotification({
    userId: input.userId,
    type: "system",
    title: `Contacted ${input.leadName} via ${method}`,
    body: method === "twilio" ? "AI voice call initiated" : method === "sms" ? "SMS sent" : "SMS sent via email gateway (free)",
    href: `/leads/${input.leadId}`,
  }).catch(() => {});
}

// ── Browser Voice Widget Generator ──────────────────────────────────────────
// Generates a JS snippet that sites embed for real-time voice chat
// Uses Web Speech API (100% free, runs in browser)

export function generateVoiceWidgetScript(input: {
  businessName: string;
  niche: string;
  greeting: string;
  webhookUrl: string; // Where to send transcripts
}): string {
  return `
(function(){
  var w = document.createElement('div');
  w.id = 'himalaya-voice';
  w.innerHTML = '<button id="hv-btn" style="position:fixed;bottom:20px;right:80px;z-index:9999;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;cursor:pointer;box-shadow:0 4px 20px rgba(6,182,212,0.4);font-size:20px;" title="Talk to us">🎤</button>';
  document.body.appendChild(w);

  var btn = document.getElementById('hv-btn');
  var listening = false;
  var recognition = null;
  var synthesis = window.speechSynthesis;

  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  function speak(text) {
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1;
    synthesis.speak(u);
  }

  speak("${input.greeting.replace(/"/g, '\\"')}");

  btn.onclick = function() {
    if (listening) {
      recognition.stop();
      btn.style.background = 'linear-gradient(135deg,#06b6d4,#8b5cf6)';
      btn.textContent = '🎤';
      listening = false;
    } else {
      recognition.start();
      btn.style.background = '#ef4444';
      btn.textContent = '⏹';
      listening = true;
    }
  };

  recognition.onresult = function(e) {
    var t = e.results[0][0].transcript;
    btn.style.background = 'linear-gradient(135deg,#06b6d4,#8b5cf6)';
    btn.textContent = '🎤';
    listening = false;

    fetch('${input.webhookUrl}', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({transcript: t, source: 'voice_widget', business: '${input.businessName.replace(/'/g, "\\'")}', timestamp: Date.now()})
    }).then(function(r){return r.json()}).then(function(d){
      if (d.reply) speak(d.reply);
    }).catch(function(){
      speak("Thanks for that. Someone from our team will follow up shortly.");
    });
  };

  recognition.onerror = function() {
    btn.style.background = 'linear-gradient(135deg,#06b6d4,#8b5cf6)';
    btn.textContent = '🎤';
    listening = false;
  };
})();`;
}

// ---------------------------------------------------------------------------
// AI Voice Agent — auto-calls hot leads, qualifies them, books appointments
// Integrates with Retell AI ($0.07/min) or Vapi ($0.05/min)
//
// Flow: Hot lead detected → voice agent calls within 60 seconds →
// qualifies (budget, timeline, need) → books appointment → sends summary
//
// Speed to lead = close rate. 5 min response = 21x more likely to qualify.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export type VoiceAgentConfig = {
  provider: "retell" | "vapi";
  apiKey: string;
  agentId?: string;          // Pre-built agent on the platform
  voiceId?: string;          // Which voice to use
  greeting: string;
  qualificationQuestions: string[];
  bookingEnabled: boolean;
  maxCallDuration: number;   // seconds
};

export type CallResult = {
  ok: boolean;
  callId?: string;
  duration?: number;
  transcript?: string;
  qualified?: boolean;
  qualificationAnswers?: Record<string, string>;
  bookedAppointment?: boolean;
  error?: string;
};

/** Make an AI voice call to a lead via Retell */
async function callWithRetell(input: {
  apiKey: string;
  agentId: string;
  phoneNumber: string;
  metadata?: Record<string, string>;
}): Promise<CallResult> {
  try {
    const res = await fetch("https://api.retellai.com/v2/create-phone-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_number: process.env.RETELL_PHONE_NUMBER ?? process.env.TWILIO_PHONE_NUMBER,
        to_number: input.phoneNumber,
        agent_id: input.agentId,
        metadata: input.metadata,
      }),
    });

    if (!res.ok) return { ok: false, error: `Retell error: ${res.status}` };
    const data = await res.json();
    return { ok: true, callId: data.call_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Retell call failed" };
  }
}

/** Make an AI voice call via Vapi */
async function callWithVapi(input: {
  apiKey: string;
  assistantId: string;
  phoneNumber: string;
  metadata?: Record<string, string>;
}): Promise<CallResult> {
  try {
    const res = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: input.assistantId,
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        customer: { number: input.phoneNumber },
        metadata: input.metadata,
      }),
    });

    if (!res.ok) return { ok: false, error: `Vapi error: ${res.status}` };
    const data = await res.json();
    return { ok: true, callId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Vapi call failed" };
  }
}

/** Auto-call a hot lead — the main function */
export async function autoCallLead(input: {
  userId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  niche: string;
  businessName: string;
}): Promise<CallResult> {
  // Get voice agent config
  const retellKey = process.env.RETELL_API_KEY;
  const vapiKey = process.env.VAPI_API_KEY;

  if (!retellKey && !vapiKey) {
    return { ok: false, error: "No voice agent configured. Set RETELL_API_KEY or VAPI_API_KEY." };
  }

  let result: CallResult;

  if (retellKey) {
    result = await callWithRetell({
      apiKey: retellKey,
      agentId: process.env.RETELL_AGENT_ID ?? "",
      phoneNumber: input.leadPhone,
      metadata: { leadId: input.leadId, leadName: input.leadName, niche: input.niche },
    });
  } else {
    result = await callWithVapi({
      apiKey: vapiKey!,
      assistantId: process.env.VAPI_ASSISTANT_ID ?? "",
      phoneNumber: input.leadPhone,
      metadata: { leadId: input.leadId, leadName: input.leadName },
    });
  }

  // Log the call
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "voice_call_made",
      metadata: {
        leadId: input.leadId,
        leadName: input.leadName,
        leadPhone: input.leadPhone,
        provider: retellKey ? "retell" : "vapi",
        callId: result.callId,
        ok: result.ok,
        error: result.error,
      },
    },
  }).catch(() => {});

  // Update lead status
  if (result.ok) {
    await prisma.lead.update({
      where: { id: input.leadId },
      data: { status: "called", notes: `AI voice agent called at ${new Date().toISOString()}. Call ID: ${result.callId}` },
    }).catch(() => {});

    createNotification({
      userId: input.userId,
      type: "new_lead",
      title: `Voice agent called ${input.leadName}`,
      body: `Auto-call to ${input.leadPhone}. Call ID: ${result.callId}`,
      href: "/leads",
    }).catch(() => {});
  }

  return result;
}

/** Generate a voice agent system prompt for lead qualification */
export function generateAgentPrompt(input: {
  businessName: string;
  niche: string;
  ownerName: string;
  qualificationQuestions?: string[];
}): string {
  const questions = input.qualificationQuestions ?? [
    "What's your biggest challenge right now?",
    "Have you tried other solutions before?",
    "What's your timeline for solving this?",
    "Do you have a budget in mind?",
  ];

  return `You are a friendly, professional assistant calling on behalf of ${input.businessName}. You specialize in ${input.niche}.

Your job:
1. Introduce yourself warmly: "Hi, this is the team at ${input.businessName}. You recently reached out about ${input.niche} — I wanted to follow up personally."
2. Ask qualifying questions one at a time: ${questions.map((q, i) => `\n   ${i + 1}. "${q}"`).join("")}
3. If they seem interested, offer to book a time with ${input.ownerName}: "I'd love to set up a quick 15-minute call with ${input.ownerName} to discuss your specific situation. Would tomorrow or the day after work better?"
4. Be concise — don't ramble. Match their energy. If they're busy, be quick.
5. If they're not interested, thank them politely and end the call.
6. Never be pushy. Never lie. Never claim to be human if asked.

Keep the call under 3 minutes. Be warm, natural, and helpful.`;
}

/** Check if voice agent is configured */
export function hasVoiceAgent(): boolean {
  return !!(process.env.RETELL_API_KEY || process.env.VAPI_API_KEY);
}

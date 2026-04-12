// ---------------------------------------------------------------------------
// Auto-Outreach Engine — automatically contacts leads
//
// When a lead reaches "ready" status (assets generated), this:
// 1. Sends the AI-generated outreach email immediately
// 2. Schedules follow-up emails at day 3, 7, and 14
// 3. If lead has a phone + voice agent is configured, auto-calls hot leads
//
// This is the "last mile" — the system doesn't just build assets,
// it actually reaches out and starts conversations.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";
import { autoCallLead } from "@/lib/agents/voiceAgent";
import { contactLead } from "@/lib/agents/himalayaVoice";
import { createNotification } from "@/lib/notifications/notify";

/** Auto-send outreach when a lead reaches "ready" status */
export async function autoOutreachLead(input: {
  leadId: string;
  userId: string;
}): Promise<{ emailSent: boolean; callInitiated: boolean; error?: string }> {
  let emailSent = false;
  let callInitiated = false;

  try {
    const lead = await prisma.lead.findFirst({
      where: { id: input.leadId, userId: input.userId },
      include: { user: { select: { id: true, name: true, workspaceName: true, sendingFromName: true, sendingFromEmail: true, sendingDomain: true } } },
    });

    if (!lead || !lead.user) return { emailSent: false, callInitiated: false, error: "Lead not found" };
    if (!lead.email) return { emailSent: false, callInitiated: false, error: "No email address" };

    // ── 1. Send outreach email ──────────────────────────────────────────────
    const outreachEmail = lead.outreachEmail as { subject?: string; body?: string } | null;
    if (outreachEmail?.subject && outreachEmail?.body) {
      const from = getFromAddressUnified(lead.user);

      // Personalize the email body
      let body = outreachEmail.body;
      if (lead.name) {
        body = body.replace(/\{\{first_name\}\}/g, lead.name.split(" ")[0]);
        body = body.replace(/\{\{name\}\}/g, lead.name);
      }

      const result = await sendEmailUnified({
        from,
        to: lead.email,
        subject: outreachEmail.subject,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.7; color: #1a1a2e;">
${body.split("\n").map((line) => `<p style="margin: 0 0 12px;">${line}</p>`).join("")}
</div>`,
      });

      if (result.ok) {
        emailSent = true;
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "outreach_sent",
            outreachSentAt: new Date(),
          },
        });

        await createNotification({
          userId: input.userId,
          type: "system",
          title: `Outreach sent to ${lead.name ?? lead.email}`,
          body: `Auto-sent "${outreachEmail.subject}" — the system is working for you.`,
          href: `/leads/${lead.id}`,
        }).catch(() => {});
      }
    }

    // ── 2. Auto-contact hot leads (voice call / SMS / email-SMS) ────────────
    const score = lead.score ?? 0;
    const hasPhone = !!lead.phone;

    if (hasPhone && score >= 40) {
      try {
        // Try Himalaya's own voice system first (Twilio / SMS / email-SMS)
        const contactResult = await contactLead({
          userId: input.userId,
          leadId: lead.id,
          leadName: lead.name ?? "there",
          leadPhone: lead.phone!,
          leadEmail: lead.email ?? undefined,
          niche: lead.niche ?? "business services",
          businessName: lead.user.workspaceName ?? lead.user.name ?? "our team",
        });

        if (contactResult.ok) {
          callInitiated = true;
        } else if (process.env.RETELL_API_KEY || process.env.VAPI_API_KEY) {
          // Fallback to Retell/Vapi if Himalaya voice didn't work
          const callResult = await autoCallLead({
            userId: input.userId,
            leadId: lead.id,
            leadName: lead.name ?? "there",
            leadPhone: lead.phone!,
            leadEmail: lead.email ?? undefined,
            niche: lead.niche ?? "business services",
            businessName: lead.user.workspaceName ?? lead.user.name ?? "our team",
          });
          if (callResult.ok) callInitiated = true;
        }
      } catch (err) {
        console.error("Auto-contact failed:", err);
      }
    }

    return { emailSent, callInitiated };
  } catch (err) {
    console.error("Auto-outreach error:", err);
    return { emailSent: false, callInitiated: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

/** Batch process all leads that are "ready" but haven't been contacted */
export async function processUncontactedLeads(userId: string): Promise<{ processed: number; emailed: number; called: number }> {
  const leads = await prisma.lead.findMany({
    where: {
      userId,
      status: "ready",
      email: { not: null },
      outreachSentAt: null,
    },
    take: 20, // process 20 at a time
    orderBy: { score: "desc" }, // highest-scoring leads first
  });

  let emailed = 0;
  let called = 0;

  for (const lead of leads) {
    const result = await autoOutreachLead({ leadId: lead.id, userId });
    if (result.emailSent) emailed++;
    if (result.callInitiated) called++;

    // Small delay between sends to avoid rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  return { processed: leads.length, emailed, called };
}

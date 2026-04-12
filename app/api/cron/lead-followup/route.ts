// ---------------------------------------------------------------------------
// GET /api/cron/lead-followup
// Auto re-engage leads that went cold (no activity in 14+ days)
// Sends a follow-up email and creates a notification
// Called by Vercel cron weekly
// Now also processes "ready" leads that haven't been contacted yet
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";
import { createNotification } from "@/lib/notifications/notify";
import { processUncontactedLeads } from "@/lib/leads/autoOutreach";

export async function GET() {
  try {
    // ── Part 1: Process uncontacted "ready" leads ───────────────────────────
    // These are leads with generated assets but no outreach sent yet
    const users = await prisma.user.findMany({
      where: {
        leads: { some: { status: "ready", outreachSentAt: null, email: { not: null } } },
      },
      select: { id: true },
      take: 20,
    });

    let autoOutreachTotal = 0;
    for (const user of users) {
      const result = await processUncontactedLeads(user.id);
      autoOutreachTotal += result.emailed;
    }

    // ── Part 2: Re-engage cold leads (existing behavior) ────────────────────
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const coldLeads = await prisma.lead.findMany({
      where: {
        status: "new",
        email: { not: null },
        createdAt: {
          gte: thirtyDaysAgo,
          lte: fourteenDaysAgo,
        },
      },
      include: { user: { select: { id: true, name: true, workspaceName: true, sendingFromName: true, sendingFromEmail: true, sendingDomain: true } } },
      take: 50,
    });

    let sent = 0;
    let notified = 0;

    for (const lead of coldLeads) {
      if (!lead.email || !lead.user) continue;

      const from = getFromAddressUnified(lead.user);

      const result = await sendEmailUnified({
        from,
        to: lead.email,
        subject: `Quick follow-up — still interested?`,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.7; color: #1a1a2e;">
<p>Hey${lead.name ? ` ${lead.name.split(" ")[0]}` : ""},</p>
<p>You reached out a couple weeks ago and I wanted to check in.</p>
<p>Are you still looking for help with this? If timing has changed, totally understand — just let me know and I'll close out your file.</p>
<p>If you're still interested, reply to this email and let's pick up where we left off.</p>
<p>Best,<br>The Team</p>
</div>`,
      });

      if (result.ok) {
        sent++;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: "followup_sent" },
        }).catch(() => {});
      }

      await createNotification({
        userId: lead.user.id,
        type: "system",
        title: `Auto-followup sent to ${lead.name}`,
        body: `${lead.email} was going cold (${Math.round((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days). We sent a re-engagement email.`,
        href: "/leads",
      }).catch(() => {});
      notified++;
    }

    return NextResponse.json({
      ok: true,
      autoOutreach: autoOutreachTotal,
      coldLeads: coldLeads.length,
      sent,
      notified,
    });
  } catch (err) {
    console.error("Lead followup error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

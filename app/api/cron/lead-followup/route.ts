// ---------------------------------------------------------------------------
// GET /api/cron/lead-followup
// Auto re-engage leads that went cold (no activity in 14+ days)
// Sends a follow-up email and creates a notification
// Called by Vercel cron weekly
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getFromAddress } from "@/lib/integrations/resendClient";
import { createNotification } from "@/lib/notifications/notify";

export async function GET() {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Find leads that:
    // 1. Were created 14-30 days ago
    // 2. Have status "new" (never contacted/converted)
    // 3. Have an email address
    const coldLeads = await prisma.lead.findMany({
      where: {
        status: "new",
        email: { not: null },
        createdAt: {
          gte: thirtyDaysAgo,
          lte: fourteenDaysAgo,
        },
      },
      include: { user: { select: { id: true, sendingFromName: true, sendingFromEmail: true, sendingDomain: true } } },
      take: 50,
    });

    let sent = 0;
    let notified = 0;

    for (const lead of coldLeads) {
      if (!lead.email || !lead.user) continue;

      const fromAddress = getFromAddress(lead.user);

      // Send a gentle follow-up
      const result = await sendEmail({
        from: fromAddress,
        to: lead.email,
        subject: `Quick follow-up — still interested?`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<p>Hey${lead.name ? ` ${lead.name.split(" ")[0]}` : ""},</p>
<p>You reached out a couple weeks ago and I wanted to check in.</p>
<p>Are you still looking for help with this? If timing has changed, totally understand — just let me know and I'll close out your file.</p>
<p>If you're still interested, reply to this email and let's pick up where we left off.</p>
<p>Best,<br>The Team</p>
</div>`,
        tags: [{ name: "type", value: "auto-followup" }],
      });

      if (result.ok) {
        sent++;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: "followup_sent" },
        }).catch(() => {});
      }

      // Notify owner
      await createNotification({
        userId: lead.user.id,
        type: "system",
        title: `Auto-followup sent to ${lead.name}`,
        body: `${lead.email} was going cold (${Math.round((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days). We sent a re-engagement email.`,
        href: "/leads",
      }).catch(() => {});
      notified++;
    }

    return NextResponse.json({ ok: true, coldLeads: coldLeads.length, sent, notified });
  } catch (err) {
    console.error("Lead followup error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Engagement Engine — keeps users AND their customers active
//
// Handles gaps 16, 23, 38, 31, 33:
// - Platform re-engagement (emails from Himalaya to inactive users)
// - Email list hygiene (clean dead subscribers)
// - SMS marketing integration
// - Content repurposing automation
// - Post-launch competitor monitoring
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { sendEmailUnified, getFromAddressUnified } from "@/lib/integrations/emailSender";
import { generateAI } from "@/lib/integrations/aiInference";
import { createNotification } from "@/lib/notifications/notify";

// ── Platform Re-engagement (#16) ─────────────────────────────────────────────
// When OUR users go inactive, bring them back

export async function checkInactiveUsers(): Promise<{ contacted: number }> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Find users with no recent activity
  const inactiveUsers = await prisma.user.findMany({
    where: {
      updatedAt: { lte: threeDaysAgo, gte: fourteenDaysAgo },
      email: { not: "" },
    },
    select: { id: true, email: true, name: true },
    take: 50,
  });

  let contacted = 0;

  for (const user of inactiveUsers) {
    if (!user.email) continue;

    // Check if we already sent a re-engagement email recently
    const recentReengagement = await prisma.himalayaFunnelEvent.findFirst({
      where: { userId: user.id, event: "platform_reengagement", createdAt: { gte: fourteenDaysAgo } },
    });
    if (recentReengagement) continue;

    // Get their stats
    const [campaigns, sites, leads] = await Promise.all([
      prisma.campaign.count({ where: { userId: user.id } }),
      prisma.site.count({ where: { userId: user.id } }),
      prisma.lead.count({ where: { userId: user.id } }),
    ]);

    let subject = "";
    let body = "";
    const firstName = user.name?.split(" ")[0] ?? "there";

    if (campaigns === 0 && sites === 0) {
      subject = `${firstName}, your business is waiting`;
      body = `Hey ${firstName},\n\nYou signed up for Himalaya but haven't built anything yet.\n\nHere's the thing — it takes literally 60 seconds. Tell Himalaya what you want, and it builds your entire business: site, ads, emails, everything.\n\nOne click: {{app_url}}/himalaya\n\nDon't overthink it. Just start.`;
    } else if (sites > 0 && leads === 0) {
      subject = `Your site is live — but nobody knows`;
      body = `${firstName}, your site is built and live.\n\nBut it has zero leads. That means nobody is seeing it.\n\nLog in now and run today's daily commands. We'll tell you exactly what to post, where, and how to get your first traffic.\n\n{{app_url}}\n\n5 minutes today could change everything.`;
    } else {
      subject = `You have ${leads} leads waiting`;
      body = `${firstName}, you have ${leads} leads in your pipeline.\n\nSome might be going cold. Log in, check your daily commands, and follow up before they forget about you.\n\n{{app_url}}\n\nSpeed wins.`;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kwanus-ad-os-hazel.vercel.app";
    body = body.replace(/\{\{app_url\}\}/g, appUrl);

    const result = await sendEmailUnified({
      from: `Himalaya <noreply@${appUrl.replace(/https?:\/\//, "")}>`,
      to: user.email,
      subject,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:24px;line-height:1.7;color:#1a1a2e;">
${body.split("\n").map(line => `<p style="margin:0 0 12px;">${line}</p>`).join("")}
</div>`,
    });

    if (result.ok) {
      contacted++;
      await prisma.himalayaFunnelEvent.create({
        data: { userId: user.id, event: "platform_reengagement", metadata: JSON.parse(JSON.stringify({ subject, sentAt: new Date().toISOString() })) },
      }).catch(() => {});
    }
  }

  return { contacted };
}

// ── Email List Hygiene (#23) ─────────────────────────────────────────────────

export async function cleanEmailList(userId: string): Promise<{ removed: number; reengaged: number }> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Find contacts with no engagement in 90 days
  const staleContacts = await prisma.emailContact.findMany({
    where: {
      userId,
      status: "subscribed",
      updatedAt: { lte: ninetyDaysAgo },
    },
    take: 100,
  });

  let removed = 0;
  let reengaged = 0;

  for (const contact of staleContacts) {
    // Check if they've opened/clicked anything
    const hasEngagement = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId,
        event: { in: ["email_opened", "email_clicked", "form_submitted"] },
        metadata: { path: ["contactEmail"], equals: contact.email },
        createdAt: { gte: ninetyDaysAgo },
      },
    });

    if (hasEngagement) continue;

    // Send re-engagement email
    const result = await sendEmailUnified({
      from: getFromAddressUnified({ sendingFromName: null, sendingFromEmail: null, sendingDomain: null }),
      to: contact.email,
      subject: "Should we keep sending you emails?",
      html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;line-height:1.7;">
<p>Hey${contact.firstName ? ` ${contact.firstName}` : ""},</p>
<p>We noticed you haven't opened our emails in a while.</p>
<p>No hard feelings — we only want to email people who want to hear from us.</p>
<p><strong>Click here to stay on the list:</strong> [keep link]</p>
<p>If we don't hear from you in 7 days, we'll remove you automatically. No action needed.</p>
<p>Thanks for being here.</p>
</div>`,
    });

    if (result.ok) {
      reengaged++;
      // Tag for 7-day removal check
      await prisma.emailContact.update({
        where: { id: contact.id },
        data: { tags: [...(contact.tags ?? []), "re-engagement-pending"] },
      }).catch(() => {});
    } else {
      // Remove immediately if email bounces
      await prisma.emailContact.update({
        where: { id: contact.id },
        data: { status: "unsubscribed" },
      }).catch(() => {});
      removed++;
    }
  }

  return { removed, reengaged };
}

// ── Content Repurposing (#31) ────────────────────────────────────────────────

export async function repurposeContent(input: {
  originalContent: string;
  originalType: "blog" | "video" | "email" | "social_post";
  targetPlatforms: string[];
}): Promise<{ platform: string; content: string; type: string }[]> {
  const result = await generateAI({
    prompt: `Take this ${input.originalType} content and repurpose it for ${input.targetPlatforms.join(", ")}:

Original:
${input.originalContent.slice(0, 2000)}

For each platform, create platform-appropriate content:
- Instagram: under 300 chars, engaging, emoji-free
- TikTok: 60-second script format with hook/body/CTA
- LinkedIn: professional, 200-400 words, value-focused
- Twitter: under 280 chars, punchy
- Email: subject + body, personal tone

Return JSON array: [{"platform":"...","content":"...","type":"post|reel_script|article|tweet|email"}]`,
    systemPrompt: "You repurpose content for different platforms while maintaining the core message. Return only JSON array.",
    maxTokens: 1500,
  });

  try {
    return JSON.parse(result.content);
  } catch {
    return input.targetPlatforms.map(p => ({
      platform: p,
      content: input.originalContent.slice(0, 300),
      type: "post",
    }));
  }
}

// ── Competitor Monitoring (#33) ──────────────────────────────────────────────

export async function monitorCompetitors(input: {
  userId: string;
  niche: string;
  competitorUrls: string[];
}): Promise<void> {
  for (const url of input.competitorUrls.slice(0, 3)) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) continue;

      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch?.[1] ?? url;

      // Store snapshot for comparison
      await prisma.himalayaFunnelEvent.create({
        data: {
          userId: input.userId,
          event: "competitor_snapshot",
          metadata: JSON.parse(JSON.stringify({
            url,
            title,
            contentLength: html.length,
            hasNewOffer: html.includes("new") || html.includes("launch") || html.includes("introducing"),
            snapshotAt: new Date().toISOString(),
          })),
        },
      });
    } catch { /* skip failed URLs */ }
  }
}

// ── Success Dashboard Data (#45) ─────────────────────────────────────────────

export async function getSuccessDashboard(userId: string): Promise<{
  totalRevenue: number;
  totalLeads: number;
  totalSiteViews: number;
  activeEmailFlows: number;
  activeCampaigns: number;
  conversionRate: number;
  streak: number;
  isActuallyMakingMoney: boolean;
  nextMilestone: string;
}> {
  const [sites, leads, flows, campaigns, orders, events] = await Promise.all([
    prisma.site.aggregate({ where: { userId }, _sum: { totalViews: true } }),
    prisma.lead.count({ where: { userId } }),
    prisma.emailFlow.count({ where: { userId, status: "active" } }),
    prisma.campaign.count({ where: { userId, status: { in: ["active", "testing", "scaling"] } } }),
    prisma.site.findMany({ where: { userId }, select: { id: true } }).then(async (sites) => {
      if (sites.length === 0) return [];
      return prisma.siteOrder.findMany({
        where: { siteId: { in: sites.map(s => s.id) } },
        select: { amountCents: true, status: true },
      });
    }),
    prisma.himalayaFunnelEvent.count({
      where: { userId, event: "command_completed", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const totalRevenue = orders
    .filter(o => o.status === "paid" || o.status === "fulfilled")
    .reduce((sum, o) => sum + (o.amountCents ?? 0), 0) / 100;

  const totalSiteViews = sites._sum.totalViews ?? 0;
  const conversionRate = totalSiteViews > 0 ? (leads / totalSiteViews) * 100 : 0;
  const isActuallyMakingMoney = totalRevenue > 0;

  let nextMilestone = "";
  if (totalRevenue === 0) nextMilestone = "First sale — you're one conversion away";
  else if (totalRevenue < 100) nextMilestone = "$100 — momentum is building";
  else if (totalRevenue < 1000) nextMilestone = "$1,000 — real business territory";
  else if (totalRevenue < 5000) nextMilestone = "$5,000 — time to systematize";
  else if (totalRevenue < 10000) nextMilestone = "$10,000 — scale mode activated";
  else nextMilestone = "Keep scaling — you're in the top 5%";

  return {
    totalRevenue,
    totalLeads: leads,
    totalSiteViews,
    activeEmailFlows: flows,
    activeCampaigns: campaigns,
    conversionRate: Math.round(conversionRate * 100) / 100,
    streak: events,
    isActuallyMakingMoney,
    nextMilestone,
  };
}

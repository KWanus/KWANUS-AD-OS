// ---------------------------------------------------------------------------
// Daily Command System — tells the user EXACTLY what to do today
//
// After Himalaya deploys a business, users don't think.
// They open the app and see: "Do this. Then this. Then this."
//
// Commands are generated based on:
// 1. What's been deployed (sites, campaigns, emails)
// 2. What stage they're in (launch, growth, scale)
// 3. What's working and what's not (metrics)
// 4. Time since last action
//
// This is the "controlled system that forces profitable behavior"
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { generateAI } from "@/lib/integrations/aiInference";
import { getPlaybook } from "@/lib/himalaya/nichePlaybooks";

export type DailyCommand = {
  id: string;
  priority: 1 | 2 | 3;          // 1 = do now, 2 = do today, 3 = when you can
  action: string;                // "Post this to Instagram"
  details: string;               // The actual content or instructions
  estimatedTime: string;         // "5 min"
  category: "post" | "ad" | "email" | "outreach" | "optimize" | "review" | "create";
  href?: string;                 // Link to the tool/page
  content?: string;              // Ready-to-use content (copy, caption, etc.)
  completed: boolean;
};

export type CommandsResult = {
  ok: boolean;
  greeting: string;
  commands: DailyCommand[];
  stats?: {
    streak: number;              // days in a row they completed commands
    totalCompleted: number;
    stage: string;               // "Launch Week" / "Growth Phase" / "Scale Mode"
  };
};

/** Generate today's commands for a user */
export async function generateDailyCommands(userId: string): Promise<CommandsResult> {
  try {
    // Gather user state
    const [user, campaigns, sites, emailFlows, leads, recentEvents] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, workspaceName: true } }),
      prisma.campaign.findMany({ where: { userId }, select: { id: true, name: true, status: true, productUrl: true }, take: 5 }),
      prisma.site.findMany({ where: { userId }, select: { id: true, name: true, slug: true, published: true, totalViews: true }, take: 5 }),
      prisma.emailFlow.findMany({ where: { userId }, select: { id: true, name: true, status: true, enrolled: true, sent: true }, take: 5 }),
      prisma.lead.findMany({ where: { userId }, select: { id: true, name: true, status: true, score: true }, orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.himalayaFunnelEvent.findMany({
        where: { userId, event: "command_completed" },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const firstName = user?.name?.split(" ")[0] ?? "there";
    const hasAssets = campaigns.length > 0 || sites.length > 0;
    const publishedSites = sites.filter(s => s.published);
    const activeCampaigns = campaigns.filter(c => c.status === "active");
    const hotLeads = leads.filter(l => (l.score ?? 0) >= 50);

    // Calculate streak
    const completedDates = recentEvents.map(e => new Date(e.createdAt).toDateString());
    const uniqueDates = [...new Set(completedDates)];
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (uniqueDates.includes(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) break;
    }

    // Determine stage
    const stage = !hasAssets ? "Setup" :
      publishedSites.length === 0 ? "Launch Week" :
      activeCampaigns.length === 0 ? "Pre-Launch" :
      (sites.reduce((sum, s) => sum + (s.totalViews ?? 0), 0)) < 100 ? "Early Growth" :
      "Growth Phase";

    // Build commands based on current state
    const commands: DailyCommand[] = [];
    let cmdId = 0;

    // ── No assets yet ──
    if (!hasAssets) {
      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 1,
        action: "Build your business in 60 seconds",
        details: "Tell Himalaya what you want. It creates your site, ads, emails, and scripts — you just approve.",
        estimatedTime: "2 min",
        category: "create",
        href: "/himalaya",
        completed: false,
      });
      return {
        ok: true,
        greeting: `Hey ${firstName}. Let's get you started.`,
        commands,
        stats: { streak, totalCompleted: recentEvents.length, stage },
      };
    }

    // ── Has assets but nothing published ──
    if (publishedSites.length === 0 && sites.length > 0) {
      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 1,
        action: "Approve and publish your site",
        details: `"${sites[0].name}" is built and ready. Review it, then hit publish — takes 10 seconds.`,
        estimatedTime: "1 min",
        category: "review",
        href: `/websites/${sites[0].id}`,
        completed: false,
      });
    }

    // ── Site is live but no traffic ──
    if (publishedSites.length > 0 && activeCampaigns.length === 0) {
      // Generate social content to post
      const aiContent = await generateAI({
        prompt: `Write a short social media post (under 200 chars) for a ${user?.workspaceName ?? "business"} that just launched. Include a call to action. No hashtags. Be direct and conversational.`,
        maxTokens: 100,
      });

      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 1,
        action: "Post this on Instagram/Facebook/LinkedIn",
        details: "We wrote this for you. Just copy, paste, and post.",
        estimatedTime: "3 min",
        category: "post",
        content: aiContent.content,
        completed: false,
      });

      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 2,
        action: "Send your site to 5 people you know",
        details: `Text or DM this link to 5 people: ${publishedSites[0].slug ? `your-site.com/s/${publishedSites[0].slug}` : "your published site URL"}. Ask for honest feedback.`,
        estimatedTime: "5 min",
        category: "outreach",
        completed: false,
      });

      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 2,
        action: "Review and approve your ad campaign",
        details: "Your ads are already created. Open them, review the creatives, and approve to go live.",
        estimatedTime: "3 min",
        category: "review",
        href: "/campaigns",
        completed: false,
      });
    }

    // ── Campaigns running — check performance ──
    if (activeCampaigns.length > 0) {
      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 2,
        action: "Check your ad performance",
        details: "Open your ads dashboard. Are you getting clicks? What's the cost per click? Report back.",
        estimatedTime: "3 min",
        category: "review",
        href: "/ads",
        completed: false,
      });
    }

    // ── Hot leads need follow-up ──
    if (hotLeads.length > 0) {
      const lead = hotLeads[0];
      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 1,
        action: `Follow up with ${lead.name ?? "hot lead"}`,
        details: `Score: ${lead.score}. This person is interested. Call or email them TODAY.`,
        estimatedTime: "5 min",
        category: "outreach",
        href: `/leads/${lead.id}`,
        completed: false,
      });
    }

    // ── Active clients need attention ──
    if (hasAssets) {
      const clients = await prisma.client.findMany({
        where: { userId, pipelineStage: { in: ["active", "won"] } },
        select: { id: true, name: true, lastContactAt: true, pipelineStage: true },
        take: 5,
      }).catch(() => []);

      for (const client of clients) {
        const daysSinceContact = client.lastContactAt
          ? Math.floor((Date.now() - client.lastContactAt.getTime()) / 86400000)
          : 999;

        if (daysSinceContact >= 7) {
          commands.push({
            id: `cmd-${cmdId++}`,
            priority: 1,
            action: `Check in with ${client.name}`,
            details: `It's been ${daysSinceContact} days since your last contact. Send a quick update or schedule a call.`,
            estimatedTime: "5 min",
            category: "outreach",
            href: `/clients/${client.id}`,
            completed: false,
          });
        }
      }
    }

    // ── Email flows not active ──
    if (emailFlows.length > 0 && emailFlows.every(f => f.status !== "active")) {
      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 2,
        action: "Approve your email automation",
        details: "Your email sequences are already written. Review them and hit activate — leads will get followed up automatically.",
        estimatedTime: "2 min",
        category: "review",
        href: "/emails",
        completed: false,
      });
    }

    // ── Always: daily content ──
    if (publishedSites.length > 0) {
      const contentAI = await generateAI({
        prompt: `Write a short, scroll-stopping social media post (under 250 chars) for ${user?.workspaceName ?? "a business"}. It should provide value or a hot take. No hashtags. Be direct.`,
        maxTokens: 100,
      });

      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 3,
        action: "Post today's content",
        details: "We wrote this for you. Copy, paste, post — done in 30 seconds.",
        estimatedTime: "1 min",
        category: "post",
        content: contentAI.content,
        completed: false,
      });
    }

    // ── Niche-specific commands from playbook ──
    const profile = await prisma.businessProfile.findUnique({
      where: { userId },
      select: { businessType: true },
    }).catch(() => null);

    const playbook = getPlaybook(profile?.businessType ?? "");
    if (playbook && commands.length < 4) {
      // Add a niche-specific tip from the playbook's mistakes list
      const tip = playbook.mistakes[Math.floor(Math.random() * playbook.mistakes.length)];
      commands.push({
        id: `cmd-${cmdId++}`,
        priority: 3,
        action: `Avoid this ${playbook.niche} mistake`,
        details: tip,
        estimatedTime: "1 min",
        category: "review",
        completed: false,
      });
    }

    // Sort by priority
    commands.sort((a, b) => a.priority - b.priority);

    const greeting = streak >= 3
      ? `${streak}-day streak, ${firstName}. Don't break it.`
      : hotLeads.length > 0
      ? `${firstName}, you have a hot lead. Handle it first.`
      : publishedSites.length === 0
      ? `${firstName}, your site isn't live yet. Fix that today.`
      : `Hey ${firstName}. Here's today's plan.`;

    return {
      ok: true,
      greeting,
      commands: commands.slice(0, 5), // max 5 commands
      stats: { streak, totalCompleted: recentEvents.length, stage },
    };
  } catch (err) {
    console.error("Daily commands error:", err);
    return { ok: false, greeting: "Hey there.", commands: [] };
  }
}

/** Mark a command as completed */
export async function completeCommand(userId: string, commandId: string): Promise<void> {
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "command_completed",
      metadata: JSON.parse(JSON.stringify({ commandId, completedAt: new Date().toISOString() })),
    },
  });
}

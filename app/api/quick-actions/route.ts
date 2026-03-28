import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/quick-actions
 * Returns personalized next-best-actions based on the user's current workspace state.
 * Used by the dashboard, copilot, and notification system.
 */

type QuickAction = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "client" | "campaign" | "scan" | "email" | "site" | "setup" | "system";
  title: string;
  description: string;
  href: string;
  cta: string;
};

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const [
      atRiskClients,
      neverContactedClients,
      draftCampaigns,
      recentAnalyses,
      draftFlows,
      unpublishedSites,
      clientCount,
      campaignCount,
      siteCount,
      emailFlowCount,
      analysisCount,
      businessProfile,
    ] = await Promise.all([
      prisma.client.findMany({
        where: { userId: user.id, healthStatus: "red" },
        select: { id: true, name: true, healthScore: true, lastContactAt: true },
        take: 5,
      }),
      prisma.client.findMany({
        where: { userId: user.id, lastContactAt: null },
        select: { id: true, name: true },
        orderBy: { createdAt: "asc" },
        take: 3,
      }),
      prisma.campaign.findMany({
        where: { userId: user.id, status: "draft" },
        select: { id: true, name: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      prisma.analysisRun.findMany({
        where: { userId: user.id, verdict: "Pursue" },
        select: { id: true, title: true, inputUrl: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.emailFlow.findMany({
        where: { userId: user.id, status: "draft" },
        select: { id: true, name: true },
        take: 3,
      }),
      prisma.site.findMany({
        where: { userId: user.id, published: false },
        select: { id: true, name: true },
        take: 3,
      }),
      prisma.client.count({ where: { userId: user.id } }),
      prisma.campaign.count({ where: { userId: user.id } }),
      prisma.site.count({ where: { userId: user.id } }),
      prisma.emailFlow.count({ where: { userId: user.id } }),
      prisma.analysisRun.count({ where: { userId: user.id } }),
      prisma.businessProfile.findUnique({
        where: { userId: user.id },
        select: { businessType: true, setupCompleted: true },
      }),
    ]);

    const actions: QuickAction[] = [];

    // Setup actions
    if (!businessProfile?.setupCompleted) {
      actions.push({
        id: "setup-profile",
        priority: "critical",
        category: "setup",
        title: "Complete your business profile",
        description: "The OS can't give personalized guidance until you set up your business type, niche, and goals.",
        href: "/setup",
        cta: "Set Up Now",
      });
    }

    // Client actions
    for (const c of atRiskClients) {
      actions.push({
        id: `client-at-risk-${c.id}`,
        priority: "critical",
        category: "client",
        title: `${c.name} needs attention (health: ${c.healthScore})`,
        description: c.lastContactAt
          ? `Last contacted ${Math.round((Date.now() - new Date(c.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))} days ago.`
          : "Never contacted — reach out before they go cold.",
        href: `/clients/${c.id}`,
        cta: "Open Client",
      });
    }

    for (const c of neverContactedClients) {
      if (!atRiskClients.some(r => r.id === c.id)) {
        actions.push({
          id: `client-never-contacted-${c.id}`,
          priority: "high",
          category: "client",
          title: `Contact ${c.name} for the first time`,
          description: "This client was added but never reached out to.",
          href: `/clients/${c.id}`,
          cta: "Open Client",
        });
      }
    }

    // Campaign actions
    for (const c of draftCampaigns) {
      actions.push({
        id: `campaign-draft-${c.id}`,
        priority: "medium",
        category: "campaign",
        title: `Finish "${c.name}" campaign`,
        description: "This campaign is still in draft — review assets and launch it.",
        href: `/campaigns/${c.id}`,
        cta: "Continue",
      });
    }

    // Pursue-worthy analyses without campaigns
    for (const a of recentAnalyses) {
      actions.push({
        id: `analysis-pursue-${a.id}`,
        priority: "medium",
        category: "scan",
        title: `Build on "${a.title ?? a.inputUrl}" (Pursue verdict)`,
        description: "This scan scored high — generate a campaign or landing page from it.",
        href: `/analyses/${a.id}`,
        cta: "View Report",
      });
    }

    // Draft email flows
    for (const f of draftFlows) {
      actions.push({
        id: `flow-draft-${f.id}`,
        priority: "low",
        category: "email",
        title: `Activate "${f.name}" email flow`,
        description: "This automation is ready but hasn't been published yet.",
        href: `/emails/flows/${f.id}`,
        cta: "Edit Flow",
      });
    }

    // Unpublished sites
    for (const s of unpublishedSites) {
      actions.push({
        id: `site-unpublished-${s.id}`,
        priority: "medium",
        category: "site",
        title: `Publish "${s.name}" site`,
        description: "This site is built but not live yet.",
        href: `/websites/${s.id}`,
        cta: "Open Editor",
      });
    }

    // Generic suggestions based on counts
    if (analysisCount === 0) {
      actions.push({
        id: "first-scan",
        priority: "high",
        category: "scan",
        title: "Run your first URL scan",
        description: "Scan a competitor or product URL to get scores, ad hooks, and a full asset package.",
        href: "/scan",
        cta: "Start Scan",
      });
    }

    if (clientCount === 0 && campaignCount > 0) {
      actions.push({
        id: "first-client",
        priority: "medium",
        category: "client",
        title: "Add your first CRM client",
        description: "You have campaigns running but no clients tracked. Start tracking relationships.",
        href: "/clients/new",
        cta: "Add Client",
      });
    }

    if (emailFlowCount === 0 && siteCount > 0) {
      actions.push({
        id: "first-flow",
        priority: "medium",
        category: "email",
        title: "Create your first email automation",
        description: "You have a site but no follow-up system. Don't let leads go cold.",
        href: "/emails",
        cta: "Build Flow",
      });
    }

    // Sort by priority
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

    return NextResponse.json({
      ok: true,
      actions: actions.slice(0, 10),
      total: actions.length,
      counts: {
        clients: clientCount,
        campaigns: campaignCount,
        sites: siteCount,
        emailFlows: emailFlowCount,
        analyses: analysisCount,
        atRisk: atRiskClients.length,
      },
    });
  } catch (err) {
    console.error("Quick actions error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

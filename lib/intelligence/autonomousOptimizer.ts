// ---------------------------------------------------------------------------
// Autonomous Optimizer — the brain that runs the business automatically
// Monitors performance → detects problems → generates fixes → applies them
// This is what makes Himalaya different from everything else.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { scoreContent } from "@/lib/intelligence/contentScoring";

export type OptimizationAction = {
  type: "rewrite_headline" | "rewrite_email_subject" | "adjust_budget" | "kill_variation" | "scale_variation" | "add_urgency" | "fix_cta" | "alert_owner";
  target: string;       // ID of the thing to optimize
  targetType: "site_block" | "email_node" | "ad_variation" | "campaign";
  reason: string;
  suggestedChange: string;
  expectedImpact: string;
  priority: "critical" | "high" | "medium" | "low";
  autoApply: boolean;   // Can this be applied without user confirmation?
};

export type OptimizationReport = {
  scanned: number;
  issuesFound: number;
  actionsProposed: OptimizationAction[];
  autoApplied: number;
  timestamp: string;
};

/** Run the autonomous optimizer for a user's entire system */
export async function runAutonomousOptimization(userId: string): Promise<OptimizationReport> {
  const actions: OptimizationAction[] = [];

  // ── 1. Check site conversion rates ──────────────────────────────────
  const sites = await prisma.site.findMany({
    where: { userId, published: true },
    select: { id: true, name: true, totalViews: true, pages: { select: { id: true, blocks: true } } },
  });

  for (const site of sites) {
    const contacts = await prisma.emailContact.count({
      where: { userId, source: { contains: `site:${site.id}` } },
    });
    const convRate = site.totalViews > 0 ? (contacts / site.totalViews) * 100 : 0;

    // Low conversion rate with enough traffic
    if (site.totalViews >= 200 && convRate < 1) {
      // Score the hero block
      const home = site.pages[0];
      if (home) {
        const blocks = home.blocks as { type: string; props?: Record<string, unknown> }[];
        const hero = blocks?.find((b) => b.type === "hero");
        if (hero?.props?.headline) {
          const headlineScore = scoreContent(String(hero.props.headline), "landing");
          if (headlineScore.overall < 60) {
            actions.push({
              type: "rewrite_headline",
              target: site.id,
              targetType: "site_block",
              reason: `Site "${site.name}" has ${convRate.toFixed(1)}% conversion with ${site.totalViews} views. Headline scores ${headlineScore.overall}/100.`,
              suggestedChange: `Current: "${hero.props.headline}". Issue: ${headlineScore.topIssue ?? "weak hook"}. Needs: specific outcome + urgency + proof.`,
              expectedImpact: "Improving headline from 40 → 70 score typically doubles conversion rate",
              priority: "high",
              autoApply: false,
            });
          }
        }
      }
    }

    // No form on site
    if (site.totalViews >= 50) {
      const home = site.pages[0];
      const blocks = (home?.blocks as { type: string }[]) ?? [];
      const hasForm = blocks.some((b) => b.type === "form" || b.type === "checkout");
      if (!hasForm) {
        actions.push({
          type: "fix_cta",
          target: site.id,
          targetType: "site_block",
          reason: `Site "${site.name}" has no form or checkout block. Visitors can't convert.`,
          suggestedChange: "Add a form block with email + name fields",
          expectedImpact: "Without a form, conversion rate is 0% regardless of traffic",
          priority: "critical",
          autoApply: false,
        });
      }
    }
  }

  // ── 2. Check email flow performance ─────────────────────────────────
  const flows = await prisma.emailFlow.findMany({
    where: { userId, status: "active" },
    select: { id: true, name: true, sent: true, opens: true, clicks: true, enrolled: true, nodes: true },
  });

  for (const flow of flows) {
    if (flow.sent >= 50) {
      const openRate = (flow.opens / flow.sent) * 100;
      const clickRate = (flow.clicks / flow.sent) * 100;

      // Terrible open rate
      if (openRate < 10) {
        const nodes = flow.nodes as { type: string; data?: { subject?: string } }[];
        const firstEmail = nodes.find((n) => n.type === "email");
        actions.push({
          type: "rewrite_email_subject",
          target: flow.id,
          targetType: "email_node",
          reason: `Flow "${flow.name}" has ${openRate.toFixed(0)}% open rate (${flow.sent} sent). Subject lines aren't working.`,
          suggestedChange: `Current subject: "${firstEmail?.data?.subject ?? "unknown"}". Try: shorter (under 40 chars), add curiosity gap, use lowercase.`,
          expectedImpact: "Improving open rate from 10% → 25% means 2.5x more people see your content",
          priority: "high",
          autoApply: false,
        });
      }

      // Opens but no clicks
      if (openRate >= 15 && clickRate < 2) {
        actions.push({
          type: "fix_cta",
          target: flow.id,
          targetType: "email_node",
          reason: `Flow "${flow.name}" has ${openRate.toFixed(0)}% opens but only ${clickRate.toFixed(1)}% clicks. People read but don't act.`,
          suggestedChange: "Move CTA higher in email body. Make it a button, not a link. Add specific benefit next to CTA.",
          expectedImpact: "Moving CTA above the fold typically increases clicks 40-80%",
          priority: "medium",
          autoApply: false,
        });
      }
    }

    // Flow with enrollments but 0 sent
    if (flow.enrolled >= 5 && flow.sent === 0) {
      actions.push({
        type: "alert_owner",
        target: flow.id,
        targetType: "email_node",
        reason: `Flow "${flow.name}" has ${flow.enrolled} enrollments but 0 emails sent. Email sending may be broken.`,
        suggestedChange: "Check Resend API key in settings. Verify sending domain. Try a test send.",
        expectedImpact: "Fixing this immediately starts sending to all enrolled contacts",
        priority: "critical",
        autoApply: false,
      });
    }
  }

  // ── 3. Check ad variation performance ───────────────────────────────
  const campaigns = await prisma.campaign.findMany({
    where: { userId, status: { in: ["active", "testing"] } },
    include: { adVariations: { select: { id: true, name: true, type: true, status: true, metrics: true } } },
  });

  for (const campaign of campaigns) {
    const activeVariations = campaign.adVariations.filter((v) => v.status === "testing" || v.status === "live");

    for (const variation of activeVariations) {
      const m = (variation.metrics ?? {}) as Record<string, number>;
      const spend = m.spend ?? 0;
      const conversions = m.conversions ?? 0;
      const impressions = m.impressions ?? 0;
      const clicks = m.clicks ?? 0;

      // High spend, zero conversions
      if (spend >= 50 && conversions === 0) {
        actions.push({
          type: "kill_variation",
          target: variation.id,
          targetType: "ad_variation",
          reason: `"${variation.name}" in "${campaign.name}" — $${spend.toFixed(0)} spent, 0 conversions. Burning money.`,
          suggestedChange: "Kill this variation. Redirect budget to better performers.",
          expectedImpact: `Save $${spend.toFixed(0)} in wasted ad spend`,
          priority: "high",
          autoApply: false,
        });
      }

      // Great ROAS — should scale
      const roas = m.roas ?? 0;
      if (roas >= 3 && spend >= 30 && conversions >= 3) {
        actions.push({
          type: "scale_variation",
          target: variation.id,
          targetType: "ad_variation",
          reason: `"${variation.name}" — ${roas.toFixed(1)}x ROAS with ${conversions} conversions. This is a winner.`,
          suggestedChange: "Scale budget 2-3x. Consider duplicating to new audiences.",
          expectedImpact: `At current ROAS, 2x budget ≈ 2x revenue ($${(spend * roas * 2).toFixed(0)})`,
          priority: "high",
          autoApply: false,
        });
      }

      // Good CTR but no conversions — landing page problem
      if (impressions >= 1000 && clicks >= 20 && conversions === 0) {
        const ctr = (clicks / impressions) * 100;
        if (ctr >= 1.5) {
          actions.push({
            type: "rewrite_headline",
            target: campaign.id,
            targetType: "campaign",
            reason: `"${variation.name}" has ${ctr.toFixed(1)}% CTR (good) but 0 conversions. Ad works, landing page doesn't.`,
            suggestedChange: "The ad hook is working but the landing page isn't converting. Check: headline match, CTA visibility, offer clarity, page speed.",
            expectedImpact: "Fixing the landing page with this traffic volume could generate immediate sales",
            priority: "critical",
            autoApply: false,
          });
        }
      }
    }
  }

  // ── 4. Check for stale/abandoned assets ─────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const staleCampaigns = await prisma.campaign.count({
    where: { userId, status: "draft", createdAt: { lte: thirtyDaysAgo } },
  });

  if (staleCampaigns > 0) {
    actions.push({
      type: "alert_owner",
      target: "campaigns",
      targetType: "campaign",
      reason: `${staleCampaigns} campaign${staleCampaigns > 1 ? "s" : ""} still in draft for 30+ days.`,
      suggestedChange: "Either launch them or delete them. Draft campaigns create clutter without value.",
      expectedImpact: "Each launched campaign is a potential revenue stream",
      priority: "medium",
      autoApply: false,
    });
  }

  return {
    scanned: sites.length + flows.length + campaigns.length,
    issuesFound: actions.length,
    actionsProposed: actions.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    }),
    autoApplied: 0,
    timestamp: new Date().toISOString(),
  };
}

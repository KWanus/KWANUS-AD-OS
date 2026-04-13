// ---------------------------------------------------------------------------
// Readiness Check — validates everything BEFORE and AFTER building
//
// BEFORE BUILD: Is the niche viable? Is the user ready? Any blockers?
// AFTER BUILD: Did everything generate? What's missing? What needs fixing?
//
// Prevents: broken payment links, empty ad creatives, dead sites,
// duplicate businesses, email going to spam
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { analyzeUserContext, validateNicheDemand, type UserContext } from "./userIntelligence";

export type ReadinessIssue = {
  severity: "blocker" | "warning" | "info";
  area: "payment" | "email" | "site" | "ads" | "niche" | "tracking" | "legal";
  message: string;
  fix?: string;
  autoFixable: boolean;
};

export type PreBuildCheck = {
  canProceed: boolean;
  issues: ReadinessIssue[];
  userContext: UserContext;
  nicheDemand: { isViable: boolean; reasoning: string; suggestedPivot?: string } | null;
};

export type PostBuildCheck = {
  score: number; // 0-100
  issues: ReadinessIssue[];
  generatedSuccessfully: string[];
  failedToGenerate: string[];
  readyToLaunch: boolean;
};

// ── Pre-Build Check ──────────────────────────────────────────────────────────

export async function runPreBuildCheck(input: {
  text: string;
  entryType: "no_business" | "has_business" | "want_to_scale";
  revenue?: string;
  userId: string;
}): Promise<PreBuildCheck> {
  const issues: ReadinessIssue[] = [];
  const userContext = analyzeUserContext(input);

  // ── Language check ──
  if (userContext.language !== "en") {
    issues.push({
      severity: "warning",
      area: "niche",
      message: `We detected ${userContext.language} language. All content will be generated in English. You can translate after.`,
      autoFixable: false,
    });
  }

  // ── Age check ──
  if (userContext.isMinor) {
    issues.push({
      severity: "warning",
      area: "legal",
      message: "You may be under 18. Some business activities require parental consent. We'll keep things compliant.",
      autoFixable: false,
    });
  }

  // ── Existing platform check ──
  if (userContext.hasExistingPlatform) {
    issues.push({
      severity: "info",
      area: "site",
      message: `We detected you're on ${userContext.existingPlatform}. Himalaya will build a new conversion-optimized site. You can keep your existing store running alongside it.`,
      autoFixable: false,
    });
  }

  // ── Past failure awareness ──
  if (userContext.hasPastFailure) {
    const failureMessages: Record<string, string> = {
      no_traffic: "Last time you had no traffic. This time we're building organic + paid traffic strategies from day 1.",
      no_conversions: "Last time traffic didn't convert. We'll build with proven conversion frameworks and A/B test from the start.",
      too_complex: "Last time it was too complicated. Himalaya handles everything — you just follow the daily commands.",
      budget: "Last time you ran out of budget. We'll start with organic-first strategy (free) and only add paid when proven.",
      bad_product: "Last time the product/service wasn't right. We validate demand before building this time.",
    };
    issues.push({
      severity: "info",
      area: "niche",
      message: failureMessages[userContext.pastFailureReason ?? "unknown"] ?? "We'll learn from what didn't work last time and take a different approach.",
      autoFixable: false,
    });
  }

  // ── Payment readiness ──
  const hasStripe = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "sk_test_REPLACE_ME";
  if (!hasStripe) {
    issues.push({
      severity: "warning",
      area: "payment",
      message: "Stripe is not fully configured. Payment links will be placeholders until Stripe is set up.",
      fix: "Go to Settings → Payments → Connect Stripe",
      autoFixable: false,
    });
  }

  // ── Email readiness ──
  const hasEmail = !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST || process.env.GMAIL_USER);
  if (!hasEmail) {
    issues.push({
      severity: "warning",
      area: "email",
      message: "No email provider configured. Email flows will be created but won't send until configured.",
      fix: "Go to Settings → Email → Configure sending",
      autoFixable: false,
    });
  }

  // ── Niche demand validation ──
  let nicheDemand = null;
  if (input.text.trim() && !userContext.hasNoIdea) {
    nicheDemand = await validateNicheDemand(input.text);
    if (!nicheDemand.isViable) {
      issues.push({
        severity: "warning",
        area: "niche",
        message: `Demand concern: ${nicheDemand.reasoning}`,
        fix: nicheDemand.suggestedPivot ? `Consider: ${nicheDemand.suggestedPivot}` : undefined,
        autoFixable: false,
      });
    }
  }

  // ── Duplicate business check ──
  try {
    const existingRuns = await prisma.analysisRun.count({
      where: { userId: input.userId },
    });
    if (existingRuns > 3) {
      issues.push({
        severity: "info",
        area: "niche",
        message: `You already have ${existingRuns} projects. Each new build creates a separate business. Consider improving an existing one instead.`,
        autoFixable: false,
      });
    }
  } catch { /* non-blocking */ }

  const blockers = issues.filter(i => i.severity === "blocker");
  return {
    canProceed: blockers.length === 0,
    issues,
    userContext,
    nicheDemand,
  };
}

// ── Post-Build Check ─────────────────────────────────────────────────────────

export async function runPostBuildCheck(input: {
  userId: string;
  runId: string;
  campaignId?: string;
  siteId?: string;
  emailFlowId?: string;
}): Promise<PostBuildCheck> {
  const issues: ReadinessIssue[] = [];
  const generated: string[] = [];
  const failed: string[] = [];
  let score = 0;

  // ── Check site ──
  if (input.siteId) {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { published: true, slug: true, totalViews: true },
    });
    if (site) {
      generated.push("Website");
      score += 20;
      if (site.published) {
        generated.push("Site published");
        score += 10;
      } else {
        issues.push({
          severity: "warning",
          area: "site",
          message: "Your site was created but not published yet. It needs to go live for people to find it.",
          fix: "Post-deploy automation should auto-publish. If it didn't, publish manually.",
          autoFixable: true,
        });
      }
    }
  } else {
    failed.push("Website");
    issues.push({ severity: "warning", area: "site", message: "Website generation failed. You can create one manually.", autoFixable: false });
  }

  // ── Check campaign + ads ──
  if (input.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
      include: { adVariations: { select: { id: true, type: true, content: true } } },
    });
    if (campaign) {
      generated.push("Campaign");
      score += 15;

      const hooks = campaign.adVariations.filter(v => v.type === "hook");
      const images = campaign.adVariations.filter(v => {
        const c = v.content as Record<string, unknown>;
        return !!c?.imageBase64;
      });

      if (hooks.length > 0) {
        generated.push(`${hooks.length} ad hooks`);
        score += 10;
      } else {
        failed.push("Ad hooks");
      }

      if (images.length > 0) {
        generated.push(`${images.length} ad images`);
        score += 15;
      } else {
        failed.push("Ad images");
        issues.push({
          severity: "warning",
          area: "ads",
          message: "Ad images failed to generate. Your ads have copy but no visuals.",
          fix: "Go to campaign → Generate Images to retry.",
          autoFixable: true,
        });
      }
    }
  } else {
    failed.push("Campaign");
  }

  // ── Check email flows ──
  if (input.emailFlowId) {
    const flow = await prisma.emailFlow.findUnique({
      where: { id: input.emailFlowId },
      select: { status: true, nodes: true },
    });
    if (flow) {
      generated.push("Email flow");
      score += 15;
      if (flow.status === "active") {
        generated.push("Emails active");
        score += 10;
      } else {
        issues.push({
          severity: "warning",
          area: "email",
          message: "Email flow was created but is not active.",
          autoFixable: true,
        });
      }
    }
  } else {
    failed.push("Email flow");
  }

  // ── Check tracking ──
  if (input.siteId) {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { theme: true },
    });
    const theme = site?.theme as Record<string, unknown> | null;
    if (theme?.hasTracking) {
      generated.push("Analytics tracking");
      score += 5;
    }
  }

  return {
    score: Math.min(score, 100),
    issues,
    generatedSuccessfully: generated,
    failedToGenerate: failed,
    readyToLaunch: score >= 50 && issues.filter(i => i.severity === "blocker").length === 0,
  };
}

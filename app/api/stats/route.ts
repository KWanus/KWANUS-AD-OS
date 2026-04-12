import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ARCHETYPES, type BusinessType, type SystemSlug } from "@/lib/archetypes";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

function detectLiveSystems(counts: {
  campaigns: number;
  sites: number;
  leads: number;
  emailFlows: number;
  clients: number;
}) {
  const live = new Set<string>();

  if (counts.sites > 0) {
    live.add("website");
    live.add("product_page");
    live.add("bridge_page");
  }
  if (counts.campaigns > 0) {
    live.add("google_ads");
    live.add("facebook_ads");
    live.add("tiktok_ads");
    live.add("upsell_flow");
  }
  if (counts.emailFlows > 0) {
    live.add("email_sequence");
    live.add("sms_followup");
    live.add("abandoned_cart");
  }
  if (counts.clients > 0) {
    live.add("crm_pipeline");
    live.add("proposal_system");
    live.add("white_label_reports");
  }
  if (counts.leads > 0) {
    live.add("lead_magnet");
    live.add("booking_flow");
    live.add("review_system");
  }

  return Array.from(live);
}

function computeSystemScore(businessType: BusinessType | null, activeSystems: string[]): number {
  if (!businessType || !ARCHETYPES[businessType]) return Math.min(activeSystems.length * 10, 100);

  const systemMap = new Map(ARCHETYPES[businessType].systems.map((system) => [system.slug, system.priority]));
  let score = 0;
  for (const slug of activeSystems) {
    const priority = systemMap.get(slug as SystemSlug);
    if (priority === "essential") score += 18;
    else if (priority === "recommended") score += 10;
    else if (priority === "optional") score += 5;
    else score += 4;
  }
  return Math.min(score, 100);
}

function getOsVerdict(input: {
  effectiveSystemScore: number;
  unsyncedSystems: string[];
  missingCoreSystems: string[];
  recommendationAgeMs: number | null;
}) {
  const { effectiveSystemScore, unsyncedSystems, missingCoreSystems, recommendationAgeMs } = input;
  const recommendationIsStale = recommendationAgeMs !== null && recommendationAgeMs > 1000 * 60 * 60 * 24 * 7;

  if (unsyncedSystems.length > 0) {
    return {
      status: "repair",
      label: "Needs Repair",
      reason: "Live workspace systems have drifted ahead of the Business OS profile.",
      recommendationIsStale,
    };
  }

  if (missingCoreSystems.length > 0 || effectiveSystemScore < 45) {
    return {
      status: "attention",
      label: "Needs Attention",
      reason: "Core systems are still missing or not strong enough to support consistent execution.",
      recommendationIsStale,
    };
  }

  if (recommendationIsStale) {
    return {
      status: "stale",
      label: "Refresh Soon",
      reason: "The system is functional, but the recommendation layer is getting old.",
      recommendationIsStale,
    };
  }

  return {
    status: "healthy",
    label: "Healthy",
    reason: "Strategy, execution, and recommendation freshness are aligned.",
    recommendationIsStale,
  };
}

/**
 * GET /api/stats — user dashboard stats
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ ok: true, stats: null });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: true, stats: null });
    }

    const [
      campaignCount,
      variationCount,
      emailCount,
      activeCampaigns,
      winnerVariations,
      siteCount,
      publishedSites,
      leadCount,
      emailFlowCount,
      activeFlowCount,
      clientCount,
      atRiskClientCount,
      analysisCount,
    ] = await Promise.all([
      prisma.campaign.count({ where: { userId: user.id } }),
      prisma.adVariation.count({ where: { campaign: { userId: user.id } } }),
      prisma.emailDraft.count({ where: { campaign: { userId: user.id } } }),
      prisma.campaign.count({ where: { userId: user.id, status: { in: ["active", "testing", "scaling"] } } }),
      prisma.adVariation.count({ where: { campaign: { userId: user.id }, status: "winner" } }),
      prisma.site.count({ where: { userId: user.id } }),
      prisma.site.count({ where: { userId: user.id, published: true } }),
      prisma.lead.count({ where: { userId: user.id } }),
      prisma.emailFlow.count({ where: { userId: user.id } }),
      prisma.emailFlow.count({ where: { userId: user.id, status: "active" } }),
      prisma.client.count({ where: { userId: user.id } }),
      prisma.client.count({ where: { userId: user.id, healthStatus: "red" } }),
      prisma.analysisRun.count({ where: { userId: user.id } }),
    ]);

    let businessProfile: any = null;
    try {
      businessProfile = await prisma.businessProfile.findUnique({
        where: { userId: user.id },
        select: {
          businessType: true,
          niche: true,
          mainGoal: true,
          stage: true,
          systemScore: true,
          activeSystems: true,
          recommendedAt: true,
          recommendedSystems: true,
        },
      });
    } catch (e) {
      console.error("Non-fatal: Could not fetch business profile for stats:", e);
    }

    const activeSystems = Array.isArray(businessProfile?.activeSystems)
      ? businessProfile.activeSystems.filter((item: any): item is string => typeof item === "string")
      : [];
    const liveSystems = detectLiveSystems({
      campaigns: campaignCount,
      sites: siteCount,
      leads: leadCount,
      emailFlows: emailFlowCount,
      clients: clientCount,
    });
    const missingCoreSystems = ["website", "email_sequence", "crm_pipeline"].filter((slug) => !activeSystems.includes(slug));
    const unsyncedSystems = liveSystems.filter((slug) => !activeSystems.includes(slug));
    const effectiveSystems = Array.from(new Set([...activeSystems, ...liveSystems]));
    const effectiveSystemScore = computeSystemScore(
      (businessProfile?.businessType as BusinessType | null | undefined) ?? null,
      effectiveSystems,
    );
    const recommendationAgeMs = businessProfile?.recommendedAt
      ? Date.now() - new Date(businessProfile.recommendedAt as unknown as string).getTime()
      : null;
    const osVerdict = getOsVerdict({
      effectiveSystemScore,
      unsyncedSystems,
      missingCoreSystems,
      recommendationAgeMs,
    });

    return NextResponse.json({
      ok: true,
      stats: {
        campaigns: campaignCount,
        variations: variationCount,
        emails: emailCount,
        activeCampaigns,
        winners: winnerVariations,
        sites: siteCount,
        publishedSites,
        leads: leadCount,
        emailFlows: emailFlowCount,
        activeFlows: activeFlowCount,
        clients: clientCount,
        atRiskClients: atRiskClientCount,
        analyses: analysisCount,
        systemScore: businessProfile?.systemScore ?? 0,
        effectiveSystemScore,
        businessType: businessProfile?.businessType ?? null,
        niche: businessProfile?.niche ?? null,
        mainGoal: businessProfile?.mainGoal ?? null,
        stage: businessProfile?.stage ?? null,
        activeSystemsCount: activeSystems.length,
        effectiveSystemsCount: effectiveSystems.length,
        liveSystems,
        unsyncedSystems,
        missingCoreSystems,
        recommendationAgeMs,
        osVerdict,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({
        ok: true,
        stats: {
          campaigns: 0,
          variations: 0,
          emails: 0,
          activeCampaigns: 0,
          winners: 0,
          sites: 0,
          publishedSites: 0,
          leads: 0,
          emailFlows: 0,
          activeFlows: 0,
          clients: 0,
          systemScore: 0,
          effectiveSystemScore: 0,
          businessType: null,
          niche: null,
          mainGoal: null,
          stage: null,
          activeSystemsCount: 0,
          effectiveSystemsCount: 0,
          liveSystems: [],
          unsyncedSystems: [],
          missingCoreSystems: ["website", "email_sequence", "crm_pipeline"],
          recommendationAgeMs: null,
          osVerdict: {
            status: "attention",
            label: "Needs Attention",
            reason: "The live app is running, but database-backed workspace data is temporarily unavailable.",
            recommendationIsStale: false,
          },
          databaseUnavailable: true,
        },
      });
    }
    return NextResponse.json({ ok: false, error: "Failed to load stats" }, { status: 500 });
  }
}

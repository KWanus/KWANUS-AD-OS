import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ARCHETYPES, type BusinessType, type SystemSlug } from "@/lib/archetypes";
import { buildFallbackRecommendation } from "@/lib/archetypes/recommendation";

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

export async function POST() {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const [
      profile,
      campaignCount,
      siteCount,
      leadCount,
      emailFlowCount,
      clientCount,
    ] = await Promise.all([
      prisma.businessProfile.findUnique({ where: { userId: user.id } }),
      prisma.campaign.count({ where: { userId: user.id } }),
      prisma.site.count({ where: { userId: user.id } }),
      prisma.lead.count({ where: { userId: user.id } }),
      prisma.emailFlow.count({ where: { userId: user.id } }),
      prisma.client.count({ where: { userId: user.id } }),
    ]);

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Business profile not found" }, { status: 404 });
    }

    const liveSystems = detectLiveSystems({
      campaigns: campaignCount,
      sites: siteCount,
      leads: leadCount,
      emailFlows: emailFlowCount,
      clients: clientCount,
    });

    const currentSystems = Array.isArray(profile.activeSystems)
      ? profile.activeSystems.filter((item): item is string => typeof item === "string")
      : [];

    const mergedSystems = Array.from(new Set([...currentSystems, ...liveSystems]));
    const nextScore = computeSystemScore((profile.businessType as BusinessType | null | undefined) ?? null, mergedSystems);
    const nextRecommendation = buildFallbackRecommendation(
      profile.businessType as BusinessType,
      profile.niche ?? "",
      profile.mainGoal ?? "more_leads",
      profile.stage ?? "starting",
    );

    const updatedProfile = await prisma.businessProfile.update({
      where: { userId: user.id },
      data: {
        activeSystems: mergedSystems,
        systemScore: nextScore,
        recommendedSystems: nextRecommendation as Prisma.InputJsonValue,
        recommendedAt: new Date(),
        setupCompleted: true,
      },
    });

    return NextResponse.json({
      ok: true,
      profile: updatedProfile,
      syncedSystems: liveSystems.filter((slug) => !currentSystems.includes(slug)),
      activeSystems: mergedSystems,
      recommendation: nextRecommendation,
    });
  } catch (error) {
    console.error("Business profile sync:", error);
    return NextResponse.json({ ok: false, error: "Failed to sync business profile" }, { status: 500 });
  }
}

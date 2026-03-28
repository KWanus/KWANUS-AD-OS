import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runSkill } from "@/lib/skills/executor";
import { getSkill } from "@/lib/skills/registry";
import { prisma } from "@/lib/prisma";
import { runWebsiteBuilderScout } from "@/lib/skills/websiteBuilderScout";
import { runAdCampaignSkill } from "@/lib/skills/adCampaignSkill";
import { runEmailCampaignSkill } from "@/lib/skills/emailCampaignSkill";

// Slugs handled by the analysis-pipeline executor (not Claude AI executor)
const PIPELINE_SKILLS = new Set(["website-builder-scout", "ad-campaign", "email-campaign"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const skill = getSkill(slug);
    if (!skill) return NextResponse.json({ ok: false, error: "Skill not found" }, { status: 404 });

    // Check credits
    if (user.credits < skill.credits) {
      return NextResponse.json(
        { ok: false, error: `Not enough credits. This skill costs ${skill.credits} credits.` },
        { status: 402 }
      );
    }

    const input = await req.json() as Record<string, string>;
    const executionTier = input.executionTier === "core" ? "core" : "elite";
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const enrichedInput: Record<string, string> = {
      ...input,
      executionTier,
      ...(profile?.businessName && !input.business_name ? { business_name: profile.businessName } : {}),
      ...(profile?.businessName && !input.businessName ? { businessName: profile.businessName } : {}),
      ...(profile?.mainOffer && !input.offer ? { offer: profile.mainOffer } : {}),
      ...(profile?.targetAudience && !input.audience ? { audience: profile.targetAudience } : {}),
      ...(profile?.location && !input.location ? { location: profile.location } : {}),
      ...(profile?.niche && !input.niche ? { niche: profile.niche } : {}),
    };

    // Validate required fields
    for (const field of skill.inputs.filter((f) => f.required)) {
      if (!enrichedInput[field.key]?.trim()) {
        return NextResponse.json(
          { ok: false, error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: skill.credits } },
    });

    // Run the skill — pipeline skills use the analysis engine, others use the AI executor
    let result;
    if (PIPELINE_SKILLS.has(slug)) {
      if (slug === "website-builder-scout") {
        result = await runWebsiteBuilderScout({ url: enrichedInput.url, businessName: enrichedInput.businessName, niche: enrichedInput.niche, outreachGoal: enrichedInput.outreachGoal, userId: user.id });
      } else if (slug === "ad-campaign") {
        result = await runAdCampaignSkill({ url: enrichedInput.url, mode: enrichedInput.mode as "operator" | "consultant" | "saas" | undefined, platform: enrichedInput.platform, campaignName: enrichedInput.campaignName, userId: user.id });
      } else {
        result = await runEmailCampaignSkill({ url: enrichedInput.url, flowType: enrichedInput.flowType, listGoal: enrichedInput.listGoal, tone: enrichedInput.tone, userId: user.id });
      }
    } else {
      result = await runSkill(slug, user.id, enrichedInput);
    }

    if (!result.ok) {
      // Refund credits on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: skill.credits } },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Skill run error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

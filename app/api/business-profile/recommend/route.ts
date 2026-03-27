import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Prisma } from "@prisma/client";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ARCHETYPES, type BusinessType } from "@/lib/archetypes";
import { buildFallbackRecommendation, type Recommendation } from "@/lib/archetypes/recommendation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type RecommendBody = {
  businessType?: BusinessType;
  niche?: string;
  goal?: string;
  stage?: string;
};

function parseJsonObject<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as RecommendBody;
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

    const businessType = body.businessType ?? (profile?.businessType as BusinessType | undefined);
    if (!businessType || !(businessType in ARCHETYPES)) {
      return NextResponse.json({ ok: false, error: "Valid business type is required" }, { status: 400 });
    }

    const niche = body.niche ?? profile?.niche ?? "";
    const goal = body.goal ?? profile?.mainGoal ?? "more_leads";
    const stage = body.stage ?? profile?.stage ?? "starting";
    const archetype = ARCHETYPES[businessType];
    const archetypeSummary = {
      label: archetype.label,
      acquisitionModel: archetype.acquisitionModel,
      salesProcess: archetype.salesProcess,
      funnelType: archetype.funnelType,
      decisionWindow: archetype.decisionWindow,
      trustRequirements: archetype.trustRequirements,
      conversionTriggers: archetype.conversionTriggers,
      topObjections: archetype.topObjections,
      winningAngles: archetype.winningAngles,
      systems: archetype.systems,
    };

    let recommendation = buildFallbackRecommendation(businessType, niche, goal, stage);

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const prompt = `You are a world-class business strategist. Based on this business profile:
- Business Type: ${businessType} - ${archetype.label}
- Niche: ${niche || "not specified"}
- Goal: ${goal}
- Stage: ${stage}
- Archetype: ${JSON.stringify(archetypeSummary)}

Generate a personalized recommended system that includes:
1. A one-sentence strategic summary specific to their exact situation
2. Priority order for their systems (reorder the archetype systems based on their specific goal and stage)
3. For each system: personalized reason why it matters for THEIR specific niche
4. The single most important first action (what to do TODAY)
5. 90-day milestone targets for their specific business type and stage

Return as JSON:
{
  "strategicSummary": "",
  "firstAction": "",
  "milestones": { "day30": "", "day60": "", "day90": "" },
  "prioritizedSystems": [
    { "slug": "", "personalizedReason": "", "priority": "", "estimatedImpact": "" }
  ]
}`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1400,
          messages: [{ role: "user", content: prompt }],
        });

        const text = response.content.find((item) => item.type === "text");
        const parsed = text && text.type === "text" ? parseJsonObject<Recommendation>(text.text) : null;
        if (parsed?.strategicSummary && Array.isArray(parsed.prioritizedSystems)) {
          recommendation = parsed;
        }
      } catch (error) {
        console.error("Business profile recommend AI fallback:", error);
      }
    }

    const saved = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        businessType,
        niche: niche || null,
        mainGoal: goal,
        stage,
        recommendedSystems: recommendation as Prisma.InputJsonValue,
        recommendedAt: new Date(),
      },
      update: {
        businessType,
        niche: niche || null,
        mainGoal: goal,
        stage,
        recommendedSystems: recommendation as Prisma.InputJsonValue,
        recommendedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, recommendation, profileId: saved.id });
  } catch (error) {
    console.error("Business profile recommend POST:", error);
    return NextResponse.json({ ok: false, error: "Failed to generate recommendation" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { generateAdHooks } from "@/src/logic/ad-os/generateAdHooks";
import { generateAdScripts } from "@/src/logic/ad-os/generateAdScripts";
import { generateAdBriefs } from "@/src/logic/ad-os/generateAdBriefs";
import { generateLandingPage } from "@/src/logic/ad-os/generateLandingPage";
import { generateEmailSequences } from "@/src/logic/ad-os/generateEmailSequences";
import { generateExecutionChecklist } from "@/src/logic/ad-os/generateExecutionChecklist";
import type { DecisionPacket } from "@/src/logic/ad-os/buildDecisionPacket";
import type { OpportunityPacket } from "@/src/logic/ad-os/buildOpportunityPacket";
import type { AnalysisMode } from "@/src/logic/ad-os/normalizeInput";

const VALID_TARGETS = [
  "adHooks", "adScripts", "adBriefs", "landingPage", "emailSequences", "executionChecklist",
] as const;
type RegenerateTarget = (typeof VALID_TARGETS)[number];

const TARGET_PROMPTS: Record<string, string> = {
  adHooks: "Generate 5 fresh ad hooks/marketing angles. Each must have a 'format' (platform) and 'hook' (the text). Return JSON array: [{\"format\":\"platform\",\"hook\":\"text\"}]",
  adScripts: "Generate 3 short-form video ad scripts. Each has title, duration, and sections with timestamp/direction/copy. Return JSON array.",
  landingPage: "Generate a complete landing page structure with headline, subheadline, heroCtaText, sections array, trustElements array, and urgencyLine. Return JSON object.",
  emailSequences: "Generate a 5-email welcome sequence. Each email has subject, preview, body, timing. Return JSON object: {\"welcome\":[{\"subject\":\"\",\"preview\":\"\",\"body\":\"\",\"timing\":\"\"}]}",
};

async function regenerateWithClaude(
  target: RegenerateTarget,
  context: { niche: string; audience: string; angle: string; competitors: string },
): Promise<unknown | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !TARGET_PROMPTS[target]) return null;

  const anthropic = new Anthropic({ apiKey });

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are a top marketing strategist. ${TARGET_PROMPTS[target]}

Context:
- Niche: ${context.niche}
- Target audience: ${context.audience}
- Positioning angle: ${context.angle}
- Competitor weaknesses: ${context.competitors}

Make everything specific to this exact niche. Reference competitor weaknesses and position against them. No generic advice.

Return ONLY raw JSON, no markdown.`,
      }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text : "";
    const match = text.match(/[\[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]);
  } catch (err) {
    console.error("[Regenerate] Claude failed:", err);
  }
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { target?: string };
    const target = body.target as RegenerateTarget;

    if (!target || !VALID_TARGETS.includes(target)) {
      return NextResponse.json({ ok: false, error: `Invalid target. Valid: ${VALID_TARGETS.join(", ")}` }, { status: 400 });
    }

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
      include: { opportunityAssessments: true, assetPackages: true },
    });

    if (!analysis) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const packet = analysis.decisionPacket as unknown as DecisionPacket | null;
    if (!packet) return NextResponse.json({ ok: false, error: "No decision packet" }, { status: 400 });

    const opp = analysis.opportunityAssessments[0];
    const mode = analysis.mode as AnalysisMode;
    const rawSignals = (analysis.rawSignals ?? {}) as Record<string, unknown>;
    const intel = rawSignals.nicheIntelligence as Record<string, unknown> | undefined;

    // Try Claude-powered regeneration first (if we have intel context)
    let regenerated: Record<string, unknown> = {};
    const competitors = intel?.competitors as { weaknesses: string[] }[] | undefined;
    const competitorContext = competitors?.flatMap(c => c.weaknesses).slice(0, 5).join("; ") ?? "";

    const claudeResult = await regenerateWithClaude(target, {
      niche: (intel?.niche as string) ?? packet.audience ?? "",
      audience: packet.audience ?? "",
      angle: packet.angle ?? "",
      competitors: competitorContext,
    });

    if (claudeResult) {
      regenerated = { [target]: claudeResult };
    } else {
      // Fallback to deterministic generators
      const opportunityPacket: OpportunityPacket | null = opp
        ? {
            status: opp.status,
            totalScore: opp.totalScore ?? 0,
            dimensionScores: {
              demandPotential: opp.demandPotential ?? 0,
              offerStrength: opp.offerStrength ?? 0,
              emotionalLeverage: opp.emotionalLeverage ?? 0,
              trustCredibility: opp.trustCredibility ?? 0,
              conversionReadiness: opp.conversionReadiness ?? 0,
              adViability: opp.adViability ?? 0,
              emailLifecyclePotential: opp.emailLifecyclePotential ?? 0,
              seoPotential: opp.seoPotential ?? 0,
              differentiation: opp.differentiation ?? 0,
              risk: opp.risk ?? 0,
            },
            topGaps: (opp.topGaps ?? []) as string[],
            topStrengths: (opp.topStrengths ?? []) as string[],
            recommendedPath: opp.recommendedPath ?? "",
            priorityActions: [], whyCouldWin: "", whyCouldFail: "", recommendedBlocks: [],
          }
        : null;

      switch (target) {
        case "adHooks": regenerated = { adHooks: generateAdHooks(packet, mode) }; break;
        case "adScripts": regenerated = { adScripts: generateAdScripts(packet, mode) }; break;
        case "adBriefs": regenerated = { adBriefs: generateAdBriefs(packet, mode) }; break;
        case "landingPage":
          if (!opportunityPacket) return NextResponse.json({ ok: false, error: "Opportunity data required" }, { status: 400 });
          regenerated = { landingPage: generateLandingPage(packet, opportunityPacket, mode) }; break;
        case "emailSequences": regenerated = { emailSequences: generateEmailSequences(packet, mode) }; break;
        case "executionChecklist":
          if (!opportunityPacket) return NextResponse.json({ ok: false, error: "Opportunity data required" }, { status: 400 });
          regenerated = { executionChecklist: generateExecutionChecklist(opportunityPacket, mode) }; break;
      }
    }

    // Save
    const existingAsset = analysis.assetPackages[0];
    if (existingAsset) {
      await prisma.assetPackage.update({
        where: { id: existingAsset.id },
        data: regenerated,
      });
    }

    return NextResponse.json({ ok: true, target, regenerated });
  } catch (err) {
    console.error("Regenerate error:", err);
    return NextResponse.json({ ok: false, error: "Regeneration failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateConversionSiteBlueprint,
  renderBlueprintToBlocks,
  buildSiteInputFromScratch,
} from "@/lib/sites/conversionEngine";
import type { SiteInput } from "@/lib/sites/conversionEngine";
import type { NicheIntelligence } from "@/lib/sites/competitorResearch";
import { enrichPromptWithResearch, deriveTemplateFromResearch, buildResearchEnrichedSections } from "@/lib/sites/researchInformedGeneration";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    researchId: string;
    businessName: string;
    location?: string;
    executionTier?: "core" | "elite";
    tone?: string;
    notes?: string;
  };

  if (!body.researchId || !body.businessName?.trim()) {
    return NextResponse.json(
      { ok: false, error: "researchId and businessName are required" },
      { status: 400 }
    );
  }

  const research = await prisma.nicheResearch.findFirst({
    where: { id: body.researchId, userId: user.id },
  });

  if (!research) {
    return NextResponse.json({ ok: false, error: "Research not found" }, { status: 404 });
  }

  const intelligence = research.intelligence as unknown as NicheIntelligence;
  const suggestedSections = buildResearchEnrichedSections(intelligence);
  const templateType = deriveTemplateFromResearch(intelligence);

  const siteInput: SiteInput = buildSiteInputFromScratch({
    businessName: body.businessName.trim(),
    niche: research.niche,
    location: body.location?.trim() ?? "",
    executionTier: body.executionTier ?? "elite",
  });

  siteInput.notes = body.notes
    ? enrichPromptWithResearch(body.notes, intelligence)
    : enrichPromptWithResearch(
        `Generate a high-converting website for ${body.businessName} in the ${research.niche} niche. Use ${suggestedSections.join(", ")} sections. Template style: ${templateType}.`,
        intelligence
      );

  if (body.tone) siteInput.tone = body.tone;

  try {
    const { blueprint } = await generateConversionSiteBlueprint(siteInput);
    const blocks = renderBlueprintToBlocks(blueprint, { elevateVisuals: true });

    return NextResponse.json({
      ok: true,
      blueprint,
      blocks,
      meta: {
        researchId: research.id,
        templateType,
        suggestedSections,
        competitorsAnalyzed: intelligence.competitorsScanned,
      },
    });
  } catch (err) {
    console.error("Research-informed generation failed:", err);
    return NextResponse.json(
      { ok: false, error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}

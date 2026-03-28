import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildSiteInputFromScratch,
  createSiteFromBlueprint,
  generateConversionSiteBlueprint,
  type SiteGenerationMetadata,
} from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      businessName?: string;
      niche?: string;
      location?: string;
      executionTier?: "core" | "elite";
      tone?: string;
      notes?: string;
    };
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

    const siteInput = buildSiteInputFromScratch({
      businessName: body.businessName ?? profile?.businessName ?? user.workspaceName ?? "",
      niche: body.niche ?? profile?.niche ?? user.businessType ?? "",
      location: body.location ?? profile?.location ?? "",
      executionTier: body.executionTier ?? "elite",
      tone: body.tone,
      notes: [body.notes, profile?.mainOffer ? `Main offer: ${profile.mainOffer}` : null, profile?.targetAudience ? `Target audience: ${profile.targetAudience}` : null]
        .filter(Boolean)
        .join("\n"),
    });

    const generated = await generateConversionSiteBlueprint(siteInput);
    const generationMetadata: SiteGenerationMetadata = {
      sourceMode: "from_scratch",
      executionTier: siteInput.executionTier,
      businessName: siteInput.businessName,
      niche: siteInput.niche,
      location: siteInput.location,
      templateId: generated.blueprint.template_id,
      pageType: generated.blueprint.page_type,
      blueprintScore: generated.blueprint.score,
      conversionNotes: generated.blueprint.conversion_notes,
      generationTrace: generated.blueprint.generation_trace,
    };
    const created = await createSiteFromBlueprint({
      userId: user.id,
      siteName: `${siteInput.businessName} Launch Site`,
      description: `Conversion-first site generated from scratch for ${siteInput.niche} in ${siteInput.location}`,
      blueprint: generated.blueprint,
      generationMetadata,
    });

    return NextResponse.json({
      ok: true,
      site: created.site,
      blueprint: created.blueprint,
    });
  } catch (error) {
    console.error("Site generate route failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate site" },
      { status: 500 }
    );
  }
}

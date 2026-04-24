// ---------------------------------------------------------------------------
// POST /api/ads/creatives
// Generate a complete ad creative package — 20+ creatives across 5 angles
// + 7 organic posts + budget recommendation + launch plan
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateCreativePackage, generateCreativeImages, saveCreativePackage, type AdBrief } from "@/lib/ads/creativeEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as Partial<AdBrief> & { campaignId?: string; generateImages?: boolean };

    const brief: AdBrief = {
      businessName: body.businessName ?? "My Business",
      niche: body.niche ?? "business",
      targetAudience: body.targetAudience ?? "potential customers",
      painPoints: body.painPoints ?? ["wasting time", "not seeing results"],
      offer: body.offer ?? "a better way",
      uniqueAngle: body.uniqueAngle ?? "proven system",
      brandColor: body.brandColor ?? "#f5a623",
      tone: body.tone ?? "bold",
      landingUrl: body.landingUrl,
      existingWinners: body.existingWinners,
    };

    // Generate the full package
    let pkg = await generateCreativePackage(brief);

    // Generate images if requested (costs fal.ai credits)
    if (body.generateImages !== false) {
      pkg = { ...pkg, creatives: await generateCreativeImages(pkg.creatives, user.id) };
    }

    // Save to campaign if provided
    if (body.campaignId) {
      await saveCreativePackage(user.id, body.campaignId, pkg);
    }

    return NextResponse.json({
      ok: true,
      creativeCount: pkg.creatives.length,
      organicPostCount: pkg.organicPosts.length,
      budget: pkg.recommendedBudget,
      launchPlan: pkg.launchPlan,
      creatives: pkg.creatives.map(c => ({
        id: c.id,
        platform: c.platform,
        format: c.format,
        angle: c.metadata.angle,
        hook: c.copy.hook,
        body: c.copy.body,
        cta: c.copy.cta,
        estimatedCtr: c.metadata.estimatedCtr,
        hasImage: !!c.visual.imageBase64,
        aspectRatio: c.visual.aspectRatio,
      })),
      organicPosts: pkg.organicPosts,
    });
  } catch (err) {
    console.error("Creative generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate creatives" }, { status: 500 });
  }
}

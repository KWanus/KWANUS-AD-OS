import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/analyses/[id]/create-campaign
 * Create a campaign directly from a scan analysis, pre-populated with the scan's asset package.
 */
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

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
      include: {
        assetPackages: { take: 1 },
      },
    });

    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Analysis not found" }, { status: 404 });
    }

    const body = await req.json() as {
      name?: string;
      mode?: string;
    };

    const name = body.name?.trim() || `Campaign: ${analysis.title ?? analysis.inputUrl}`;

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name,
        mode: body.mode ?? analysis.mode,
        status: "draft",
        productName: analysis.title,
        productUrl: analysis.inputUrl,
        analysisRunId: analysis.id,
        sourceUrl: analysis.inputUrl,
        sourceType: "url",
      },
    });

    // If there's an asset package, populate the campaign with it
    const assets = analysis.assetPackages[0];
    if (assets) {
      const adHooks = (assets.adHooks ?? []) as { format: string; hook: string }[];
      const adScripts = (assets.adScripts ?? []) as { title: string; [k: string]: unknown }[];
      const adBriefs = (assets.adBriefs ?? []) as { title: string; [k: string]: unknown }[];

      if (adHooks.length > 0) {
        await prisma.adVariation.createMany({
          data: adHooks.map((h, i) => ({
            campaignId: campaign.id,
            name: h.format,
            type: "hook",
            content: h as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }

      if (adScripts.length > 0) {
        await prisma.adVariation.createMany({
          data: adScripts.map((s, i) => ({
            campaignId: campaign.id,
            name: s.title,
            type: "script",
            content: s as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }

      if (adBriefs.length > 0) {
        await prisma.adVariation.createMany({
          data: adBriefs.map((b, i) => ({
            campaignId: campaign.id,
            name: b.title,
            type: "brief",
            content: b as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }

      const landingPage = assets.landingPage as Record<string, unknown> | null;
      if (landingPage) {
        await prisma.landingDraft.create({
          data: {
            campaignId: campaign.id,
            headline: (landingPage.headline as string) ?? undefined,
            subheadline: (landingPage.subheadline as string) ?? undefined,
            trustBar: landingPage.trustBar as object ?? undefined,
            bullets: landingPage.benefitBullets as object ?? undefined,
            socialProof: (landingPage.socialProofGuidance as string) ?? undefined,
            guarantee: (landingPage.guaranteeText as string) ?? undefined,
            faqItems: landingPage.faqItems as object ?? undefined,
            ctaCopy: (landingPage.ctaCopy as string) ?? undefined,
            urgencyLine: (landingPage.urgencyLine as string) ?? undefined,
            status: "draft",
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      campaign: { id: campaign.id, name: campaign.name },
      assetsLoaded: !!assets,
    });
  } catch (err) {
    console.error("Analysis to campaign:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

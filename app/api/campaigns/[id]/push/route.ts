// ---------------------------------------------------------------------------
// POST /api/campaigns/[id]/push
// Push campaign variations to an ad platform (Meta, TikTok, Google)
// Creates campaign + ad set + creatives on the platform — starts PAUSED
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { pushToMeta, pushToTikTok } from "@/lib/integrations/adPlatforms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json() as { platform: "meta" | "tiktok" | "google" };

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: { adVariations: true },
    });

    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metaPixelId: true, tiktokPixelId: true, googleAdsId: true },
    });

    // Get the site URL for ad landing page
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { campaignId: id, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    let landingUrl = campaign.productUrl ?? "";
    if (deployment?.siteId) {
      const site = await prisma.site.findUnique({ where: { id: deployment.siteId } });
      if (site?.published) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
        landingUrl = `${appUrl}/s/${site.slug}`;
      }
    }

    // Build creatives from variations
    const hooks = campaign.adVariations.filter((v) => v.type === "hook");
    const creatives = hooks.map((v) => {
      const c = v.content as Record<string, unknown>;
      return {
        name: v.name,
        headline: String(c.hook ?? "").slice(0, 100),
        body: String(c.hook ?? ""),
        ctaText: "Learn More",
        linkUrl: landingUrl,
        imageBase64: (c.imageBase64 as string) ?? undefined,
        platform: (body.platform === "tiktok" ? "meta" : body.platform) as "meta" | "google",
        text: String(c.hook ?? ""),
        landingUrl,
      };
    });

    if (creatives.length === 0) {
      return NextResponse.json({ ok: false, error: "No ad variations to push. Generate hooks first." }, { status: 400 });
    }

    if (body.platform === "meta") {
      if (!dbUser?.metaPixelId) {
        return NextResponse.json({ ok: false, error: "Connect Meta in Settings first (add your Meta Pixel ID)" }, { status: 400 });
      }

      // Note: Meta push requires an access token from OAuth, not just pixel ID
      // For now, we'll use the pixel ID as the account indicator
      // Full OAuth flow would be a separate integration
      const result = await pushToMeta({
        accountId: dbUser.metaPixelId,
        accessToken: "", // Requires Meta Business OAuth — placeholder
        campaignName: campaign.name,
        creatives,
        linkUrl: landingUrl,
      });

      if (!result.ok && result.error?.includes("access_token")) {
        return NextResponse.json({
          ok: false,
          error: "Meta Ads requires OAuth authentication. For now, copy your ad content from the campaign and paste it into Meta Ads Manager directly.",
        }, { status: 400 });
      }

      return NextResponse.json({ ok: result.ok, campaignId: result.campaignId, error: result.error });
    }

    if (body.platform === "tiktok") {
      if (!dbUser?.tiktokPixelId) {
        return NextResponse.json({ ok: false, error: "Connect TikTok in Settings first (add your TikTok Pixel ID)" }, { status: 400 });
      }

      const result = await pushToTikTok({
        advertiserId: dbUser.tiktokPixelId,
        accessToken: "", // Requires TikTok Ads OAuth — placeholder
        campaignName: campaign.name,
        creatives: creatives.map((c) => ({
          text: c.body,
          imageBase64: c.imageBase64,
          landingUrl: c.linkUrl,
        })),
      });

      if (!result.ok && result.error?.includes("access_token")) {
        return NextResponse.json({
          ok: false,
          error: "TikTok Ads requires OAuth authentication. For now, copy your ad content and paste it into TikTok Ads Manager directly.",
        }, { status: 400 });
      }

      return NextResponse.json({ ok: result.ok, campaignId: result.campaignId, error: result.error });
    }

    if (body.platform === "google") {
      return NextResponse.json({
        ok: false,
        error: "Google Ads push requires OAuth setup. Copy your ad content from the campaign and paste it into Google Ads directly.",
      }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Unknown platform" }, { status: 400 });
  } catch (err) {
    console.error("Campaign push error:", err);
    return NextResponse.json({ ok: false, error: "Push failed" }, { status: 500 });
  }
}

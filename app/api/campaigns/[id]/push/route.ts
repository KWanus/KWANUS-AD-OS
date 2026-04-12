// ---------------------------------------------------------------------------
// POST /api/campaigns/[id]/push
// Push campaign variations to an ad platform (Meta, TikTok, Google)
// Creates campaign + ad set + creatives on the platform — starts PAUSED
// Now uses real OAuth tokens from the user's connected accounts
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { pushToMeta, pushToTikTok } from "@/lib/integrations/adPlatforms";
import { getTokens } from "@/lib/integrations/oauth";
import { getSitePublicUrl } from "@/lib/integrations/siteDeployer";

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
      const site = await prisma.site.findUnique({ where: { id: deployment.siteId }, select: { slug: true, customDomain: true, published: true } });
      if (site?.published) {
        landingUrl = getSitePublicUrl(site.slug, site.customDomain);
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

    // ── Meta Ads ──────────────────────────────────────────────────────────────
    if (body.platform === "meta") {
      if (!dbUser?.metaPixelId) {
        return NextResponse.json({ ok: false, error: "Connect Meta in Settings first (Settings → Ad Accounts → Connect Meta)" }, { status: 400 });
      }

      // Get real OAuth tokens
      const tokens = await getTokens(user.id, "meta");
      if (!tokens?.accessToken) {
        return NextResponse.json({
          ok: false,
          error: "Meta OAuth not connected. Go to Settings → Ad Accounts → Connect Meta to authorize ad creation.",
        }, { status: 400 });
      }

      const result = await pushToMeta({
        accountId: dbUser.metaPixelId,
        accessToken: tokens.accessToken,
        campaignName: campaign.name,
        creatives,
        linkUrl: landingUrl,
      });

      if (result.ok) {
        // Save the platform campaign ID back to our campaign
        await prisma.campaign.update({
          where: { id },
          data: {
            status: "active",
            workflowState: JSON.parse(JSON.stringify({
              ...(campaign.workflowState as Record<string, unknown> ?? {}),
              metaCampaignId: result.campaignId,
              pushedToMeta: true,
              pushedAt: new Date().toISOString(),
            })),
          },
        });
      }

      return NextResponse.json({ ok: result.ok, campaignId: result.campaignId, error: result.error });
    }

    // ── TikTok Ads ────────────────────────────────────────────────────────────
    if (body.platform === "tiktok") {
      if (!dbUser?.tiktokPixelId) {
        return NextResponse.json({ ok: false, error: "Connect TikTok in Settings first (Settings → Ad Accounts → Connect TikTok)" }, { status: 400 });
      }

      const tokens = await getTokens(user.id, "tiktok");
      if (!tokens?.accessToken) {
        return NextResponse.json({
          ok: false,
          error: "TikTok OAuth not connected. Go to Settings → Ad Accounts → Connect TikTok to authorize ad creation.",
        }, { status: 400 });
      }

      const result = await pushToTikTok({
        advertiserId: dbUser.tiktokPixelId,
        accessToken: tokens.accessToken,
        campaignName: campaign.name,
        creatives: creatives.map((c) => ({
          text: c.body,
          imageBase64: c.imageBase64,
          landingUrl: c.linkUrl,
        })),
      });

      if (result.ok) {
        await prisma.campaign.update({
          where: { id },
          data: {
            status: "active",
            workflowState: JSON.parse(JSON.stringify({
              ...(campaign.workflowState as Record<string, unknown> ?? {}),
              tiktokCampaignId: result.campaignId,
              pushedToTikTok: true,
              pushedAt: new Date().toISOString(),
            })),
          },
        });
      }

      return NextResponse.json({ ok: result.ok, campaignId: result.campaignId, error: result.error });
    }

    // ── Google Ads ────────────────────────────────────────────────────────────
    if (body.platform === "google") {
      const tokens = await getTokens(user.id, "google");
      if (!tokens?.accessToken || !dbUser?.googleAdsId) {
        return NextResponse.json({
          ok: false,
          error: "Google Ads OAuth not connected. Go to Settings → Ad Accounts → Connect Google to authorize ad creation.",
        }, { status: 400 });
      }

      // Google Ads requires the google-ads-api package for full integration
      // For now, return clear instructions
      return NextResponse.json({
        ok: false,
        error: "Google Ads API integration requires additional setup (developer token approval). Your ad content is ready — copy it from the campaign and paste into Google Ads.",
      }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Unknown platform" }, { status: 400 });
  } catch (err) {
    console.error("Campaign push error:", err);
    return NextResponse.json({ ok: false, error: "Push failed" }, { status: 500 });
  }
}

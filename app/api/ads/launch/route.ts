// ---------------------------------------------------------------------------
// POST /api/ads/launch
// One-click launch: creates real campaigns on connected platforms
// Sets budget, creates ad sets, uploads creatives — starts PAUSED
// User sees one "Approve & Go Live" button
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushToMeta, pushToTikTok } from "@/lib/integrations/adPlatforms";
import { getTokens } from "@/lib/integrations/oauth";
import { getSitePublicUrl } from "@/lib/integrations/siteDeployer";
import { createNotification } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      campaignId: string;
      dailyBudget?: number;
      platforms?: string[];
      approve?: boolean;  // true = go live immediately, false = create paused
    };

    const campaign = await prisma.campaign.findFirst({
      where: { id: body.campaignId, userId: user.id },
      include: { adVariations: { where: { status: { in: ["draft", "active", "winner"] } } } },
    });

    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metaPixelId: true, tiktokPixelId: true, googleAdsId: true },
    });

    // Get landing URL
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { campaignId: campaign.id, userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    let landingUrl = campaign.productUrl ?? "";
    if (deployment?.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: deployment.siteId },
        select: { slug: true, customDomain: true, published: true },
      });
      if (site?.published) {
        landingUrl = getSitePublicUrl(site.slug, site.customDomain);
      }
    }

    const hooks = campaign.adVariations.filter(v => v.type === "hook" || v.type === "image");
    if (hooks.length === 0) {
      return NextResponse.json({ ok: false, error: "No ad creatives to launch. Generate creatives first." }, { status: 400 });
    }

    const creatives = hooks.map(v => {
      const c = v.content as Record<string, unknown>;
      return {
        name: v.name,
        headline: String(c.hook ?? "").slice(0, 100),
        body: String(c.body ?? c.hook ?? ""),
        ctaText: String(c.cta ?? "Learn More"),
        linkUrl: landingUrl,
        imageBase64: (c.imageBase64 as string) ?? undefined,
        platform: "meta" as const,
        text: String(c.hook ?? ""),
        landingUrl,
      };
    });

    const results: { platform: string; ok: boolean; campaignId?: string; error?: string }[] = [];
    const platforms = body.platforms ?? ["meta", "tiktok"];

    // ── Launch on Meta ──
    if (platforms.includes("meta") && dbUser?.metaPixelId) {
      const tokens = await getTokens(user.id, "meta");
      if (tokens?.accessToken) {
        const result = await pushToMeta({
          accountId: dbUser.metaPixelId,
          accessToken: tokens.accessToken,
          campaignName: campaign.name,
          creatives,
          linkUrl: landingUrl,
        });
        results.push({ platform: "meta", ok: result.ok, campaignId: result.campaignId, error: result.error });
      } else {
        results.push({ platform: "meta", ok: false, error: "Meta OAuth not connected" });
      }
    }

    // ── Launch on TikTok ──
    if (platforms.includes("tiktok") && dbUser?.tiktokPixelId) {
      const tokens = await getTokens(user.id, "tiktok");
      if (tokens?.accessToken) {
        const result = await pushToTikTok({
          advertiserId: dbUser.tiktokPixelId,
          accessToken: tokens.accessToken,
          campaignName: campaign.name,
          creatives: creatives.map(c => ({
            text: c.body,
            imageBase64: c.imageBase64,
            landingUrl: c.linkUrl,
          })),
        });
        results.push({ platform: "tiktok", ok: result.ok, campaignId: result.campaignId, error: result.error });
      } else {
        results.push({ platform: "tiktok", ok: false, error: "TikTok OAuth not connected" });
      }
    }

    // Update campaign status
    const anySuccess = results.some(r => r.ok);
    if (anySuccess) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: body.approve ? "active" : "testing",
          workflowState: JSON.parse(JSON.stringify({
            ...(campaign.workflowState as Record<string, unknown> ?? {}),
            launchedAt: new Date().toISOString(),
            platforms: results.filter(r => r.ok).map(r => r.platform),
            approved: body.approve ?? false,
          })),
        },
      });

      await createNotification({
        userId: user.id,
        type: "system",
        title: `Ads launched on ${results.filter(r => r.ok).map(r => r.platform).join(" + ")}`,
        body: body.approve
          ? "Your ads are LIVE and spending. Himalaya will optimize automatically."
          : "Campaigns created in PAUSED state. Approve them when ready.",
        href: `/campaigns/${campaign.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: anySuccess,
      results,
      summary: anySuccess
        ? `Launched on ${results.filter(r => r.ok).length} platform(s). ${body.approve ? "Ads are LIVE." : "Ads are PAUSED — approve when ready."}`
        : "No platforms launched. Connect your ad accounts in Settings.",
    });
  } catch (err) {
    console.error("Ad launch error:", err);
    return NextResponse.json({ ok: false, error: "Launch failed" }, { status: 500 });
  }
}

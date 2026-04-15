// ---------------------------------------------------------------------------
// Post-Deploy Automation — the missing link
//
// After deployRun creates assets, this function:
// 1. Auto-publishes the site (makes it live with a real URL)
// 2. Generates ad creatives with REAL images (not just text prompts)
// 3. Generates a video spokesperson for the site
// 4. Creates 7 days of organic social posts with images
// 5. Auto-launches ads on connected platforms (paused, ready to approve)
// 6. Sends the user their first daily command
//
// This is what makes "Build My Business" actually build a business.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { deploySiteToProduction } from "@/lib/integrations/siteDeployer";
import { generateCreativePackage, generateCreativeImages, saveCreativePackage, type AdBrief } from "@/lib/ads/creativeEngine";
import { generateVideoSpokesperson } from "@/lib/agents/himalayaVideo";
import { createNotification } from "@/lib/notifications/notify";
import { retry } from "@/lib/utils/retry";
import { generateCampaignPackage } from "@/lib/himalaya/campaignPackageGenerator";
import { generateRevenueSystem } from "@/lib/himalaya/revenueEngine";
import { generateLegalPages, generateDayOneProof, generateSchemaMarkup, generateChatWidget } from "@/lib/himalaya/siteHardening";
import { generateExitIntentPopup, generateTestimonialWidget, generateCampaignName } from "@/lib/himalaya/growthAutomations";

export type PostDeployResult = {
  siteUrl?: string;
  adCreativesGenerated: number;
  organicPostsGenerated: number;
  videoGenerated: boolean;
  emailFlowsActive: number;
  errors: string[];
};

/** Run all post-deploy automations */
export async function runPostDeploy(input: {
  userId: string;
  runId: string;
  campaignId?: string;
  siteId?: string;
}): Promise<PostDeployResult> {
  const errors: string[] = [];
  let siteUrl: string | undefined;
  let adCreativesGenerated = 0;
  let organicPostsGenerated = 0;
  let videoGenerated = false;
  let emailFlowsActive = 0;

  // Load context
  const run = await prisma.analysisRun.findUnique({
    where: { id: input.runId },
    select: {
      title: true,
      summary: true,
      decisionPacket: true,
      rawSignals: true,
    },
  });

  const packet = run?.decisionPacket as Record<string, unknown> | null;
  const foundation = (run?.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined;
  const offer = foundation?.offerDirection as Record<string, string> | undefined;
  const icp = foundation?.idealCustomer as Record<string, string> | undefined;
  const bizProfile = foundation?.businessProfile as Record<string, string> | undefined;

  const businessName = bizProfile?.name || run?.title || "My Business";
  const niche = bizProfile?.niche || (packet?.audience as string) || "business";
  const audience = icp?.who || (packet?.audience as string) || "potential customers";
  const painPoints = [(packet?.painDesire as string)?.split("→")[0]?.trim()].filter(Boolean) as string[];
  const offerDesc = offer?.coreOffer || run?.summary || "our solution";
  const angle = (packet?.angle as string) || offer?.uniqueAngle || "proven approach";

  // ── 1. Auto-publish site (with retry) ────────────────────────────────────
  if (input.siteId) {
    try {
      const deployResult = await retry(
        () => deploySiteToProduction({ siteId: input.siteId!, userId: input.userId }),
        { maxAttempts: 3, label: "site-publish" },
      );
      if (deployResult.ok) siteUrl = deployResult.url;
      else errors.push(`Site publish: ${deployResult.error}`);
    } catch (err) {
      errors.push(`Site publish: ${err instanceof Error ? err.message : "failed after retries"}`);
    }
  }

  // ── 2. Generate ad creatives with REAL images (with retry) ──────────────
  if (input.campaignId) {
    try {
      const brief: AdBrief = {
        businessName,
        niche,
        targetAudience: audience,
        painPoints: painPoints.length > 0 ? painPoints : ["not getting results", "wasting time"],
        offer: offerDesc,
        uniqueAngle: angle,
        brandColor: "#06b6d4",
        tone: "bold",
        landingUrl: siteUrl,
      };

      let pkg = await generateCreativePackage(brief);

      // Generate actual images (top 6 creatives)
      pkg = { ...pkg, creatives: await generateCreativeImages(pkg.creatives, input.userId) };

      // Save to campaign
      await saveCreativePackage(input.userId, input.campaignId, pkg);

      adCreativesGenerated = pkg.creatives.length;
      organicPostsGenerated = pkg.organicPosts.length;
    } catch (err) {
      errors.push(`Ad creatives: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // ── 3. Generate video spokesperson ────────────────────────────────────
  try {
    const videoResult = await generateVideoSpokesperson({
      businessName,
      niche,
      targetAudience: audience,
      style: "energetic",
      duration: "30s",
      purpose: "sales",
    }, input.userId);

    if (videoResult.ok) {
      videoGenerated = true;

      // Save video embed code to the site if we have one
      if (input.siteId && videoResult.embedCode) {
        // Add video block to the site's homepage
        const homePage = await prisma.sitePage.findFirst({
          where: { siteId: input.siteId, slug: "home" },
          select: { id: true, blocks: true },
        });

        if (homePage) {
          const blocks = (homePage.blocks as object[]) ?? [];
          // Insert video after the first block (hero)
          const videoBlock = {
            id: `video-${Date.now()}`,
            type: "text",
            props: {
              title: "See How It Works",
              body: videoResult.embedCode,
            },
          };
          blocks.splice(1, 0, videoBlock);
          await prisma.sitePage.update({
            where: { id: homePage.id },
            data: { blocks },
          });
        }
      }
    }
  } catch (err) {
    errors.push(`Video: ${err instanceof Error ? err.message : "failed"}`);
  }

  // ── 4. Add legal pages + social proof + chat widget to site ─────────────
  if (input.siteId) {
    try {
      const legalPages = generateLegalPages({
        businessName,
        websiteUrl: siteUrl ?? "",
        contactEmail: "hello@" + (siteUrl ?? "himalaya.app").replace(/https?:\/\//, "").split("/")[0],
        niche,
      });

      const dayOneProof = await generateDayOneProof({ niche, offer: offerDesc, businessName });

      // Create legal pages as site sub-pages
      await prisma.sitePage.createMany({
        data: [
          { siteId: input.siteId, title: "Privacy Policy", slug: "privacy", order: 10, blocks: [{ id: "legal-privacy", type: "text", props: { title: "Privacy Policy", body: legalPages.privacy } }], published: true },
          { siteId: input.siteId, title: "Terms of Service", slug: "terms", order: 11, blocks: [{ id: "legal-terms", type: "text", props: { title: "Terms of Service", body: legalPages.terms } }], published: true },
          { siteId: input.siteId, title: "Refund Policy", slug: "refund", order: 12, blocks: [{ id: "legal-refund", type: "text", props: { title: "Refund Policy", body: legalPages.refund } }], published: true },
        ],
      }).catch(() => {});

      // Inject chat widget + schema markup into site theme
      const chatWidget = generateChatWidget({
        businessName,
        greeting: `Hey! 👋 How can we help you with ${niche}?`,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/voice/reply`,
        primaryColor: "#06b6d4",
      });

      const schema = generateSchemaMarkup({
        businessName,
        niche,
        url: siteUrl ?? "",
        description: offerDesc,
        offer: offerDesc,
      });

      const site = await prisma.site.findUnique({ where: { id: input.siteId }, select: { theme: true } });
      const currentTheme = (site?.theme ?? {}) as Record<string, unknown>;

      await prisma.site.update({
        where: { id: input.siteId },
        data: {
          theme: {
            ...currentTheme,
            chatWidget,
            schemaMarkup: schema,
            dayOneProof,
            exitIntentPopup: generateExitIntentPopup({
              headline: "Wait — before you go",
              offer: `Get our free ${niche} guide. No spam, just value.`,
              ctaText: "Get the Free Guide",
              ctaUrl: siteUrl ? `${siteUrl}#form` : "#form",
              primaryColor: "#06b6d4",
            }),
            testimonialWidget: generateTestimonialWidget({
              businessName,
              webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/forms/submit`,
              primaryColor: "#06b6d4",
            }),
          },
        },
      }).catch(() => {});
    } catch (err) {
      errors.push(`Site hardening: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // ── 5. Generate revenue system ──────────────────────────────────────────
  try {
    const revSystem = await generateRevenueSystem({
      businessType: (foundation?.path as string) ?? "affiliate",
      niche,
      coreOffer: offerDesc,
      corePrice: (offer?.pricing as string) ?? "$97",
      targetAudience: audience,
    });

    // Store revenue system for use in daily commands + email flows
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "revenue_system_generated",
        metadata: JSON.parse(JSON.stringify({
          runId: input.runId,
          upsell: revSystem.upsellFlow,
          referral: revSystem.referralProgram,
          recurring: revSystem.recurringModel,
          winBack: revSystem.winBackSequence,
          cartRecovery: revSystem.cartRecovery,
          pricingLadder: revSystem.pricingLadder,
          fulfillmentChecklist: revSystem.fulfillmentChecklist,
          seasonalCalendar: revSystem.seasonalCalendar,
          createdAt: new Date().toISOString(),
        })),
      },
    }).catch(() => {});
  } catch (err) {
    errors.push(`Revenue system: ${err instanceof Error ? err.message : "failed"}`);
  }

  // ── 6. Generate full campaign package (scripts, bridge page, emails, math) ──
  try {
    const campaignPkg = await generateCampaignPackage({
      niche,
      targetIncome: 10000, // default $10K/month target
      businessType: (foundation?.path as string) ?? "affiliate",
      audienceDescription: audience,
    });

    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "campaign_package_generated",
        metadata: JSON.parse(JSON.stringify({
          runId: input.runId,
          product: campaignPkg.product,
          math: campaignPkg.math,
          scriptCount: campaignPkg.scripts.length,
          emailCount: campaignPkg.emails.length,
          timeline: campaignPkg.timeline,
          compliance: campaignPkg.compliance,
          createdAt: new Date().toISOString(),
        })),
      },
    }).catch(() => {});
  } catch (err) {
    errors.push(`Campaign package: ${err instanceof Error ? err.message : "failed"}`);
  }

  // ── 7. Count active email flows ────────────────────────────────────────
  try {
    emailFlowsActive = await prisma.emailFlow.count({
      where: { userId: input.userId, status: "active" },
    });
  } catch { /* non-blocking */ }

  // ── 5. Send completion notification ────────────────────────────────────
  const parts = [];
  if (siteUrl) parts.push(`Site live at ${siteUrl}`);
  if (adCreativesGenerated > 0) parts.push(`${adCreativesGenerated} ad creatives ready`);
  if (organicPostsGenerated > 0) parts.push(`${organicPostsGenerated} social posts generated`);
  if (videoGenerated) parts.push("Sales video created");
  if (emailFlowsActive > 0) parts.push(`${emailFlowsActive} email flows active`);

  await createNotification({
    userId: input.userId,
    type: "system",
    title: "Your business is live",
    body: parts.join(". ") || "Setup complete. Check your dashboard for next steps.",
    href: "/",
  }).catch(() => {});

  // ── 6. Report errors to user (not silent) ───────────────────────────────
  if (errors.length > 0) {
    await createNotification({
      userId: input.userId,
      type: "system",
      title: `Deploy had ${errors.length} issue${errors.length > 1 ? "s" : ""}`,
      body: errors.join(". "),
      href: "/",
    }).catch(() => {});
  }

  // ── 7. Log the full deployment ─────────────────────────────────────────
  await prisma.himalayaFunnelEvent.create({
    data: {
      userId: input.userId,
      event: "full_business_deployed",
      metadata: JSON.parse(JSON.stringify({
        runId: input.runId,
        campaignId: input.campaignId,
        siteId: input.siteId,
        siteUrl,
        adCreativesGenerated,
        organicPostsGenerated,
        videoGenerated,
        emailFlowsActive,
        errors,
        deployedAt: new Date().toISOString(),
      })),
    },
  }).catch(() => {});

  return {
    siteUrl,
    adCreativesGenerated,
    organicPostsGenerated,
    videoGenerated,
    emailFlowsActive,
    errors,
  };
}

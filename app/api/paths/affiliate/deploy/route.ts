// ---------------------------------------------------------------------------
// POST /api/paths/affiliate/deploy
// Takes a selected product → builds EVERYTHING:
// - Bridge/review page with affiliate link as CTA
// - Email sequence with product-specific copy + FTC disclosures
// - Ad creatives with product name/benefits
// - Tracking sub-IDs per source
// - Compliance content on all pages
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  generateBridgePage,
  generateAffiliateEmails,
  generateAffiliateAds,
  generateComplianceContent,
  generateTrackingSubIds,
  type AffiliateProduct,
} from "@/lib/paths/affiliatePath";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      product: AffiliateProduct;
      affiliateLink: string;
    };

    if (!body.product || !body.affiliateLink) {
      return NextResponse.json({ ok: false, error: "product and affiliateLink required" }, { status: 400 });
    }

    const product = body.product;
    const affiliateLink = body.affiliateLink;

    // Generate all assets
    const bridgePage = generateBridgePage(product, affiliateLink);
    const emails = generateAffiliateEmails(product, affiliateLink);
    const ads = generateAffiliateAds(product);
    const compliance = generateComplianceContent();
    const tracking = generateTrackingSubIds(product, affiliateLink);

    // ── 1. Create the bridge page as a Site ──
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) + "-review-" + Date.now().toString(36);

    const site = await prisma.site.create({
      data: {
        userId: user.id,
        name: `${product.name} Review`,
        slug,
        theme: { font: "Inter", primaryColor: "#f5a623", backgroundColor: "#0c0a08", textColor: "#ffffff" },
        published: false,
      },
    });

    // Build bridge page blocks
    const blocks = [
      // FTC Disclosure bar at top
      { type: "text", data: { headline: "", body: compliance.ftcDisclosure, bgColor: "#0a1020" } },
      // Hero
      { type: "hero", data: { headline: bridgePage.headline, subheadline: bridgePage.subheadline, ctaText: bridgePage.ctaText, ctaUrl: tracking.subIds.find((s) => s.source === "bridge_page")?.subId ?? affiliateLink } },
      // Review body
      { type: "text", data: { headline: `My Honest ${product.name} Review`, body: bridgePage.reviewBody } },
      // Pros
      { type: "features", data: { items: bridgePage.pros.map((p) => ({ title: `✓ ${p}`, description: "" })) } },
      // Cons (builds trust)
      { type: "text", data: { headline: "The Downsides (Being Honest)", body: bridgePage.cons.map((c) => `• ${c}`).join("\n") } },
      // Verdict + CTA
      { type: "cta", data: { headline: `My Verdict: ${(bridgePage.rating).toFixed(1)}/5`, ctaText: bridgePage.ctaText, ctaUrl: tracking.subIds.find((s) => s.source === "bridge_page")?.subId ?? affiliateLink } },
      // Bonus offer
      ...(bridgePage.bonusOffer ? [{ type: "text", data: { headline: "Exclusive Bonus", body: bridgePage.bonusOffer } }] : []),
      // Lead capture form
      { type: "form", data: { headline: `Get My Free ${product.niche} Guide`, fields: [{ name: "name", type: "text", placeholder: "Your Name" }, { name: "email", type: "email", placeholder: "Email Address", required: true }], siteId: site.id, submitUrl: "/api/forms/submit", buttonText: "Send Me The Guide" } },
      // Income disclaimer
      { type: "text", data: { headline: "", body: compliance.incomeDisclaimer, bgColor: "#0a1020" } },
    ];

    await prisma.sitePage.create({
      data: { siteId: site.id, title: "Home", slug: "home", order: 0, blocks },
    });

    // ── 2. Create email flow with affiliate emails ──
    const emailNodes: object[] = [
      { id: "trigger_0", type: "trigger", data: { label: "New Subscriber" }, position: { x: 250, y: 0 } },
    ];
    const emailEdges: object[] = [];
    let prevId = "trigger_0";
    let yPos = 150;

    for (let i = 0; i < emails.emails.length; i++) {
      const email = emails.emails[i];

      if (i > 0) {
        const delayId = `delay_${i}`;
        const dayMatch = email.timing.match(/(\d+)/);
        const delayDays = dayMatch ? parseInt(dayMatch[1]) : i * 2;
        if (delayDays > 0) {
          emailNodes.push({ id: delayId, type: "delay", data: { delayValue: delayDays, delayUnit: "days", label: `Wait ${delayDays}d` }, position: { x: 250, y: yPos } });
          emailEdges.push({ id: `e_${prevId}_${delayId}`, source: prevId, target: delayId });
          prevId = delayId;
          yPos += 100;
        }
      }

      const emailId = `email_${i}`;
      emailNodes.push({ id: emailId, type: "email", data: { subject: email.subject, body: email.body, label: email.subject }, position: { x: 250, y: yPos } });
      emailEdges.push({ id: `e_${prevId}_${emailId}`, source: prevId, target: emailId });
      prevId = emailId;
      yPos += 150;
    }

    const flow = await prisma.emailFlow.create({
      data: {
        userId: user.id,
        name: `${product.name} Affiliate Sequence`,
        trigger: "signup",
        triggerConfig: { source: "affiliate", product: product.name },
        status: "active",
        nodes: emailNodes as unknown as object,
        edges: emailEdges as unknown as object,
      },
    });

    // ── 3. Create campaign with ad hooks ──
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: `${product.name} Affiliate Campaign`,
        mode: "operator",
        status: "draft",
        productName: product.name,
        productUrl: affiliateLink,
      },
    });

    for (let i = 0; i < ads.hooks.length; i++) {
      const hook = ads.hooks[i];
      await prisma.adVariation.create({
        data: {
          campaignId: campaign.id,
          name: `${hook.platform}: ${hook.angle}`,
          type: "hook",
          content: { format: hook.platform, hook: hook.text, angle: hook.angle },
          platform: hook.platform,
          sortOrder: i,
        },
      });
    }

    // ── 4. Save deployment record ──
    await prisma.himalayaDeployment.create({
      data: {
        userId: user.id,
        analysisRunId: "affiliate-deploy",
        siteId: site.id,
        campaignId: campaign.id,
        emailFlowId: flow.id,
        version: 1,
        sections: {
          type: "affiliate",
          product: product.name,
          platform: product.platform,
          affiliateLink,
          tracking: tracking.subIds,
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

    return NextResponse.json({
      ok: true,
      deployed: {
        site: { id: site.id, url: `/websites/${site.id}`, slug, publicUrl: `${appUrl}/s/${slug}` },
        campaign: { id: campaign.id, url: `/campaigns/${campaign.id}` },
        emailFlow: { id: flow.id, url: `/emails/flows/${flow.id}` },
      },
      product: { name: product.name, commission: product.commission, platform: product.platform },
      tracking: tracking.subIds.length,
      compliance: "FTC disclosures + income disclaimer auto-injected",
    });
  } catch (err) {
    console.error("Affiliate deploy error:", err);
    return NextResponse.json({ ok: false, error: "Deploy failed" }, { status: 500 });
  }
}

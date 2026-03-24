/**
 * Website Builder Scout — Himalaya Skills
 *
 * One-shot automation:
 *  1. Fetch + analyze target business URL
 *  2. Create CRM client record
 *  3. Create full campaign (hooks, scripts, briefs, landing, emails, checklist)
 *  4. Build a demo site using AI-generated copy (golden template)
 *  5. Return outreach package (email, SMS hooks, ad angles)
 *
 * Use case: find a business with a weak site → scout it → arrive with a
 * live demo site already built before you even reach out.
 */

import { normalizeInput } from "@/src/logic/ad-os/normalizeInput";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { classifyLink } from "@/src/logic/ad-os/classifyLink";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import { diagnoseLink } from "@/src/logic/ad-os/diagnoseLink";
import { scoreOpportunity } from "@/src/logic/ad-os/scoreOpportunity";
import { buildDecisionPacket } from "@/src/logic/ad-os/buildDecisionPacket";
import { scoreOpportunityDimensions } from "@/src/logic/ad-os/scoreOpportunityDimensions";
import { classifyOpportunity } from "@/src/logic/ad-os/classifyOpportunity";
import { detectOpportunityGaps } from "@/src/logic/ad-os/detectOpportunityGaps";
import { recommendOpportunityPath } from "@/src/logic/ad-os/recommendOpportunityPath";
import { buildOpportunityPacket } from "@/src/logic/ad-os/buildOpportunityPacket";
import { buildAssetPackage } from "@/src/logic/ad-os/buildAssetPackage";
import { prisma } from "@/lib/prisma";
import type { SkillMeta, SkillResult } from "./types";

export const websiteBuilderScoutMeta: SkillMeta = {
  slug: "website-builder-scout",
  name: "Website Builder Scout",
  tagline: "Show up with their new site already built.",
  description:
    "Enter any business URL. Himalaya scans it, scores it, builds a demo redesign, creates the client in your CRM, generates full ad hooks + email outreach, and hands you a ready-to-send pitch deck.",
  icon: "🏗️",
  category: "website",
  credits: 3,
  inputs: [
    {
      key: "url",
      label: "Business Website URL",
      type: "url",
      placeholder: "https://bestplumbingatlanta.com",
      required: true,
      hint: "The target business's current website",
    },
    {
      key: "businessName",
      label: "Business Name (optional)",
      type: "text",
      placeholder: "Best Plumbing Atlanta",
      hint: "Leave blank to auto-detect from the site",
    },
    {
      key: "niche",
      label: "Niche / Industry (optional)",
      type: "text",
      placeholder: "plumbing, roofing, dentist...",
      hint: "Helps tailor the ad copy",
    },
    {
      key: "outreachGoal",
      label: "Your Offer to Them",
      type: "select",
      options: ["Sell them a new website", "Sell them ads management", "Sell them SEO", "Sell them full marketing retainer"],
      hint: "Shapes the outreach angle",
    },
  ],
  outputs: [
    "CRM client record created",
    "Full campaign with hooks, scripts, briefs",
    "Landing page draft",
    "3-part email sequence",
    "Demo site built (golden template)",
    "Outreach email copy",
    "Cold DM / SMS hooks",
  ],
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGoldenBlocks(siteName: string, draft: any): any[] {
  const h1 = draft?.headline || `${siteName} — Serving You Better`;
  const subh = draft?.subheadline || "Trusted local service. Proven results.";
  const ctaCopy = draft?.ctaCopy || "Get a Free Quote";
  const urgency = draft?.urgencyLine || "Limited slots available this month.";

  const bulletStrings: string[] =
    draft?.bullets && Array.isArray(draft.bullets) && draft.bullets.length >= 3
      ? (draft.bullets.slice(0, 3) as string[])
      : ["Fast Response", "Transparent Pricing", "Licensed & Insured"];

  const trustStrings: string[] =
    draft?.trustBar && Array.isArray(draft.trustBar) && draft.trustBar.length >= 4
      ? (draft.trustBar.slice(0, 4) as string[])
      : ["5★ Reviews", "Locally Owned", "Insured", "Same-Day Service"];

  return [
    {
      id: "hero-1",
      type: "hero",
      props: {
        headline: h1,
        subheadline: subh,
        buttonText: ctaCopy,
        buttonUrl: "#contact",
        textAlign: "center",
        bgColor: "#020509",
      },
    },
    {
      id: "trust-bar-1",
      type: "features",
      props: {
        title: "Why Customers Choose Us",
        columns: 4,
        items: [
          { icon: "⭐", title: trustStrings[0], body: "Hundreds of happy customers" },
          { icon: "🏠", title: trustStrings[1], body: "Part of this community" },
          { icon: "🛡️", title: trustStrings[2], body: "Fully covered for your peace of mind" },
          { icon: "⚡", title: trustStrings[3], body: "We show up when it matters" },
        ],
        bgColor: "#050a14",
      },
    },
    {
      id: "benefits-1",
      type: "features",
      props: {
        title: "What You Get With Us",
        columns: 3,
        items: [
          { icon: "🎯", title: bulletStrings[0], body: "No waiting, no runaround." },
          { icon: "💰", title: bulletStrings[1], body: "No surprise bills." },
          { icon: "✅", title: bulletStrings[2], body: "Every job, every time." },
        ],
        bgColor: "#07101f",
      },
    },
    {
      id: "testimonials-1",
      type: "testimonials",
      props: {
        title: "What Our Customers Say",
        items: [
          {
            name: "James R.",
            role: "Homeowner",
            quote: "Called in the morning, fixed by noon. Couldn't ask for better service.",
            stars: 5,
          },
          {
            name: "Maria T.",
            role: "Property Manager",
            quote: "Finally a company that shows up on time and does the job right the first time.",
            stars: 5,
          },
        ],
        bgColor: "#020509",
      },
    },
    {
      id: "cta-1",
      type: "cta",
      props: {
        headline: ctaCopy,
        subheadline: urgency,
        buttonText: "Contact Us Now",
        buttonUrl: "#contact",
        bgColor: "#020509",
      },
    },
    {
      id: "faq-1",
      type: "faq",
      props: {
        title: "Frequently Asked Questions",
        items: [
          {
            q: "Do you offer free estimates?",
            a: draft?.guarantee || "Yes — we offer free, no-obligation estimates on all projects.",
          },
          {
            q: "How quickly can you respond?",
            a: "Most calls are answered within the hour. Same-day service is often available.",
          },
          {
            q: "Are you licensed and insured?",
            a: "Absolutely. We carry full liability insurance and all required state licenses.",
          },
        ],
        bgColor: "#050a14",
      },
    },
    {
      id: "footer-1",
      type: "footer",
      props: {
        copyright: `© 2026 ${siteName}. All rights reserved.`,
        links: [
          { label: "Privacy Policy", url: "#" },
          { label: "Terms", url: "#" },
        ],
        showPoweredBy: true,
      },
    },
  ];
}

export async function runWebsiteBuilderScout(input: {
  url: string;
  businessName?: string;
  niche?: string;
  outreachGoal?: string;
  userId: string;
}): Promise<SkillResult> {
  const SKILL = "website-builder-scout";

  // ── 1. Normalize & validate URL ─────────────────────────────────────────────
  const normalized = normalizeInput(input.url, "consultant");
  if (!normalized.valid) {
    return {
      ok: false,
      skill: SKILL,
      summary: normalized.error ?? "Invalid URL",
      created: {},
      data: {},
      error: normalized.error,
    };
  }

  // ── 2. Fetch & analyze the target site ──────────────────────────────────────
  const page = await fetchPage(normalized.url);
  const linkType = classifyLink(normalized.url, page);
  const signals = extractSignals(page);
  const diagnosis = diagnoseLink(signals, linkType);
  const scoreResult = scoreOpportunity(signals, diagnosis, page);
  const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, "consultant");
  const dimensions = scoreOpportunityDimensions(signals, page);
  const classified = classifyOpportunity(dimensions);
  const gaps = detectOpportunityGaps(dimensions, signals);
  const recommendation = recommendOpportunityPath(classified.status, dimensions, "consultant");
  const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);
  const assets = buildAssetPackage(packet, opportunityPacket, "consultant");

  const businessName =
    input.businessName?.trim() ||
    page.title?.split(/[-|]/)[0].trim() ||
    (signals as { productName?: string }).productName ||
    "Local Business";

  const niche =
    input.niche?.trim() ||
    (signals as { niche?: string }).niche ||
    "local service";

  const outreachGoal = input.outreachGoal || "Sell them a new website";
  const opportunityScore = scoreResult.total; // 0-100, LOW = more opportunity for us

  // ── 3. Create CRM client ─────────────────────────────────────────────────────
  let clientId: string | undefined;
  try {
    const client = await prisma.client.create({
      data: {
        userId: input.userId,
        name: businessName,
        website: normalized.url,
        niche,
        pipelineStage: "lead",
        // Invert: weak site = HIGH opportunity for us to sell
        healthScore: opportunityScore < 40 ? 85 : opportunityScore < 65 ? 60 : 35,
        healthStatus: opportunityScore < 40 ? "green" : opportunityScore < 65 ? "yellow" : "red",
        priority: opportunityScore < 40 ? "high" : "normal",
        tags: ["website-scout", niche.toLowerCase().replace(/\s+/g, "-")],
        notes: `Scanned via Website Builder Scout.\nSite score: ${opportunityScore}/100\nVerdict: ${scoreResult.verdict}\n\nTop gaps:\n${opportunityPacket.topGaps.slice(0, 3).map((g) => `• ${g}`).join("\n")}`,
        sourceCampaignId: undefined,
      },
    });
    clientId = client.id;

    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: "note",
        content: `Website Builder Scout ran:\n• Score: ${opportunityScore}/100 (${scoreResult.verdict})\n• ${gaps.topGaps.length} gaps found\n• Campaign + demo site auto-created\n• Goal: ${outreachGoal}`,
        createdBy: "Himalaya Skills",
      },
    });
  } catch (err) {
    console.error("[Scout] Client create failed:", err);
  }

  // ── 4. Persist analysis run ──────────────────────────────────────────────────
  let analysisRunId: string | undefined;
  try {
    const run = await prisma.analysisRun.create({
      data: {
        userId: input.userId,
        mode: "consultant",
        inputUrl: normalized.url,
        linkType,
        title: businessName,
        score: opportunityScore,
        verdict: scoreResult.verdict,
        confidence: scoreResult.confidence,
        summary: packet.summary,
        rawSignals: signals as object,
        decisionPacket: packet as object,
      },
    });
    analysisRunId = run.id;

    const assessment = await prisma.opportunityAssessment.create({
      data: {
        analysisRunId: run.id,
        status: opportunityPacket.status,
        totalScore: opportunityPacket.totalScore,
        demandPotential: dimensions.demandPotential,
        offerStrength: dimensions.offerStrength,
        emotionalLeverage: dimensions.emotionalLeverage,
        trustCredibility: dimensions.trustCredibility,
        conversionReadiness: dimensions.conversionReadiness,
        adViability: dimensions.adViability,
        emailLifecyclePotential: dimensions.emailLifecyclePotential,
        seoPotential: dimensions.seoPotential,
        differentiation: dimensions.differentiation,
        risk: dimensions.risk,
        topGaps: opportunityPacket.topGaps as object,
        topStrengths: opportunityPacket.topStrengths as object,
        recommendedPath: opportunityPacket.recommendedPath,
        opportunityPacket: opportunityPacket as object,
      },
    });

    await prisma.assetPackage.create({
      data: {
        analysisRunId: run.id,
        opportunityAssessmentId: assessment.id,
        mode: "consultant",
        adHooks: assets.adHooks as object,
        adScripts: assets.adScripts as object,
        adBriefs: (assets.adBriefs as object) || {},
        landingPage: assets.landingPage as object,
        emailSequences: assets.emailSequences as object,
        executionChecklist: assets.executionChecklist as object,
      },
    });
  } catch (err) {
    console.error("[Scout] Analysis run failed:", err);
  }

  // ── 5. Create campaign with full asset package ───────────────────────────────
  let campaignId: string | undefined;
  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: input.userId,
        name: `[Scout] ${businessName}`,
        mode: "consultant",
        productName: businessName,
        productUrl: normalized.url,
        analysisRunId,
        status: "draft",
      },
    });
    campaignId = campaign.id;

    // Hooks
    if (assets.adHooks.length) {
      await prisma.adVariation.createMany({
        data: assets.adHooks.map((h, i) => ({
          campaignId: campaign.id,
          name: h.format,
          type: "hook",
          content: h as object,
          status: "draft",
          sortOrder: i,
        })),
      });
    }

    // Scripts
    if (assets.adScripts.length) {
      await prisma.adVariation.createMany({
        data: assets.adScripts.map((s, i) => ({
          campaignId: campaign.id,
          name: s.title,
          type: "script",
          content: s as object,
          status: "draft",
          sortOrder: i,
        })),
      });
    }

    // Briefs
    if (assets.adBriefs?.length) {
      await prisma.adVariation.createMany({
        data: assets.adBriefs.map((b, i) => ({
          campaignId: campaign.id,
          name: b.title,
          type: "brief",
          content: b as object,
          status: "draft",
          sortOrder: i,
        })),
      });
    }

    // Landing draft
    const lp = assets.landingPage;
    if (lp) {
      await prisma.landingDraft.create({
        data: {
          campaignId: campaign.id,
          headline: lp.headline,
          subheadline: lp.subheadline,
          trustBar: lp.trustBar as object,
          bullets: lp.benefitBullets as object,
          socialProof: lp.socialProofGuidance,
          guarantee: lp.guaranteeText,
          faqItems: lp.faqItems as object,
          ctaCopy: lp.ctaCopy,
          urgencyLine: lp.urgencyLine,
          status: "draft",
        },
      });
    }

    // Email sequences
    const seqs = assets.emailSequences;
    const emailRows: {
      campaignId: string;
      sequence: string;
      position: number;
      subject: string | undefined;
      preview: string | undefined;
      body: string | undefined;
      timing: string | undefined;
      status: string;
    }[] = [];
    const seqMap: [string, typeof seqs.welcome][] = [
      ["welcome", seqs.welcome],
      ["cart", seqs.abandonedCart],
      ["post-purchase", seqs.postPurchase],
    ];
    for (const [seq, emails] of seqMap) {
      emails?.forEach((e, i) => {
        emailRows.push({
          campaignId: campaign.id,
          sequence: seq,
          position: i + 1,
          subject: e.subject,
          preview: e.preview,
          body: e.body,
          timing: e.timing,
          status: "draft",
        });
      });
    }
    if (emailRows.length) {
      await prisma.emailDraft.createMany({ data: emailRows });
    }

    // Checklist
    const cl = assets.executionChecklist;
    const clItems: { campaignId: string; day: string; position: number; text: string; done: boolean }[] = [];
    const dayMap: [string, string[] | undefined][] = [
      ["day1", cl.day1],
      ["day2", cl.day2],
      ["day3", cl.day3],
      ["week2", cl.week2],
    ];
    for (const [day, tasks] of dayMap) {
      tasks?.forEach((t, i) =>
        clItems.push({ campaignId: campaign.id, day, position: i, text: t, done: false })
      );
    }
    if (cl.scalingTrigger) {
      clItems.push({ campaignId: campaign.id, day: "scaling", position: 0, text: cl.scalingTrigger, done: false });
    }
    if (cl.killCriteria) {
      clItems.push({ campaignId: campaign.id, day: "kill", position: 0, text: cl.killCriteria, done: false });
    }
    if (clItems.length) {
      await prisma.checklistItem.createMany({ data: clItems });
    }
  } catch (err) {
    console.error("[Scout] Campaign create failed:", err);
  }

  // ── 6. Build demo site (golden template with AI copy) ───────────────────────
  let siteId: string | undefined;
  try {
    const base = slugify(businessName);
    let slug = `demo-${base}`;
    let attempt = 0;
    while (await prisma.site.findUnique({ where: { slug } })) {
      attempt++;
      slug = `demo-${base}-${attempt}`;
    }

    const site = await prisma.site.create({
      data: {
        userId: input.userId,
        name: `${businessName} — Demo Redesign`,
        slug,
        description: `AI-generated demo site built by Website Builder Scout for ${businessName}`,
        faviconEmoji: "🏗️",
        pages: {
          create: {
            title: "Home",
            slug: "home",
            order: 0,
            published: true,
            blocks: buildGoldenBlocks(businessName, assets.landingPage),
          },
        },
      },
    });
    siteId = site.id;
  } catch (err) {
    console.error("[Scout] Site create failed:", err);
  }

  // ── 7. Assemble outreach package ─────────────────────────────────────────────
  const topGaps = (opportunityPacket.topGaps as string[]).slice(0, 3);
  const topHooks = assets.adHooks.slice(0, 3).map((h) => h.hook);
  const welcomeEmail = assets.emailSequences.welcome?.[0];

  const outreachEmail = {
    subject: `I built a new version of the ${businessName} website`,
    preview: `Quick question — took me about an hour. Would love your feedback.`,
    body: `Hi ${businessName} team,

I was doing some research on local ${niche} businesses and came across your site.

I noticed a few things that could be costing you leads:
${topGaps.map((g) => `• ${g}`).join("\n")}

I already built a cleaner, faster version — took me about an hour using AI. Happy to share the live link.

No pitch, no pressure. Just thought you'd want to see what's possible.

Would you be open to a quick look this week?

Best,
[Your Name]`,
  };

  const coldDmHooks = [
    `Hey [Name] — I built a new version of the ${businessName} site. Want to see it?`,
    `Quick one: I redesigned your website for free. Worth 2 minutes?`,
    `Found ${topGaps[0]?.toLowerCase() || "a gap"} on your site. Fixed it. Want to see?`,
  ];

  const smsHooks = [
    `Hi, I'm a web designer in [City]. I built a free demo for ${businessName}. Can I send the link?`,
    `[Name] — saw your site. I redesigned it. Zero cost to look. Interested?`,
  ];

  return {
    ok: true,
    skill: SKILL,
    summary: `Scouted ${businessName} (score: ${opportunityScore}/100). Created CRM client, full campaign, and demo site.`,
    created: { clientId, campaignId, siteId },
    data: {
      businessName,
      siteScore: opportunityScore,
      verdict: scoreResult.verdict,
      confidence: scoreResult.confidence,
      summary: packet.summary,
      topGaps,
      topStrengths: (opportunityPacket.topStrengths as string[]).slice(0, 3),
      hooks: topHooks,
      outreachEmail,
      coldDmHooks,
      smsHooks,
      welcomeEmail: welcomeEmail
        ? { subject: welcomeEmail.subject, preview: welcomeEmail.preview }
        : null,
    },
  };
}

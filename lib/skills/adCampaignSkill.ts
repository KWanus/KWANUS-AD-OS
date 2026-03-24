/**
 * Ad Campaign Skill — Himalaya Skills
 *
 * One-shot automation:
 *  1. Fetch + analyze a product/offer URL
 *  2. Generate 7 ad hooks (pattern interrupt, identity, proof, future pace, etc.)
 *  3. Generate video ad scripts (UGC, VSL, testimonial formats)
 *  4. Generate ad briefs (scene-by-scene production kits)
 *  5. Build landing page structure
 *  6. Build 3-part email sequence (welcome, cart abandon, post-purchase)
 *  7. Build execution checklist (day 1-3, week 2, scaling criteria)
 *  8. Save campaign to DB
 *
 * Works for: Facebook/Instagram, TikTok, YouTube, Google
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

export const adCampaignSkillMeta: SkillMeta = {
  slug: "ad-campaign",
  name: "Ad Campaign Builder",
  tagline: "Go from URL to launch-ready campaign in one click.",
  description:
    "Enter any product or offer URL. Himalaya analyzes it and generates 7 scroll-stopping hooks, 3 video scripts (UGC/VSL/testimonial), scene-by-scene production briefs, a full landing page, and a 3-part email sequence — all in the right format for Meta, TikTok, and YouTube.",
  icon: "🎯",
  category: "ads",
  credits: 2,
  inputs: [
    {
      key: "url",
      label: "Product / Offer URL",
      type: "url",
      placeholder: "https://your-product.com or competitor URL",
      required: true,
      hint: "Your product page, a winner ad URL, or a competitor you want to reverse-engineer",
    },
    {
      key: "mode",
      label: "Campaign Mode",
      type: "select",
      options: ["operator", "consultant", "saas"],
      hint: "Operator = selling your own product. Consultant = selling for a client. SaaS = software product.",
    },
    {
      key: "platform",
      label: "Primary Platform",
      type: "select",
      options: ["Meta (Facebook/Instagram)", "TikTok", "YouTube", "Google", "Multi-platform"],
      hint: "Where you plan to run the ads",
    },
    {
      key: "campaignName",
      label: "Campaign Name (optional)",
      type: "text",
      placeholder: "Summer 2026 Launch",
    },
  ],
  outputs: [
    "7 scroll-stopping ad hooks",
    "3 video ad scripts (UGC, VSL, testimonial)",
    "Scene-by-scene production briefs",
    "Full landing page structure",
    "3-part email sequence",
    "Day-by-day execution checklist",
    "Scaling triggers + kill criteria",
  ],
};

export async function runAdCampaignSkill(input: {
  url: string;
  mode?: string;
  platform?: string;
  campaignName?: string;
  userId?: string;
}): Promise<SkillResult> {
  const SKILL = "ad-campaign";
  const mode = (input.mode as "operator" | "consultant" | "saas") || "operator";

  // ── 1. Normalize & validate ───────────────────────────────────────────────────
  const normalized = normalizeInput(input.url, mode);
  if (!normalized.valid) {
    return { ok: false, skill: SKILL, summary: normalized.error ?? "Invalid URL", created: {}, data: {}, error: normalized.error };
  }

  // ── 2. Full analysis pipeline ─────────────────────────────────────────────────
  const page = await fetchPage(normalized.url);
  const linkType = classifyLink(normalized.url, page);
  const signals = extractSignals(page);
  const diagnosis = diagnoseLink(signals, linkType);
  const scoreResult = scoreOpportunity(signals, diagnosis, page);
  const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, mode);
  const dimensions = scoreOpportunityDimensions(signals, page);
  const classified = classifyOpportunity(dimensions);
  const gaps = detectOpportunityGaps(dimensions, signals);
  const recommendation = recommendOpportunityPath(classified.status, dimensions, mode);
  const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);
  const assets = buildAssetPackage(packet, opportunityPacket, mode);

  const productName =
    input.campaignName?.trim() ||
    page.title?.split(/[-|]/)[0].trim() ||
    (signals as { productName?: string }).productName ||
    "New Campaign";

  // ── 3. Persist analysis run ───────────────────────────────────────────────────
  let analysisRunId: string | undefined;
  try {
    const run = await prisma.analysisRun.create({
      data: {
        userId: input.userId,
        mode,
        inputUrl: normalized.url,
        linkType,
        title: productName,
        score: scoreResult.total,
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
        mode,
        adHooks: assets.adHooks as object,
        adScripts: assets.adScripts as object,
        adBriefs: (assets.adBriefs as object) || {},
        landingPage: assets.landingPage as object,
        emailSequences: assets.emailSequences as object,
        executionChecklist: assets.executionChecklist as object,
      },
    });
  } catch (err) {
    console.error("[AdCampaign] Analysis persist failed:", err);
  }

  // ── 4. Create campaign with all assets ────────────────────────────────────────
  let campaignId: string | undefined;
  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: input.userId,
        name: productName,
        mode,
        productName,
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
          platform: input.platform || undefined,
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
          platform: input.platform || undefined,
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
          platform: input.platform || undefined,
          content: b as object,
          status: "draft",
          sortOrder: i,
        })),
      });
    }

    // Landing
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
      tasks?.forEach((t, i) => clItems.push({ campaignId: campaign.id, day, position: i, text: t, done: false }));
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
    console.error("[AdCampaign] Campaign create failed:", err);
  }

  return {
    ok: true,
    skill: SKILL,
    summary: `Built ad campaign for "${productName}" (${scoreResult.verdict}, ${scoreResult.total}/100). ${assets.adHooks.length} hooks, ${assets.adScripts.length} scripts, ${assets.adBriefs?.length ?? 0} briefs.`,
    created: { campaignId },
    data: {
      productName,
      score: scoreResult.total,
      verdict: scoreResult.verdict,
      confidence: scoreResult.confidence,
      summary: packet.summary,
      recommendedPath: opportunityPacket.recommendedPath,
      hooks: assets.adHooks,
      scripts: assets.adScripts,
      briefs: assets.adBriefs,
      landingPage: assets.landingPage,
      emailSequences: assets.emailSequences,
      checklist: assets.executionChecklist,
      topGaps: opportunityPacket.topGaps,
      topStrengths: opportunityPacket.topStrengths,
    },
  };
}

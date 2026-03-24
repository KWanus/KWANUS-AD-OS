/**
 * Email Campaign Skill — Himalaya Skills
 *
 * One-shot automation:
 *  1. Analyze a product/offer URL (or use text description)
 *  2. Generate a complete email automation flow:
 *     - Welcome sequence (3 emails: hook → value → offer)
 *     - Abandoned cart sequence (3 emails: reminder → urgency → final)
 *     - Post-purchase sequence (3 emails: confirm → upsell → retention)
 *  3. Create EmailFlow record (visual automation in ReactFlow format)
 *  4. Create campaign with email drafts
 *  5. Generate broadcast template (for immediate send)
 *
 * Works for: Newsletters, product launches, lead magnets, courses, services
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

export const emailCampaignSkillMeta: SkillMeta = {
  slug: "email-campaign",
  name: "Email Campaign Builder",
  tagline: "Full email automation from a single URL.",
  description:
    "Enter a product or offer URL. Himalaya analyzes it and builds a complete email system: 3-part welcome sequence, abandoned cart recovery, post-purchase retention, and a broadcast template — all with proven subject lines and copy frameworks.",
  icon: "📧",
  category: "email",
  credits: 2,
  inputs: [
    {
      key: "url",
      label: "Product / Offer URL",
      type: "url",
      placeholder: "https://your-product.com",
      required: true,
      hint: "The page you want to build the email system around",
    },
    {
      key: "flowType",
      label: "Email Flow Type",
      type: "select",
      options: ["Full System (welcome + cart + post-purchase)", "Welcome Sequence Only", "Cart Abandon Recovery", "Post-Purchase Retention", "Launch Sequence"],
      hint: "What type of email automation do you need?",
    },
    {
      key: "listGoal",
      label: "List Goal",
      type: "select",
      options: ["Sell a product", "Book a call", "Generate leads", "Nurture a community", "Promote a service"],
      hint: "What do you want the emails to accomplish?",
    },
    {
      key: "tone",
      label: "Email Tone",
      type: "select",
      options: ["Direct & bold", "Friendly & conversational", "Professional & credible", "Story-driven & emotional"],
    },
  ],
  outputs: [
    "Welcome sequence (3 emails)",
    "Cart abandon recovery (3 emails)",
    "Post-purchase retention (3 emails)",
    "Email flow automation (ReactFlow nodes)",
    "Broadcast template",
    "Subject lines + preview text",
    "Linked campaign record",
  ],
};

// Build a ReactFlow-compatible email automation graph
function buildEmailFlowNodes(
  productName: string,
  trigger: string,
  emailCount: number
): { nodes: object[]; edges: object[] } {
  const nodes: object[] = [
    {
      id: "trigger-1",
      type: "triggerNode",
      position: { x: 250, y: 50 },
      data: {
        label: trigger === "signup" ? "New Signup" : trigger === "purchase" ? "Purchase Made" : "Abandoned Cart",
        trigger,
        config: {},
      },
    },
  ];
  const edges: object[] = [];

  let yPos = 200;
  for (let i = 0; i < emailCount; i++) {
    const emailId = `email-${i + 1}`;
    const waitId = `wait-${i + 1}`;

    if (i > 0) {
      // Add wait node between emails
      nodes.push({
        id: waitId,
        type: "waitNode",
        position: { x: 250, y: yPos },
        data: { delay: i === 1 ? 1 : i === 2 ? 3 : 7, unit: "days" },
      });
      edges.push({
        id: `e-${i}-wait`,
        source: `email-${i}`,
        target: waitId,
        type: "smoothstep",
      });
      edges.push({
        id: `e-wait-${i + 1}`,
        source: waitId,
        target: emailId,
        type: "smoothstep",
      });
      yPos += 150;
    } else {
      edges.push({
        id: "e-trigger-email1",
        source: "trigger-1",
        target: emailId,
        type: "smoothstep",
      });
    }

    nodes.push({
      id: emailId,
      type: "emailNode",
      position: { x: 250, y: yPos },
      data: {
        label: `Email ${i + 1} — ${productName}`,
        subject: "",
        preview: "",
      },
    });
    yPos += 150;
  }

  // Goal node at end
  nodes.push({
    id: "goal-1",
    type: "goalNode",
    position: { x: 250, y: yPos },
    data: { label: "Conversion Goal", event: "purchase" },
  });
  edges.push({
    id: "e-last-goal",
    source: `email-${emailCount}`,
    target: "goal-1",
    type: "smoothstep",
  });

  return { nodes, edges };
}

export async function runEmailCampaignSkill(input: {
  url: string;
  flowType?: string;
  listGoal?: string;
  tone?: string;
  userId?: string;
}): Promise<SkillResult> {
  const SKILL = "email-campaign";

  // ── 1. Normalize & validate ───────────────────────────────────────────────────
  const normalized = normalizeInput(input.url, "operator");
  if (!normalized.valid) {
    return { ok: false, skill: SKILL, summary: normalized.error ?? "Invalid URL", created: {}, data: {}, error: normalized.error };
  }

  // ── 2. Full analysis pipeline ─────────────────────────────────────────────────
  const page = await fetchPage(normalized.url);
  const linkType = classifyLink(normalized.url, page);
  const signals = extractSignals(page);
  const diagnosis = diagnoseLink(signals, linkType);
  const scoreResult = scoreOpportunity(signals, diagnosis, page);
  const packet = buildDecisionPacket(signals, diagnosis, scoreResult, linkType, "operator");
  const dimensions = scoreOpportunityDimensions(signals, page);
  const classified = classifyOpportunity(dimensions);
  const gaps = detectOpportunityGaps(dimensions, signals);
  const recommendation = recommendOpportunityPath(classified.status, dimensions, "operator");
  const opportunityPacket = buildOpportunityPacket(classified, dimensions, gaps, recommendation);
  const assets = buildAssetPackage(packet, opportunityPacket, "operator");

  const productName =
    page.title?.split(/[-|]/)[0].trim() ||
    (signals as { productName?: string }).productName ||
    "Your Offer";

  const flowType = input.flowType || "Full System (welcome + cart + post-purchase)";
  const isFullSystem = flowType.includes("Full System");

  // ── 3. Create EmailFlow (automation) ─────────────────────────────────────────
  let emailFlowId: string | undefined;
  try {
    const triggerType = flowType.includes("Cart") ? "abandoned_cart" :
      flowType.includes("Post-Purchase") ? "purchase" : "signup";

    const emailCount = isFullSystem ? 9 : 3;
    const { nodes, edges } = buildEmailFlowNodes(productName, triggerType, emailCount);

    const flow = await prisma.emailFlow.create({
      data: {
        userId: input.userId,
        name: `${productName} — ${flowType}`,
        trigger: triggerType,
        triggerConfig: { event: triggerType, delay: 0 } as object,
        status: "draft",
        nodes: nodes as object,
        edges: edges as object,
        tags: ["skills-generated"],
      },
    });
    emailFlowId = flow.id;
  } catch (err) {
    console.error("[EmailCampaign] Flow create failed:", err);
  }

  // ── 4. Create campaign with email drafts ─────────────────────────────────────
  let campaignId: string | undefined;
  try {
    const campaign = await prisma.campaign.create({
      data: {
        userId: input.userId,
        name: `[Email] ${productName}`,
        mode: "operator",
        productName,
        productUrl: normalized.url,
        status: "draft",
      },
    });
    campaignId = campaign.id;

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

    const seqsToInclude: [string, typeof seqs.welcome][] = isFullSystem
      ? [
          ["welcome", seqs.welcome],
          ["cart", seqs.abandonedCart],
          ["post-purchase", seqs.postPurchase],
        ]
      : flowType.includes("Cart")
      ? [["cart", seqs.abandonedCart]]
      : flowType.includes("Post-Purchase")
      ? [["post-purchase", seqs.postPurchase]]
      : [["welcome", seqs.welcome]];

    for (const [seq, emails] of seqsToInclude) {
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
  } catch (err) {
    console.error("[EmailCampaign] Campaign create failed:", err);
  }

  // ── 5. Build broadcast template ───────────────────────────────────────────────
  const audience = packet.audience?.split(",")[0] || "your audience";
  const painCore = packet.painDesire?.split("→")[0].replace(/pain:/i, "").trim() || "their problem";

  const broadcastTemplate = {
    subject: assets.emailSequences.welcome?.[0]?.subject || `This changes everything for ${audience}`,
    previewText: assets.emailSequences.welcome?.[0]?.preview || "Open this before anyone else does.",
    body: assets.emailSequences.welcome?.[0]?.body || `Hi [First Name],\n\nIf you've been dealing with ${painCore}, this is for you.\n\n${packet.summary}\n\nClick here to learn more: ${normalized.url}\n\nTalk soon,\n[Your Name]`,
  };

  // Assemble email copy for review
  const allEmails = [
    ...(assets.emailSequences.welcome || []).map((e, i) => ({ seq: "Welcome", num: i + 1, ...e })),
    ...(assets.emailSequences.abandonedCart || []).map((e, i) => ({ seq: "Cart Recovery", num: i + 1, ...e })),
    ...(assets.emailSequences.postPurchase || []).map((e, i) => ({ seq: "Post-Purchase", num: i + 1, ...e })),
  ];

  return {
    ok: true,
    skill: SKILL,
    summary: `Built email campaign for "${productName}" — ${allEmails.length} emails across ${isFullSystem ? 3 : 1} sequence(s).`,
    created: { campaignId, emailFlowId },
    data: {
      productName,
      flowType,
      emails: allEmails,
      broadcastTemplate,
      totalEmails: allEmails.length,
      sequences: {
        welcome: assets.emailSequences.welcome?.length || 0,
        cart: assets.emailSequences.abandonedCart?.length || 0,
        postPurchase: assets.emailSequences.postPurchase?.length || 0,
      },
      analysis: {
        score: scoreResult.total,
        verdict: scoreResult.verdict,
        audience: packet.audience,
        painDesire: packet.painDesire,
        emailPotential: dimensions.emailLifecyclePotential,
      },
    },
  };
}

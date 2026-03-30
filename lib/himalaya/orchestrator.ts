/**
 * Himalaya Orchestrator
 *
 * Single entry point for both flows. Runs: Diagnose → Strategize → Generate → Save.
 * All data flows through typed contracts.
 */

import { prisma } from "@/lib/prisma";
import { getArchetype, type BusinessType } from "@/lib/archetypes";
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
import { runTruthEngine, getProfileForMode } from "@/rules/truthEngine";
import Anthropic from "@anthropic-ai/sdk";

import type {
  HimalayaInput,
  ScratchInput,
  ImproveInput,
  DiagnosisPayload,
  ScratchDiagnosis,
  ImproveDiagnosis,
  ArchetypeSnapshot,
  StrategyPayload,
  GenerationPayload,
  ResultsPayload,
  CreatedResources,
  SiteBlock,
  HomepagePayload,
} from "./contracts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export async function runHimalaya(
  input: HimalayaInput,
  userId: string | null
): Promise<ResultsPayload> {
  // Step 1: Diagnose
  const diagnosis = await diagnose(input);

  // Step 2: Strategize
  const strategy = await strategize(diagnosis);

  // Step 3: Generate
  const generated = await generate(diagnosis, strategy);

  // Step 4: Save
  const created = await save(generated, userId);

  // Step 5: Save business profile for scratch users
  if (userId && diagnosis.mode === "scratch" && "profile" in generated) {
    await saveBusinessProfile(userId, diagnosis as ScratchDiagnosis, generated);
  }

  return { mode: input.mode, diagnosis, strategy, generated, created };
}

// ─── Step 1: Diagnosis ───────────────────────────────────────────────────────

async function diagnose(input: HimalayaInput): Promise<DiagnosisPayload> {
  if (input.mode === "scratch") {
    return diagnoseScratch(input);
  }
  return diagnoseImprove(input);
}

function diagnoseScratch(input: ScratchInput): ScratchDiagnosis {
  const archetype = getArchetype(input.businessType as BusinessType);

  let snapshot: ArchetypeSnapshot | null = null;
  if (archetype) {
    snapshot = {
      label: archetype.label,
      acquisitionModel: archetype.acquisitionModel,
      salesProcess: archetype.salesProcess,
      funnelType: archetype.funnelType,
      conversionTriggers: archetype.conversionTriggers,
      topObjections: archetype.topObjections,
      winningAngles: archetype.winningAngles,
      systems: archetype.systems.map((s) => ({
        slug: s.slug,
        name: s.name,
        priority: s.priority,
        estimatedImpact: s.estimatedImpact,
        why: s.why,
      })),
    };
  }

  return {
    mode: "scratch",
    businessType: input.businessType,
    niche: input.niche,
    goal: input.goal,
    archetype: snapshot,
    description: input.description || null,
  };
}

async function diagnoseImprove(input: ImproveInput): Promise<ImproveDiagnosis> {
  const base: Omit<ImproveDiagnosis, "mode"> = {
    businessType: null,
    niche: null,
    goal: null,
    url: input.url || null,
    title: null,
    score: null,
    verdict: null,
    confidence: null,
    summary: null,
    strengths: null,
    weaknesses: null,
    breakdown: [],
    diagnostics: [],
    gaps: [],
    decisionPacket: null,
    challenge: input.challenge || null,
    businessDescription: input.businessDescription || null,
  };

  // No URL — description-only path
  if (!input.url) {
    return { mode: "improve", ...base, descriptionOnly: true };
  }

  // URL scan path
  const normalized = normalizeInput(input.url, "consultant");
  if (!normalized.valid) {
    return { mode: "improve", ...base, scanFailed: true };
  }

  const page = await fetchPage(normalized.url);
  if (!page.ok) {
    return { mode: "improve", ...base, scanFailed: true };
  }

  const linkType = classifyLink(normalized.url, page);
  const signals = extractSignals(page);
  const linkDiag = diagnoseLink(signals, linkType);
  const scoreResult = scoreOpportunity(signals, linkDiag, page);
  const packet = buildDecisionPacket(signals, linkDiag, scoreResult, linkType, "consultant");

  const dimensions = scoreOpportunityDimensions(signals, page);
  const classified = classifyOpportunity(dimensions);
  const gaps = detectOpportunityGaps(dimensions, signals);

  const truthProfile = getProfileForMode("consultant");
  const truthResult = runTruthEngine(dimensions, truthProfile);

  return {
    mode: "improve",
    businessType: null,
    niche: null,
    goal: null,
    url: normalized.url,
    title: page.title || signals.productName || normalized.url,
    score: truthResult.totalScore,
    verdict: truthResult.verdict,
    confidence: truthResult.confidence,
    summary: packet.summary,
    strengths: truthResult.strengthSummary,
    weaknesses: truthResult.weaknessSummary,
    breakdown: truthResult.breakdown,
    diagnostics: truthResult.diagnostics,
    gaps: Array.isArray(gaps) ? gaps : [],
    decisionPacket: {
      audience: packet.audience,
      painDesire: packet.painDesire,
      strengths: packet.strengths,
      weaknesses: packet.weaknesses,
      nextActions: packet.nextActions,
    },
    challenge: input.challenge || null,
    businessDescription: input.businessDescription || null,
  };
}

// ─── Step 2: Strategy ────────────────────────────────────────────────────────

async function strategize(diagnosis: DiagnosisPayload): Promise<StrategyPayload> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackStrategy(diagnosis);
  }

  const systemPrompt = `You are Himalaya's Strategy Engine — a business consultant that decides what to build, in what order, and why.

Return a JSON object (no markdown fences) with this exact structure:
{
  "summary": "1-2 sentence strategic assessment",
  "actions": [
    { "priority": 1, "action": "short action title", "why": "why this matters", "impact": "high", "engine": "profile" }
  ],
  "generateQueue": ["profile", "site", "email"],
  "defer": ["what to NOT build yet"]
}

Rules:
- Maximum 5 actions, ordered by priority
- Be specific and opinionated
- For scratch: always start with profile → site → email
- For improve: fix the biggest weakness first
- No motivational language. Decisions only.`;

  const userPrompt = diagnosis.mode === "scratch"
    ? `MODE: Starting from scratch
BUSINESS TYPE: ${diagnosis.businessType}
NICHE: ${diagnosis.niche}
GOAL: ${diagnosis.goal}
DESCRIPTION: ${diagnosis.description || "none"}
ARCHETYPE: ${diagnosis.archetype ? JSON.stringify(diagnosis.archetype) : "none"}

Decide what to build first.`
    : `MODE: Improving existing business
URL: ${(diagnosis as ImproveDiagnosis).url}
SCORE: ${(diagnosis as ImproveDiagnosis).score}/100
VERDICT: ${(diagnosis as ImproveDiagnosis).verdict}
STRENGTHS: ${(diagnosis as ImproveDiagnosis).strengths}
WEAKNESSES: ${(diagnosis as ImproveDiagnosis).weaknesses}
DIAGNOSTICS: ${JSON.stringify((diagnosis as ImproveDiagnosis).diagnostics)}
CHALLENGE: ${(diagnosis as ImproveDiagnosis).challenge}

Decide what to fix first.`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as StrategyPayload;
  } catch (e) {
    console.error("Strategy AI failed:", e);
  }

  return fallbackStrategy(diagnosis);
}

function fallbackStrategy(diagnosis: DiagnosisPayload): StrategyPayload {
  if (diagnosis.mode === "scratch") {
    return {
      summary: "Build your business foundation: profile, site, and follow-up system.",
      actions: [
        { priority: 1, action: "Create business profile and positioning", why: "Foundation for everything else", impact: "high", engine: "profile" },
        { priority: 2, action: "Build homepage", why: "You need a home base online", impact: "high", engine: "site" },
        { priority: 3, action: "Set up email follow-up", why: "Capture and nurture leads from day one", impact: "medium", engine: "email" },
      ],
      generateQueue: ["profile", "site", "email"],
      defer: ["Ads — build your foundation first", "Advanced automations — not needed yet"],
    };
  }

  return {
    summary: "Fix the biggest conversion blockers first, then build growth systems.",
    actions: [
      { priority: 1, action: "Fix site conversion issues", why: "Your site is leaking potential customers", impact: "high", engine: "site" },
      { priority: 2, action: "Strengthen offer clarity", why: "Visitors don't understand what you sell", impact: "high", engine: "profile" },
      { priority: 3, action: "Add follow-up system", why: "No follow-up means lost leads", impact: "medium", engine: "email" },
    ],
    generateQueue: ["site", "email"],
    defer: ["New ad campaigns — fix conversion first"],
  };
}

// ─── Step 3: Generation ──────────────────────────────────────────────────────

async function generate(
  diagnosis: DiagnosisPayload,
  strategy: StrategyPayload
): Promise<GenerationPayload> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("AI not configured. Set ANTHROPIC_API_KEY.");
  }

  const isImprove = diagnosis.mode === "improve";

  const systemPrompt = isImprove
    ? IMPROVE_GENERATION_SYSTEM
    : SCRATCH_GENERATION_SYSTEM;

  const userPrompt = isImprove
    ? `DIAGNOSIS:\n${JSON.stringify(diagnosis, null, 2)}\n\nSTRATEGY:\n${JSON.stringify(strategy, null, 2)}\n\nFix the biggest weaknesses. Rewrite homepage. Create follow-up emails. Generate ad angles. Build action roadmap.`
    : `BUSINESS TYPE: ${diagnosis.businessType}\nNICHE: ${diagnosis.niche}\nGOAL: ${diagnosis.goal}\nDESCRIPTION: ${(diagnosis as ScratchDiagnosis).description || "none"}\nARCHETYPE: ${JSON.stringify((diagnosis as ScratchDiagnosis).archetype)}\n\nSTRATEGY:\n${JSON.stringify(strategy, null, 2)}\n\nGenerate everything. Be specific to the niche. Write copy that converts.`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) throw new Error("Generation failed — no structured output returned.");

  return JSON.parse(match[0]) as GenerationPayload;
}

// ─── Step 4: Save to DB ─────────────────────────────────────────────────────

async function save(
  generated: GenerationPayload,
  userId: string | null
): Promise<CreatedResources> {
  const result: CreatedResources = { siteId: null, emailFlowId: null };
  if (!userId) return result;

  // Save site
  const homepage = "homepage" in generated ? generated.homepage : null;
  if (homepage) {
    try {
      const blocks = buildSiteBlocks(homepage);
      const profileName = "profile" in generated ? (generated.profile?.businessName || "Himalaya Site") : "Himalaya Site";

      const site = await prisma.site.create({
        data: {
          userId,
          name: profileName,
          slug: `himalaya-${Date.now()}`,
          published: false,
          theme: { primaryColor: "#06b6d4", font: "inter", mode: "dark" },
          pages: {
            create: {
              title: "Home",
              slug: "home",
              published: true,
              blocks: blocks as never,
              seoTitle: homepage.seoTitle ?? null,
              seoDesc: homepage.seoDesc ?? null,
            },
          },
        },
      });
      result.siteId = site.id;
    } catch (e) {
      console.error("Site save failed:", e);
    }
  }

  // Save email flow
  const emails = "emails" in generated ? generated.emails : null;
  if (emails?.sequence?.length) {
    try {
      const flow = await prisma.emailFlow.create({
        data: {
          userId,
          name: "Himalaya Starter Sequence",
          status: "draft",
          trigger: "manual",
          nodes: emails.sequence as never,
        },
      });
      result.emailFlowId = flow.id;
    } catch (e) {
      console.error("Email flow save failed:", e);
    }
  }

  return result;
}

async function saveBusinessProfile(
  userId: string,
  diagnosis: ScratchDiagnosis,
  generated: GenerationPayload
): Promise<void> {
  if (!("profile" in generated)) return;
  const profile = generated.profile;
  try {
    await prisma.businessProfile.upsert({
      where: { userId },
      create: {
        userId,
        businessType: diagnosis.businessType || "",
        businessName: profile.businessName || null,
        niche: diagnosis.niche || "",
        mainOffer: profile.offer || null,
        targetAudience: profile.targetAudience || null,
        stage: "starting",
      },
      update: {
        businessName: profile.businessName || undefined,
        mainOffer: profile.offer || undefined,
        targetAudience: profile.targetAudience || undefined,
      },
    });
  } catch (e) {
    console.error("Business profile save failed:", e);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSiteBlocks(homepage: HomepagePayload): SiteBlock[] {
  const now = Date.now();
  const blocks: SiteBlock[] = [];

  blocks.push({
    id: `hero-${now}`,
    type: "hero",
    props: {
      headline: homepage.headline,
      subheadline: homepage.subheadline,
      buttonText: homepage.heroButtonText || "Get Started",
    },
  });

  if (homepage.sections) {
    for (const section of homepage.sections) {
      blocks.push({
        id: `${section.type}-${now}-${Math.random().toString(36).slice(2, 6)}`,
        type: section.type,
        props: { ...section },
      });
    }
  }

  return blocks;
}

// ─── Prompt Constants ────────────────────────────────────────────────────────

const SCRATCH_GENERATION_SYSTEM = `You are Himalaya's Generation Engine — a world-class business strategist and copywriter.

Return a single JSON object (no markdown fences) with this exact structure:
{
  "profile": {
    "businessName": "...",
    "positioning": "one-line positioning",
    "targetAudience": "specific audience",
    "offer": "core offer",
    "differentiator": "what makes this different",
    "priceRange": "suggested range"
  },
  "idealCustomer": {
    "demographics": "who they are",
    "painPoints": ["...", "...", "..."],
    "desires": ["...", "...", "..."],
    "buyingTriggers": ["...", "..."]
  },
  "homepage": {
    "headline": "...",
    "subheadline": "...",
    "heroButtonText": "...",
    "sections": [
      { "type": "features", "title": "...", "items": [{"title":"...","body":"..."}] },
      { "type": "testimonials", "title": "...", "items": [{"name":"...","quote":"..."}] },
      { "type": "faq", "items": [{"q":"...","a":"..."}] },
      { "type": "cta", "headline": "...", "buttonText": "..." }
    ],
    "seoTitle": "...",
    "seoDesc": "..."
  },
  "marketingAngles": [
    { "angle": "name", "hook": "the hook line", "platform": "best platform" }
  ],
  "emails": {
    "sequence": [
      { "name": "...", "subject": "...", "preview": "...", "body": "...", "delayDays": 0 }
    ]
  },
  "roadmap": {
    "thisWeek": ["...", "..."],
    "thisMonth": ["...", "..."],
    "thisQuarter": ["...", "..."]
  }
}

Be specific. Use the niche and business type. Write copy that converts, not filler.`;

const IMPROVE_GENERATION_SYSTEM = `You are Himalaya's Generation Engine — a world-class business optimizer.

Return a single JSON object (no markdown fences) with this exact structure:
{
  "audit": {
    "overallScore": 0-100,
    "summary": "1-2 sentence assessment",
    "strengths": ["..."],
    "weaknesses": ["ranked by impact"]
  },
  "fixes": [
    { "priority": 1, "area": "site|offer|trust|conversion|followup|brand", "problem": "...", "fix": "...", "impact": "high|medium|low" }
  ],
  "homepage": {
    "headline": "...",
    "subheadline": "...",
    "heroButtonText": "...",
    "sections": [...],
    "seoTitle": "...",
    "seoDesc": "..."
  },
  "marketingAngles": [
    { "angle": "...", "hook": "...", "platform": "..." }
  ],
  "emails": {
    "sequence": [
      { "name": "...", "subject": "...", "preview": "...", "body": "...", "delayDays": 0 }
    ]
  },
  "roadmap": {
    "thisWeek": ["...", "..."],
    "thisMonth": ["...", "..."],
    "thisQuarter": ["...", "..."]
  }
}

Every fix must tie back to the diagnosis. Be specific about what's broken and how to fix it.`;

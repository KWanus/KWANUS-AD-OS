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
  ScratchGeneration,
  ImproveGeneration,
  ResultsPayload,
  CreatedResources,
  SiteBlock,
  HomepagePayload,
  StageStatus,
  StageTrace,
  RunTrace,
} from "./contracts";
import { extractJson, withTimeout } from "./utils";
import { runFullResearch, type NicheIntelligence } from "@/lib/sites/competitorResearch";
import { enrichPromptWithResearch } from "@/lib/sites/researchInformedGeneration";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Tracing Helpers ────────────────────────────────────────────────────────

function newStageTrace(): StageTrace {
  return {
    status: "failed",
    startedAt: new Date().toISOString(),
    completedAt: null,
    durationMs: null,
    fallbackUsed: false,
    warnings: [],
    error: null,
  };
}

function completeStage(trace: StageTrace, status: StageStatus): StageTrace {
  const now = new Date();
  trace.status = status;
  trace.completedAt = now.toISOString();
  trace.durationMs = now.getTime() - new Date(trace.startedAt).getTime();
  return trace;
}

function generateRunId(): string {
  return `hml_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Minimum Viable Output Validation ───────────────────────────────────────

function validateDiagnosis(d: ScratchDiagnosis | ImproveDiagnosis): string[] {
  const warnings: string[] = [];
  if (!d.mode) warnings.push("Missing mode");
  if (d.mode === "scratch") {
    const s = d as ScratchDiagnosis;
    if (!s.businessType) warnings.push("Missing businessType");
    if (!s.niche) warnings.push("Missing niche");
    if (!s.goal) warnings.push("Missing goal");
  } else {
    const imp = d as ImproveDiagnosis;
    if (!imp.url && !imp.businessDescription) warnings.push("No URL or description provided");
    if (imp.scanFailed) warnings.push("URL scan failed — running in description-only mode");
  }
  return warnings;
}

function validateStrategy(s: StrategyPayload): string[] {
  const warnings: string[] = [];
  if (!s.summary) warnings.push("Missing strategy summary");
  if (!s.actions?.length) warnings.push("No strategic actions generated");
  if (!s.generateQueue?.length) warnings.push("Empty generation queue");
  return warnings;
}

function validateGeneration(g: ScratchGeneration | ImproveGeneration): string[] {
  const warnings: string[] = [];
  const hasHomepage = "homepage" in g && g.homepage?.headline;
  const hasEmails = "emails" in g && g.emails?.sequence?.length;
  const hasRoadmap = "roadmap" in g && g.roadmap?.thisWeek?.length;

  if (!hasHomepage) warnings.push("No homepage generated");
  if (!hasEmails) warnings.push("No email sequence generated");
  if (!hasRoadmap) warnings.push("No roadmap generated");

  if ("profile" in g) {
    const profile = g.profile;
    if (!profile?.businessName) warnings.push("Missing business name in profile");
    if (!profile?.offer) warnings.push("Missing offer in profile");
  }
  if ("audit" in g) {
    const audit = g.audit;
    if (audit?.overallScore == null) warnings.push("Missing audit score");
    if (!g.fixes?.length) warnings.push("No fixes generated");
  }
  return warnings;
}

function deriveStatus(warnings: string[], failed: boolean): StageStatus {
  if (failed) return "failed";
  if (warnings.length === 0) return "success";
  return "partial";
}

// ─── Main Orchestrator ───────────────────────────────────────────────────────

export async function runHimalaya(
  input: HimalayaInput,
  userId: string | null
): Promise<ResultsPayload> {
  const runId = generateRunId();
  const startedAt = new Date().toISOString();

  const traces: {
    diagnosis: StageTrace;
    strategy: StageTrace;
    research?: StageTrace;
    generation: StageTrace;
    save: StageTrace;
  } = {
    diagnosis: newStageTrace(),
    strategy: newStageTrace(),
    generation: newStageTrace(),
    save: newStageTrace(),
  };

  // Step 1: Diagnose
  const diagnosisRaw = await diagnose(input);
  const diagWarnings = validateDiagnosis(diagnosisRaw);
  const diagStatus = deriveStatus(diagWarnings, false);
  completeStage(traces.diagnosis, diagStatus);
  traces.diagnosis.warnings = diagWarnings;
  const diagnosis: DiagnosisPayload = { ...diagnosisRaw, status: diagStatus, warnings: diagWarnings };

  // Step 2: Strategize
  const { result: strategyRaw, fallbackUsed: strategyFallback } = await strategize(diagnosis);
  const stratWarnings = validateStrategy(strategyRaw);
  if (strategyFallback) stratWarnings.push("Used fallback strategy (AI unavailable)");
  const stratStatus: StageStatus = strategyFallback ? "fallback" : deriveStatus(stratWarnings, false);
  completeStage(traces.strategy, stratStatus);
  traces.strategy.fallbackUsed = strategyFallback;
  traces.strategy.warnings = stratWarnings;
  const strategy: StrategyPayload = { ...strategyRaw, status: stratStatus, warnings: stratWarnings };

  // Step 2.5: Research (competitor intelligence for site generation)
  let nicheIntelligence: NicheIntelligence | null = null;
  const shouldResearch = input.mode === "scratch" && strategy.generateQueue?.includes("site");
  if (shouldResearch) {
    traces.research = newStageTrace();
    try {
      const niche = (input as ScratchInput).niche;
      const { intelligence } = await runFullResearch(niche);
      nicheIntelligence = intelligence;
      completeStage(traces.research, "success");
    } catch (e) {
      completeStage(traces.research, "fallback");
      traces.research.fallbackUsed = true;
      traces.research.warnings = ["Research failed, generating without competitor data"];
      traces.research.error = e instanceof Error ? e.message : "Research failed";
    }
  }

  // Step 3: Generate
  let generated: GenerationPayload;
  try {
    const genRaw = await generate(diagnosis, strategy, nicheIntelligence);
    const genWarnings = validateGeneration(genRaw);
    const genStatus = deriveStatus(genWarnings, false);
    completeStage(traces.generation, genStatus);
    traces.generation.warnings = genWarnings;
    generated = { ...genRaw, status: genStatus, warnings: genWarnings };
  } catch (e) {
    completeStage(traces.generation, "failed");
    traces.generation.error = e instanceof Error ? e.message : "Generation failed";
    throw e;
  }

  // Step 4: Save
  let created: CreatedResources;
  try {
    created = await saveGeneratedAssets(generated, userId);

    if (userId && diagnosis.mode === "scratch" && "profile" in generated) {
      await saveBusinessProfile(userId, diagnosis as ScratchDiagnosis, generated);
    }

    const saveWarnings: string[] = [];
    if (userId && !created.siteId) saveWarnings.push("Site save skipped or failed");
    if (userId && !created.emailFlowId) saveWarnings.push("Email flow save skipped or failed");
    const saveStatus = !userId ? "success" : deriveStatus(saveWarnings, false);
    completeStage(traces.save, saveStatus);
    traces.save.warnings = saveWarnings;
  } catch (e) {
    completeStage(traces.save, "failed");
    traces.save.error = e instanceof Error ? e.message : "Save failed";
    created = { siteId: null, emailFlowId: null };
  }

  const trace: RunTrace = {
    runId,
    userId,
    mode: input.mode,
    startedAt,
    completedAt: new Date().toISOString(),
    stages: traces,
    createdResources: created,
  };

  return { mode: input.mode, diagnosis, strategy, generated, created, trace };
}

// ─── Step 1: Diagnosis ───────────────────────────────────────────────────────

async function diagnose(input: HimalayaInput): Promise<ScratchDiagnosis | ImproveDiagnosis> {
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
    goal: input.goal || null,
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
    goal: input.goal || null,
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

async function strategize(
  diagnosis: DiagnosisPayload
): Promise<{ result: StrategyPayload; fallbackUsed: boolean }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { result: fallbackStrategy(diagnosis), fallbackUsed: true };
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
DESCRIPTION: ${(diagnosis as ScratchDiagnosis).description || "none"}
ARCHETYPE: ${(diagnosis as ScratchDiagnosis).archetype ? JSON.stringify((diagnosis as ScratchDiagnosis).archetype) : "none"}

Decide what to build first.`
    : `MODE: Improving existing business
URL: ${(diagnosis as ImproveDiagnosis).url}
SCORE: ${(diagnosis as ImproveDiagnosis).score}/100
VERDICT: ${(diagnosis as ImproveDiagnosis).verdict}
STRENGTHS: ${(diagnosis as ImproveDiagnosis).strengths}
WEAKNESSES: ${(diagnosis as ImproveDiagnosis).weaknesses}
DIAGNOSTICS: ${JSON.stringify((diagnosis as ImproveDiagnosis).diagnostics)}
GOAL: ${diagnosis.goal || "not specified"}
CHALLENGE: ${(diagnosis as ImproveDiagnosis).challenge}

Decide what to fix first.`;

  try {
    const msg = await withTimeout(
      anthropic.messages.create({
        model: "claude-sonnet-4-6-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      30000,
      "Strategy"
    );

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonStr = extractJson(raw);
    if (jsonStr) return { result: JSON.parse(jsonStr) as StrategyPayload, fallbackUsed: false };
  } catch (e) {
    console.error("Strategy AI failed:", e);
  }

  return { result: fallbackStrategy(diagnosis), fallbackUsed: true };
}

function fallbackStrategy(diagnosis: DiagnosisPayload): StrategyPayload {
  if (diagnosis.mode === "scratch") {
    return {
      status: "fallback",
      warnings: ["Used deterministic fallback strategy"],
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
    status: "fallback",
    warnings: ["Used deterministic fallback strategy"],
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
  strategy: StrategyPayload,
  nicheIntelligence?: NicheIntelligence | null
): Promise<ScratchGeneration | ImproveGeneration> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("AI not configured. Set ANTHROPIC_API_KEY.");
  }

  const isImprove = diagnosis.mode === "improve";

  const systemPrompt = isImprove
    ? IMPROVE_GENERATION_SYSTEM
    : SCRATCH_GENERATION_SYSTEM;

  let userPrompt = isImprove
    ? `DIAGNOSIS:\n${JSON.stringify(diagnosis, null, 2)}\n\nSTRATEGY:\n${JSON.stringify(strategy, null, 2)}\n\nFix the biggest weaknesses. Rewrite homepage. Create follow-up emails. Generate ad angles. Build action roadmap.`
    : `BUSINESS TYPE: ${diagnosis.businessType}\nNICHE: ${diagnosis.niche}\nGOAL: ${diagnosis.goal}\nDESCRIPTION: ${(diagnosis as ScratchDiagnosis).description || "none"}\nARCHETYPE: ${JSON.stringify((diagnosis as ScratchDiagnosis).archetype)}\n\nSTRATEGY:\n${JSON.stringify(strategy, null, 2)}\n\nGenerate everything. Be specific to the niche. Write copy that converts.`;

  if (nicheIntelligence) {
    userPrompt = enrichPromptWithResearch(userPrompt, nicheIntelligence);
  }

  const msg = await withTimeout(
    anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    50000,
    "Generation"
  );

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonStr = extractJson(raw);

  if (!jsonStr) throw new Error("Generation failed — no structured output returned.");

  return JSON.parse(jsonStr) as ScratchGeneration | ImproveGeneration;
}

// ─── Step 4: Save to DB ─────────────────────────────────────────────────────

export async function saveGeneratedAssets(
  generated: GenerationPayload,
  userId: string | null
): Promise<CreatedResources> {
  const result: CreatedResources = { siteId: null, emailFlowId: null };
  if (!userId) return result;

  const homepage = "homepage" in generated ? generated.homepage : null;
  const emails = "emails" in generated ? generated.emails : null;

  const saves: Promise<void>[] = [];

  // Save site
  if (homepage) {
    saves.push(
      (async () => {
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
      })()
    );
  }

  // Save email flow
  if (emails?.sequence?.length) {
    saves.push(
      (async () => {
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
      })()
    );
  }

  const outcomes = await Promise.allSettled(saves);
  for (const outcome of outcomes) {
    if (outcome.status === "rejected") {
      console.error("Asset save failed:", outcome.reason);
    }
  }

  return result;
}

export async function saveBusinessProfile(
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

export function buildSiteBlocks(homepage: HomepagePayload): SiteBlock[] {
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

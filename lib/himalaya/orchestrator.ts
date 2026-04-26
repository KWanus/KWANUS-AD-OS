import { prisma } from "@/lib/prisma";
import type {
  HimalayaUserInput,
  HimalayaPayload,
  StrategyDecision,
  GenerationTarget,
  GenerationOutput,
  SiteHandoff,
  EmailHandoff,
  StageStatus,
  PipelineStage,
  PipelineTrace,
  HimalayaPipelineResult,
} from "./contracts";
import type { BusinessFoundation } from "./foundationGenerator";
import type { RawAnalysis } from "./types";
import type { HimalayaProfileInput, BusinessPath } from "./profileTypes";
import { generateFoundation } from "./foundationGenerator";
import { runNicheIntelligence } from "./nicheIntelligence";
import { generateIntelligentFoundation } from "./intelligentFoundation";
import { runScanPipeline } from "./scanAdapter";
import { getUserAccess, incrementUsage } from "./access";

// ---------------------------------------------------------------------------
// STAGE RUNNER — runs a stage with timing, fallback, and status tracking
// ---------------------------------------------------------------------------

async function runStage<T>(
  name: string,
  stages: PipelineStage[],
  fn: () => T | Promise<T>,
  fallback: T,
  fallbackWarning: string,
): Promise<{ data: T; status: StageStatus; warnings: string[] }> {
  const started = Date.now();
  const startedAt = new Date().toISOString();
  const warnings: string[] = [];
  let status: StageStatus = "success";
  let data: T;

  try {
    data = await fn();
  } catch (err) {
    console.error(`[Himalaya] Stage "${name}" failed:`, err);
    data = fallback;
    status = "fallback";
    warnings.push(fallbackWarning);
  }

  const durationMs = Date.now() - started;
  stages.push({
    name,
    status,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs,
    fallbackUsed: status === "fallback",
    warnings,
  });

  return { data, status, warnings };
}

// ---------------------------------------------------------------------------
// NORMALIZERS
// ---------------------------------------------------------------------------

function normalizeScratchPayload(
  foundation: BusinessFoundation,
  profileId: string,
  niche: string,
  goal: string,
): HimalayaPayload {
  return {
    mode: "scratch",
    businessType: foundation.path,
    niche: niche || foundation.businessProfile.niche,
    goal,
    sourceInputs: { type: "profile", profileId },
    diagnosis: {
      audience: foundation.idealCustomer.who,
      painPoint: foundation.businessProfile.painPoint,
      angle: foundation.businessProfile.uniqueAngle,
      strengths: [foundation.offerDirection.coreOffer, foundation.offerDirection.transformation],
      weaknesses: [],
      risks: [],
      score: 70,
      confidence: "High",
    },
    scores: null,
    detectedProblems: [],
    recommendations: foundation.actionRoadmap[0]?.tasks ?? [],
  };
}

export function normalizeImprovePayload(raw: RawAnalysis): HimalayaPayload {
  const packet = raw.decisionPacket as Record<string, unknown> | null;
  const opp = raw.opportunityAssessments[0];

  const dimensions = opp
    ? [
        { key: "demandPotential", label: "Demand", value: opp.demandPotential ?? 0 },
        { key: "offerStrength", label: "Offer", value: opp.offerStrength ?? 0 },
        { key: "emotionalLeverage", label: "Emotion", value: opp.emotionalLeverage ?? 0 },
        { key: "trustCredibility", label: "Trust", value: opp.trustCredibility ?? 0 },
        { key: "conversionReadiness", label: "Conversion", value: opp.conversionReadiness ?? 0 },
        { key: "adViability", label: "Ad Viability", value: opp.adViability ?? 0 },
        { key: "emailLifecyclePotential", label: "Email", value: opp.emailLifecyclePotential ?? 0 },
        { key: "seoPotential", label: "SEO", value: opp.seoPotential ?? 0 },
        { key: "differentiation", label: "Differentiation", value: opp.differentiation ?? 0 },
        { key: "risk", label: "Risk", value: opp.risk ?? 0 },
      ]
    : [];

  return {
    mode: "improve",
    businessType: raw.linkType ?? "unknown",
    niche: (packet?.audience as string) ?? "",
    goal: "fix_existing",
    sourceInputs: { type: "url_scan", scanUrl: raw.inputUrl },
    diagnosis: {
      audience: (packet?.audience as string) ?? "",
      painPoint: (packet?.painDesire as string) ?? "",
      angle: (packet?.angle as string) ?? "",
      strengths: (packet?.strengths as string[]) ?? [],
      weaknesses: (packet?.weaknesses as string[]) ?? [],
      risks: (packet?.risks as string[]) ?? [],
      score: raw.score ?? 0,
      confidence: (raw.confidence as "High" | "Medium" | "Low") ?? "Medium",
    },
    scores: opp ? { overall: opp.totalScore ?? 0, dimensions } : null,
    detectedProblems: (opp?.topGaps as string[]) ?? [],
    recommendations: (packet?.nextActions as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// STRATEGY ENGINE
// ---------------------------------------------------------------------------

export function runStrategy(payload: HimalayaPayload): StrategyDecision {
  const priorities: StrategyDecision["priorities"] = [];
  const targets: GenerationTarget[] = [];
  const deferred: StrategyDecision["deferred"] = [];
  const reasoning: string[] = [];

  if (payload.mode === "scratch") {
    priorities.push(
      { label: "Define your business identity", reason: "Everything else depends on clear positioning", action: "Review and refine the business profile and ideal customer" },
      { label: "Build your core offer", reason: "Revenue starts when you have something to sell", action: "Finalize offer direction with pricing and guarantee" },
      { label: "Create your first assets", reason: "You need a presence to start attracting people", action: "Build homepage, set up email capture, launch first marketing angles" },
    );
    targets.push("business_profile", "ideal_customer", "offer_direction", "website_blueprint", "homepage_copy", "marketing_angles", "email_sequence", "action_roadmap");
    deferred.push(
      { target: "ad_scripts", reason: "Create ads after your landing page is live and tested" },
      { target: "execution_checklist", reason: "Follow the action roadmap first" },
    );
    reasoning.push(
      `Business type "${payload.businessType}" selected as best fit for your situation.`,
      `Target audience: ${payload.diagnosis.audience || "to be refined during setup"}.`,
      `Starting with identity and offer ensures everything downstream is aligned.`,
      `Marketing assets are generated to match your specific niche and positioning.`,
    );
  } else {
    const weakDimensions = (payload.scores?.dimensions ?? [])
      .filter((d) => d.key !== "risk" && d.value < 45)
      .sort((a, b) => a.value - b.value);
    const problems = payload.detectedProblems;

    if (problems.length > 0) {
      priorities.push({ label: `Fix: ${problems[0]}`, reason: "Highest-impact gap identified", action: payload.recommendations[0] || "Address this gap first" });
    }
    if (weakDimensions.length > 0) {
      priorities.push({ label: `Improve ${weakDimensions[0].label.toLowerCase()} (${weakDimensions[0].value}/100)`, reason: "Lowest scoring dimension", action: `Focus rebuild on ${weakDimensions[0].label.toLowerCase()}` });
    }
    if (problems.length > 1) {
      priorities.push({ label: `Fix: ${problems[1]}`, reason: "Second priority gap", action: payload.recommendations[1] || "Address after primary fix" });
    }
    if (priorities.length === 0) {
      priorities.push({ label: "Review and optimize current assets", reason: "No critical issues — focus on refinement", action: "Apply strongest improvements" });
    }

    targets.push("landing_page", "marketing_angles", "email_sequence");
    if (weakDimensions.some((d) => ["Conversion", "Trust"].includes(d.label)) || payload.diagnosis.score < 50) targets.push("website_blueprint");
    if (weakDimensions.some((d) => d.key === "adViability")) targets.push("ad_hooks", "ad_scripts");
    targets.push("action_roadmap");

    reasoning.push(`Overall score: ${payload.diagnosis.score}/100.`);
    if (weakDimensions.length > 0) reasoning.push(`Weakest: ${weakDimensions[0].label} at ${weakDimensions[0].value}/100.`);
    if (problems.length > 0) reasoning.push(`${problems.length} gap${problems.length > 1 ? "s" : ""} detected — priorities ordered by impact.`);
    reasoning.push("Generated assets target specific weaknesses, not generic improvements.");
  }

  return { priorities: priorities.slice(0, 3), generationTargets: [...new Set(targets)], deferred, reasoning: reasoning.slice(0, 4) };
}

// ---------------------------------------------------------------------------
// GENERATION EXTRACTORS
// ---------------------------------------------------------------------------

function extractGenerationFromScan(raw: RawAnalysis): GenerationOutput {
  const assets = raw.assetPackages[0];
  const packet = raw.decisionPacket as Record<string, unknown> | null;

  return {
    businessProfile: packet
      ? {
          businessType: raw.linkType ?? "unknown",
          niche: (packet.audience as string) ?? "",
          targetCustomer: (packet.audience as string) ?? "",
          painPoint: (packet.painDesire as string) ?? "",
          uniqueAngle: (packet.angle as string) ?? "",
        }
      : null,
    idealCustomer: null,
    offerDirection: null,
    websiteBlueprint: assets?.landingPage
      ? {
          headline: ((assets.landingPage as Record<string, unknown>).headline as string) ?? "",
          subheadline: ((assets.landingPage as Record<string, unknown>).subheadline as string) ?? "",
          heroCtaText: ((assets.landingPage as Record<string, unknown>).ctaCopy as string) ?? "",
          sections: ((assets.landingPage as Record<string, unknown>).sections as string[]) ?? [],
          trustElements: ((assets.landingPage as Record<string, unknown>).trustBar as string[]) ?? [],
          urgencyLine: ((assets.landingPage as Record<string, unknown>).urgencyLine as string) ?? "",
        }
      : null,
    marketingAngles: assets?.adHooks?.map((h: { format: string; hook: string }) => ({ hook: h.hook, angle: h.format, platform: h.format })) ?? null,
    emailSequence: null,
    adHooks: assets?.adHooks ?? null,
    adScripts: assets?.adScripts ?? null,
    actionRoadmap: null,
  };
}

function extractGenerationFromFoundation(f: BusinessFoundation): GenerationOutput {
  return {
    businessProfile: f.businessProfile,
    idealCustomer: f.idealCustomer,
    offerDirection: f.offerDirection,
    websiteBlueprint: f.websiteBlueprint,
    marketingAngles: f.marketingAngles,
    emailSequence: f.emailSequence,
    adHooks: f.marketingAngles.map((a) => ({ format: a.platform, hook: a.hook })),
    adScripts: null,
    actionRoadmap: f.actionRoadmap,
  };
}

// ---------------------------------------------------------------------------
// HANDOFF BUILDERS
// ---------------------------------------------------------------------------

export function buildSiteHandoff(gen: GenerationOutput): SiteHandoff | null {
  if (!gen.websiteBlueprint) return null;
  return {
    headline: gen.websiteBlueprint.headline,
    subheadline: gen.websiteBlueprint.subheadline,
    ctaText: gen.websiteBlueprint.heroCtaText,
    sections: gen.websiteBlueprint.sections,
    trustElements: gen.websiteBlueprint.trustElements,
    urgencyLine: gen.websiteBlueprint.urgencyLine,
  };
}

export function buildEmailHandoff(gen: GenerationOutput): EmailHandoff | null {
  if (!gen.emailSequence || gen.emailSequence.length === 0) return null;
  return { sequenceName: "Himalaya Generated Sequence", emails: gen.emailSequence };
}

// ---------------------------------------------------------------------------
// runHimalaya() — THE SINGLE CANONICAL ENTRY POINT
// ---------------------------------------------------------------------------

export async function runHimalaya(
  input: HimalayaUserInput,
  userId: string,
): Promise<HimalayaPipelineResult> {
  // Check access before running
  const access = await getUserAccess(userId).catch(() => null);
  if (access && !access.canRun) {
    const emptyTrace: PipelineTrace = { runId: "blocked", userId, mode: input.mode, stages: [], totalDurationMs: 0, overallStatus: "failed", savedEntityIds: {}, createdAt: new Date().toISOString() };
    return {
      success: false, runId: null, mode: input.mode, payload: null, strategy: null, generation: null,
      siteHandoff: null, emailHandoff: null, trace: emptyTrace,
      title: "Run limit reached", summary: `You've used all ${access.usage.runsUsed} runs on your ${access.tier} plan. Upgrade to continue.`,
    };
  }

  const pipelineStart = Date.now();
  const stages: PipelineStage[] = [];
  const allWarnings: string[] = [];

  let payload: HimalayaPayload | null = null;
  let strategy: StrategyDecision | null = null;
  let generation: GenerationOutput | null = null;
  let siteHandoff: SiteHandoff | null = null;
  let emailHandoff: EmailHandoff | null = null;
  let runId: string | null = null;
  let title = "";
  let foundationData: BusinessFoundation | null = null;
  let intelData: unknown = null;
  let summary = "";

  // ── STAGE 1: DIAGNOSE ─────────────────────────────────────────────────
  if (input.mode === "scratch") {
    // Scratch: load profile → generate foundation → normalize
    const diagResult = await runStage(
      "diagnose",
      stages,
      async () => {
        if (!input.profileId || !input.path) throw new Error("profileId and path required for scratch");

        const profile = await prisma.himalayaProfile.findFirst({
          where: { id: input.profileId, userId },
        });
        if (!profile) throw new Error("Profile not found");

        const profileInput: HimalayaProfileInput = {
          budget: profile.budget as HimalayaProfileInput["budget"],
          timeAvailable: profile.timeAvailable as HimalayaProfileInput["timeAvailable"],
          skills: profile.skills as HimalayaProfileInput["skills"],
          riskTolerance: profile.riskTolerance as HimalayaProfileInput["riskTolerance"],
          primaryGoal: profile.primaryGoal as HimalayaProfileInput["primaryGoal"],
          businessStage: profile.businessStage as HimalayaProfileInput["businessStage"],
          existingUrl: profile.existingUrl ?? undefined,
          niche: profile.niche ?? undefined,
          description: profile.description ?? undefined,
        };

        // Run niche intelligence: find competitors, scan them, analyze market
        let foundation: BusinessFoundation;
        let intel = null;
        try {
          const niche = profile.niche || profile.description || input.path || "";
          intel = await runNicheIntelligence(niche, input.path as string);
          // Generate foundation using real competitive intelligence + Claude
          foundation = await generateIntelligentFoundation(profileInput, input.path as BusinessPath, intel);
        } catch (err) {
          console.warn("[Orchestrator] Intelligent generation failed, using template fallback:", err);
          foundation = await generateFoundation(profileInput, input.path as BusinessPath);
        }

        const normalized = normalizeScratchPayload(foundation, input.profileId!, profile.niche ?? "", profile.primaryGoal);

        title = `${foundation.pathLabel}: ${profile.niche || "New Business"}`;
        return { payload: normalized, foundation, intel };
      },
      { payload: null as HimalayaPayload | null, foundation: null as BusinessFoundation | null, intel: null as unknown },
      "Diagnosis failed — using minimal fallback",
    );

    payload = diagResult.data.payload;
    foundationData = diagResult.data.foundation;
    intelData = diagResult.data.intel;
    allWarnings.push(...diagResult.warnings);

    // ── STAGE 2: STRATEGIZE ───────────────────────────────────────────────
    const stratResult = await runStage(
      "strategize",
      stages,
      () => {
        if (!payload) throw new Error("No payload from diagnosis");
        return runStrategy(payload);
      },
      { priorities: [{ label: "Review generated foundation", reason: "Strategy unavailable", action: "Start with the business profile" }], generationTargets: ["business_profile", "action_roadmap"] as GenerationTarget[], deferred: [], reasoning: ["Fallback strategy applied."] },
      "Strategy engine failed — using deterministic fallback priorities",
    );
    strategy = stratResult.data;
    allWarnings.push(...stratResult.warnings);

    // ── STAGE 3: GENERATE ─────────────────────────────────────────────────
    const genResult = await runStage(
      "generate",
      stages,
      () => {
        const f = diagResult.data.foundation;
        if (!f) throw new Error("No foundation to generate from");
        return extractGenerationFromFoundation(f);
      },
      { businessProfile: null, idealCustomer: null, offerDirection: null, websiteBlueprint: null, marketingAngles: null, emailSequence: null, adHooks: null, adScripts: null, actionRoadmap: null },
      "Generation failed — partial output returned",
    );
    generation = genResult.data;
    allWarnings.push(...genResult.warnings);

  } else {
    // ══ IMPROVE PATH ════════════════════════════════════════════════════
    // Run full scan pipeline → normalize → strategize

    // ── STAGE 1: DIAGNOSE (scan + analyze URL) ──────────────────────────
    const diagResult = await runStage(
      "diagnose",
      stages,
      async () => {
        if (!input.url) throw new Error("URL required for improve path");

        // Run the full scan pipeline
        const scanResult = await runScanPipeline(input.url, "consultant", userId);
        if (!scanResult.success || !scanResult.analysisId) {
          throw new Error(scanResult.error ?? "Scan failed");
        }

        // Load the saved analysis to normalize
        const raw = await prisma.analysisRun.findUnique({
          where: { id: scanResult.analysisId },
          include: { opportunityAssessments: true, assetPackages: true },
        });
        if (!raw) throw new Error("Scan saved but could not be loaded");

        const normalized = normalizeImprovePayload(raw as unknown as RawAnalysis);
        title = raw.title ?? `Improve: ${input.url}`;

        // Run niche intelligence on the same market to find competitors
        let improveIntel = null;
        try {
          const niche = input.niche || normalized.niche || raw.title || "";
          const bizType = raw.linkType || "business";
          if (niche) {
            improveIntel = await runNicheIntelligence(niche, bizType);
          }
        } catch {
          // intel is optional for improve path
        }

        return { payload: normalized, analysisId: scanResult.analysisId, intel: improveIntel };
      },
      { payload: null as HimalayaPayload | null, analysisId: null as string | null, intel: null as unknown },
      "Scan failed — could not analyze the URL",
    );

    payload = diagResult.data.payload;
    if (diagResult.data.analysisId) runId = diagResult.data.analysisId;
    if (diagResult.data.intel) intelData = diagResult.data.intel;
    allWarnings.push(...diagResult.warnings);

    // ── STAGE 2: STRATEGIZE ───────────────────────────────────────────────
    if (payload) {
      const stratResult = await runStage(
        "strategize",
        stages,
        () => runStrategy(payload!),
        { priorities: [{ label: "Review scan results", reason: "Strategy unavailable", action: "Check weaknesses manually" }], generationTargets: [] as GenerationTarget[], deferred: [], reasoning: ["Fallback: review scan output directly."] },
        "Strategy engine failed on improve path",
      );
      strategy = stratResult.data;
      allWarnings.push(...stratResult.warnings);

      // Save strategy data back to the analysis run
      if (runId && strategy) {
        try {
          const existing = await prisma.analysisRun.findUnique({ where: { id: runId }, select: { rawSignals: true } });
          const signals = (existing?.rawSignals as Record<string, unknown>) ?? {};
          await prisma.analysisRun.update({
            where: { id: runId },
            data: { rawSignals: { ...signals, nicheIntelligence: intelData, himalayaPayload: payload, himalayaStrategy: strategy } as object },
          });
        } catch {
          // non-blocking
        }
      }
    }

    // For improve path, generation already happened in the scan pipeline
    // Extract it from the saved asset package
    if (runId) {
      const genResult = await runStage(
        "generate",
        stages,
        async () => {
          const raw = await prisma.analysisRun.findUnique({
            where: { id: runId! },
            include: { opportunityAssessments: true, assetPackages: true },
          });
          if (!raw) throw new Error("Could not load generated assets");
          return extractGenerationFromScan(raw as unknown as RawAnalysis);
        },
        { businessProfile: null, idealCustomer: null, offerDirection: null, websiteBlueprint: null, marketingAngles: null, emailSequence: null, adHooks: null, adScripts: null, actionRoadmap: null },
        "Could not extract generation output from scan",
      );
      generation = genResult.data;
      allWarnings.push(...genResult.warnings);
    }
  }

  // ── STAGE 4: BUILD HANDOFFS ───────────────────────────────────────────
  if (generation) {
    const handoffResult = await runStage(
      "handoff",
      stages,
      () => ({
        site: buildSiteHandoff(generation!),
        email: buildEmailHandoff(generation!),
      }),
      { site: null, email: null },
      "Handoff building failed",
    );
    siteHandoff = handoffResult.data.site;
    emailHandoff = handoffResult.data.email;
    allWarnings.push(...handoffResult.warnings);
  }

  // ── STAGE 5: PERSIST ──────────────────────────────────────────────────
  // Skip persist if improve path already created the run (scan pipeline saved it)
  if (runId && input.mode === "improve") {
    summary = payload ? `Business improvement analysis for ${payload.niche || "your business"}. ${strategy?.reasoning[0] || ""}` : "Analysis complete.";
    stages.push({ name: "persist", status: "success", startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), durationMs: 0, fallbackUsed: false, warnings: ["Skipped — scan pipeline already persisted"] });
  } else if (payload && strategy && generation) {
    summary = `Business foundation generated for ${payload.businessType} in ${payload.niche || "your chosen market"}. ${strategy.reasoning[0] || ""}`;

    const saveResult = await runStage(
      "persist",
      stages,
      async () => {
        const analysis = await prisma.analysisRun.create({
          data: {
            userId,
            mode: payload!.mode === "improve" ? "consultant" : "operator",
            inputUrl: payload!.sourceInputs.scanUrl || `himalaya://profile/${input.profileId}`,
            title,
            score: payload!.diagnosis.score,
            verdict: "Pursue",
            confidence: payload!.diagnosis.confidence,
            summary,
            decisionPacket: {
              audience: payload!.diagnosis.audience,
              painDesire: payload!.diagnosis.painPoint,
              angle: payload!.diagnosis.angle,
              strengths: payload!.diagnosis.strengths,
              weaknesses: payload!.diagnosis.weaknesses,
              risks: payload!.diagnosis.risks,
              nextActions: strategy!.priorities.map((p) => p.action),
            },
            rawSignals: {
              foundation: foundationData,
              nicheIntelligence: intelData,
              himalayaPayload: payload,
              himalayaStrategy: strategy,
            } as object,
          },
        });

        const assetPkg = await prisma.assetPackage.create({
          data: {
            analysisRunId: analysis.id,
            mode: analysis.mode,
            adHooks: generation!.adHooks ?? [],
            adScripts: generation!.adScripts ?? [],
            landingPage: (siteHandoff ?? generation!.websiteBlueprint ?? {}) as object,
            emailSequences: (emailHandoff ? {
              welcome: emailHandoff.emails,
              // abandonedCart and postPurchase use proven defaults in deployRun when empty
            } : {}) as object,
            executionChecklist: (generation!.actionRoadmap ? { phases: generation!.actionRoadmap } : {}) as object,
          },
        });

        return { analysisRunId: analysis.id, assetPackageId: assetPkg.id };
      },
      { analysisRunId: undefined as string | undefined, assetPackageId: undefined as string | undefined },
      "Save failed — results generated but not persisted",
    );

    runId = saveResult.data.analysisRunId ?? null;
    allWarnings.push(...saveResult.warnings);

    // Track usage
    if (runId) await incrementUsage(userId, "runsUsed").catch(() => {});
  }

  // ── BUILD TRACE ───────────────────────────────────────────────────────
  const totalDurationMs = Date.now() - pipelineStart;
  const overallStatus: StageStatus = stages.every((s) => s.status === "success")
    ? "success"
    : stages.some((s) => s.status === "failed")
      ? "failed"
      : stages.some((s) => s.status === "fallback")
        ? "fallback"
        : "partial";

  const trace: PipelineTrace = {
    runId: runId ?? "unsaved",
    userId,
    mode: input.mode,
    stages,
    totalDurationMs,
    overallStatus,
    savedEntityIds: {
      analysisRunId: runId ?? undefined,
      profileId: input.profileId,
    },
    createdAt: new Date().toISOString(),
  };

  // ── LOG PIPELINE ──────────────────────────────────────────────────────
  try {
    await prisma.himalayaPipelineLog.create({
      data: {
        userId,
        analysisRunId: runId,
        mode: input.mode,
        overallStatus,
        stages: stages as unknown as object,
        totalDurationMs,
        savedEntityIds: trace.savedEntityIds as object,
        warnings: allWarnings.length > 0 ? allWarnings : undefined,
      },
    });
  } catch {
    // logging is non-blocking
  }

  // ── UPDATE MEMORY ─────────────────────────────────────────────────────
  try {
    await prisma.himalayaMemory.upsert({
      where: { userId },
      create: { userId, lastMode: input.mode === "improve" ? "consultant" : "operator", lastNiche: input.niche ?? null },
      update: { lastMode: input.mode === "improve" ? "consultant" : "operator", lastNiche: input.niche ?? null },
    });
  } catch {
    // non-blocking
  }

  return {
    success: overallStatus === "success" || overallStatus === "partial",
    runId,
    mode: input.mode,
    payload,
    strategy,
    generation,
    siteHandoff,
    emailHandoff,
    trace,
    title,
    summary,
  };
}

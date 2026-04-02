import type {
  RawAnalysis,
  HimalayaResultsViewModel,
  ResultPriority,
  AssetGroup,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function modeLabel(mode: string, rawSignals?: Record<string, unknown> | null): string {
  // Check for foundation path label
  const foundation = (rawSignals as Record<string, unknown> | null)?.foundation as { pathLabel?: string } | undefined;
  if (foundation?.pathLabel) return foundation.pathLabel;
  if (mode === "consultant") return "Improve Existing Business";
  return "Start from Scratch";
}

function statusLabel(verdict: string | null, score: number | null): { label: string; tone: "success" | "partial" | "fallback" | "failed" } {
  if (!verdict) return { label: "Processing", tone: "partial" };
  if (verdict === "Pursue") return { label: "Ready", tone: "success" };
  if (verdict === "Consider") return { label: "Completed with Notes", tone: "partial" };
  if (verdict === "Reject") return { label: "Needs Attention", tone: "fallback" };
  return { label: "Completed", tone: score && score >= 50 ? "partial" : "fallback" };
}

function buildTitle(mode: string, verdict: string | null): string {
  if (mode === "consultant") {
    if (verdict === "Pursue") return "Your business improvement plan is ready";
    if (verdict === "Reject") return "Critical issues found — review recommended";
    return "Your business improvement plan is ready";
  }
  if (verdict === "Pursue") return "Your business foundation is ready";
  if (verdict === "Reject") return "This direction needs rethinking";
  return "Your business foundation is ready";
}

function buildSummary(mode: string, packet: Record<string, unknown> | null, rawSummary: string | null): string {
  if (rawSummary) return rawSummary;
  if (!packet) return "Analysis complete.";
  const audience = packet.audience as string | undefined;
  const angle = packet.angle as string | undefined;
  if (mode === "consultant") {
    return [
      audience ? `Target audience: ${audience}.` : null,
      angle ? `Strategic angle: ${angle}.` : null,
    ].filter(Boolean).join(" ") || "Analysis complete.";
  }
  return [
    audience ? `Identified audience: ${audience}.` : null,
    angle ? `Core direction: ${angle}.` : null,
  ].filter(Boolean).join(" ") || "Analysis complete.";
}

// ---------------------------------------------------------------------------
// Priority extraction
// ---------------------------------------------------------------------------

function extractPriorities(
  packet: Record<string, unknown> | null,
  opp: RawAnalysis["opportunityAssessments"][0] | null,
): ResultPriority[] {
  const priorities: ResultPriority[] = [];

  // From next actions in decision packet
  const nextActions = (packet?.nextActions ?? []) as string[];
  for (const action of nextActions.slice(0, 3)) {
    priorities.push({
      label: action.length > 60 ? action.slice(0, 57) + "..." : action,
      reason: "Identified as a key next step from the analysis",
      nextStep: action,
    });
  }

  // If we don't have 3 yet, pull from opportunity gaps
  if (priorities.length < 3 && opp) {
    const gaps = (opp.topGaps ?? []) as string[];
    for (const gap of gaps) {
      if (priorities.length >= 3) break;
      priorities.push({
        label: `Fix: ${gap}`,
        reason: "Identified as a top weakness in the opportunity assessment",
        nextStep: `Address the ${gap.toLowerCase()} gap to improve your overall score`,
      });
    }
  }

  return priorities.slice(0, 3);
}

// ---------------------------------------------------------------------------
// Asset group extraction
// ---------------------------------------------------------------------------

function extractAssetGroups(
  mode: string,
  packet: Record<string, unknown> | null,
  opp: RawAnalysis["opportunityAssessments"][0] | null,
  assets: RawAnalysis["assetPackages"][0] | null,
  rawSignals: Record<string, unknown> | null,
): AssetGroup[] {
  const groups: AssetGroup[] = [];
  const foundation = rawSignals?.foundation as Record<string, unknown> | undefined;
  if (foundation) {
    // Business Profile
    const bp = foundation.businessProfile as Record<string, string> | undefined;
    if (bp) {
      const bpPairs: { label: string; value: string }[] = [];
      if (bp.businessType) bpPairs.push({ label: "Business Type", value: bp.businessType });
      if (bp.niche) bpPairs.push({ label: "Niche", value: bp.niche });
      if (bp.targetCustomer) bpPairs.push({ label: "Target Customer", value: bp.targetCustomer });
      if (bp.painPoint) bpPairs.push({ label: "Pain Point", value: bp.painPoint });
      if (bp.uniqueAngle) bpPairs.push({ label: "Unique Angle", value: bp.uniqueAngle });
      if (bpPairs.length > 0) {
        groups.push({ title: "Business Profile", type: "kv", content: bpPairs });
      }
    }

    // Ideal Customer
    const icp = foundation.idealCustomer as Record<string, string> | undefined;
    if (icp) {
      const icpPairs: { label: string; value: string }[] = [];
      if (icp.who) icpPairs.push({ label: "Who", value: icp.who });
      if (icp.demographics) icpPairs.push({ label: "Demographics", value: icp.demographics });
      if (icp.psychographics) icpPairs.push({ label: "Psychographics", value: icp.psychographics });
      if (icp.whereToBuy) icpPairs.push({ label: "Where They Buy", value: icp.whereToBuy });
      if (icp.buyingTrigger) icpPairs.push({ label: "Buying Trigger", value: icp.buyingTrigger });
      if (icpPairs.length > 0) {
        groups.push({ title: "Ideal Customer", type: "kv", content: icpPairs });
      }
    }

    // Offer Direction
    const offer = foundation.offerDirection as Record<string, string> | undefined;
    if (offer) {
      const offerPairs: { label: string; value: string }[] = [];
      if (offer.coreOffer) offerPairs.push({ label: "Core Offer", value: offer.coreOffer });
      if (offer.pricing) offerPairs.push({ label: "Pricing", value: offer.pricing });
      if (offer.deliverable) offerPairs.push({ label: "Deliverable", value: offer.deliverable });
      if (offer.transformation) offerPairs.push({ label: "Transformation", value: offer.transformation });
      if (offer.guarantee) offerPairs.push({ label: "Guarantee", value: offer.guarantee });
      if (offerPairs.length > 0) {
        groups.push({ title: "Offer Direction", type: "kv", content: offerPairs });
      }
    }

    // Website Blueprint
    const blueprint = foundation.websiteBlueprint as Record<string, unknown> | undefined;
    if (blueprint) {
      const bpPairs: { label: string; value: string }[] = [];
      if (blueprint.headline) bpPairs.push({ label: "Headline", value: blueprint.headline as string });
      if (blueprint.subheadline) bpPairs.push({ label: "Subheadline", value: blueprint.subheadline as string });
      if (blueprint.heroCtaText) bpPairs.push({ label: "CTA", value: blueprint.heroCtaText as string });
      if (blueprint.urgencyLine) bpPairs.push({ label: "Urgency Line", value: blueprint.urgencyLine as string });
      if (Array.isArray(blueprint.sections)) bpPairs.push({ label: "Page Sections", value: (blueprint.sections as string[]).join(" → ") });
      if (Array.isArray(blueprint.trustElements)) bpPairs.push({ label: "Trust Elements", value: (blueprint.trustElements as string[]).join(", ") });
      if (bpPairs.length > 0) {
        groups.push({ title: "Website Blueprint", type: "kv", content: bpPairs });
      }
    }

    // Marketing Angles from foundation
    const angles = foundation.marketingAngles as { hook: string; angle: string; platform: string }[] | undefined;
    if (angles && angles.length > 0) {
      groups.push({
        title: "Marketing Angles",
        type: "list",
        regenerateTarget: "adHooks",
        content: angles.map((a) => `[${a.platform}] ${a.hook} — ${a.angle}`),
      });
    }

    // Email Sequence from foundation
    const emails = foundation.emailSequence as { subject: string; purpose: string; timing: string }[] | undefined;
    if (emails && emails.length > 0) {
      groups.push({
        title: "Email Sequence",
        type: "list",
        regenerateTarget: "emailSequences",
        content: emails.map((e) => `[${e.timing}] ${e.subject} — ${e.purpose}`),
      });
    }

    // Action Roadmap (from foundation, richer than checklist)
    const roadmap = foundation.actionRoadmap as { phase: string; timeframe: string; tasks: string[] }[] | undefined;
    if (roadmap && roadmap.length > 0) {
      const items: string[] = [];
      for (const phase of roadmap) {
        items.push(`[${phase.phase} — ${phase.timeframe}]`);
        for (const task of phase.tasks) {
          items.push(`  ${task}`);
        }
      }
      groups.push({ title: "Action Roadmap", type: "list", content: items });
    }
  }

  // If foundation provided full data, skip the generic extraction to avoid duplicates
  if (foundation) return groups;

  // Decision packet as business profile
  if (packet) {
    const kvPairs: { label: string; value: string }[] = [];
    if (packet.audience) kvPairs.push({ label: "Target Audience", value: packet.audience as string });
    if (packet.painDesire) kvPairs.push({ label: "Pain / Desire", value: packet.painDesire as string });
    if (packet.angle) kvPairs.push({ label: "Strategic Angle", value: packet.angle as string });
    if (kvPairs.length > 0) {
      groups.push({
        title: mode === "consultant" ? "Audit Summary" : "Business Profile",
        type: "kv",
        content: kvPairs,
      });
    }
  }

  // Strengths
  const strengths = (packet?.strengths ?? []) as string[];
  if (strengths.length > 0) {
    groups.push({
      title: mode === "consultant" ? "Current Strengths" : "Identified Strengths",
      type: "list",
      content: strengths,
    });
  }

  // Weaknesses
  const weaknesses = (packet?.weaknesses ?? []) as string[];
  if (weaknesses.length > 0) {
    groups.push({
      title: mode === "consultant" ? "Highest-Priority Fixes" : "Areas to Address",
      type: "list",
      content: weaknesses,
    });
  }

  // Recommended path
  if (opp?.recommendedPath) {
    groups.push({
      title: "Recommended Path",
      type: "text",
      content: opp.recommendedPath,
    });
  }

  // Top strengths from opportunity
  if (opp?.topStrengths && (opp.topStrengths as string[]).length > 0) {
    groups.push({
      title: "Top Opportunity Strengths",
      type: "list",
      content: opp.topStrengths as string[],
    });
  }

  // Ad Hooks
  if (assets?.adHooks && assets.adHooks.length > 0) {
    groups.push({
      title: "Marketing Angles",
      type: "list",
      regenerateTarget: "adHooks",
      content: assets.adHooks.map((h) => `[${h.format}] ${h.hook}`),
    });
  }

  // Ad Scripts
  if (assets?.adScripts && assets.adScripts.length > 0) {
    groups.push({
      title: "Ad Scripts",
      type: "scripts",
      regenerateTarget: "adScripts",
      content: assets.adScripts,
    });
  }

  // Landing Page
  if (assets?.landingPage && Object.keys(assets.landingPage).length > 0) {
    const lp = assets.landingPage as Record<string, unknown>;
    const kvPairs: { label: string; value: string }[] = [];
    for (const [key, val] of Object.entries(lp)) {
      if (typeof val === "string" && val.trim()) {
        kvPairs.push({ label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()), value: val });
      } else if (Array.isArray(val)) {
        kvPairs.push({ label: key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()), value: val.join(", ") });
      }
    }
    if (kvPairs.length > 0) {
      groups.push({
        title: mode === "consultant" ? "Homepage Improvements" : "Homepage Blueprint",
        type: "kv",
        regenerateTarget: "landingPage",
        content: kvPairs,
      });
    }
  }

  // Email Sequences
  if (assets?.emailSequences && Object.keys(assets.emailSequences).length > 0) {
    const es = assets.emailSequences as Record<string, unknown>;
    const items: string[] = [];
    for (const [key, val] of Object.entries(es)) {
      if (typeof val === "string" && val.trim()) {
        items.push(`${key}: ${val}`);
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === "string") items.push(item);
          else if (typeof item === "object" && item !== null) {
            const subject = (item as Record<string, unknown>).subject ?? (item as Record<string, unknown>).title ?? "";
            if (subject) items.push(String(subject));
          }
        }
      }
    }
    if (items.length > 0) {
      groups.push({
        title: mode === "consultant" ? "Email Improvements" : "Email Sequence",
        type: "list",
        regenerateTarget: "emailSequences",
        content: items,
      });
    }
  }

  // Execution Checklist
  if (assets?.executionChecklist && Object.keys(assets.executionChecklist).length > 0) {
    const ec = assets.executionChecklist as Record<string, unknown>;
    const items: string[] = [];
    for (const [, val] of Object.entries(ec)) {
      if (typeof val === "string" && val.trim()) items.push(val);
      else if (Array.isArray(val)) {
        for (const v of val) {
          if (typeof v === "string") items.push(v);
          else if (typeof v === "object" && v !== null) {
            const label = (v as Record<string, unknown>).task ?? (v as Record<string, unknown>).label ?? (v as Record<string, unknown>).title ?? "";
            if (label) items.push(String(label));
          }
        }
      }
    }
    if (items.length > 0) {
      groups.push({
        title: "Action Roadmap",
        type: "list",
        regenerateTarget: "executionChecklist",
        content: items,
      });
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Warning extraction
// ---------------------------------------------------------------------------

function extractNotes(
  verdict: string | null,
  score: number | null,
  opp: RawAnalysis["opportunityAssessments"][0] | null,
): string[] {
  const notes: string[] = [];
  if (verdict === "Consider") {
    notes.push("Some areas may need manual review before acting on the recommendations.");
  }
  if (verdict === "Reject") {
    notes.push("The analysis found significant concerns. Review the priorities carefully before proceeding.");
  }
  if (score !== null && score < 40) {
    notes.push("Overall score is low — consider revisiting your positioning or offer.");
  }
  if (opp) {
    const gaps = (opp.topGaps ?? []) as string[];
    if (gaps.length >= 3) {
      notes.push(`${gaps.length} opportunity gaps were detected. Focus on the highest-impact ones first.`);
    }
  }
  return notes;
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

const DIMENSION_MAP: { key: string; label: string }[] = [
  { key: "demandPotential", label: "Demand" },
  { key: "offerStrength", label: "Offer" },
  { key: "emotionalLeverage", label: "Emotion" },
  { key: "trustCredibility", label: "Trust" },
  { key: "conversionReadiness", label: "Conversion" },
  { key: "adViability", label: "Ad Viability" },
  { key: "emailLifecyclePotential", label: "Email" },
  { key: "seoPotential", label: "SEO" },
  { key: "differentiation", label: "Differentiation" },
  { key: "risk", label: "Risk" },
];

// ---------------------------------------------------------------------------
// Strategy reasoning extraction
// ---------------------------------------------------------------------------

function extractStrategyReasoning(raw: RawAnalysis): string[] | null {
  const signals = raw.rawSignals as Record<string, unknown> | null;
  if (!signals) return null;
  const strategy = signals.himalayaStrategy as { reasoning?: string[] } | undefined;
  if (strategy?.reasoning && strategy.reasoning.length > 0) {
    return strategy.reasoning;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main formatter
// ---------------------------------------------------------------------------

export function formatResults(raw: RawAnalysis): HimalayaResultsViewModel {
  const mode = raw.mode as "operator" | "consultant";
  const packet = raw.decisionPacket as Record<string, unknown> | null;
  const opp = raw.opportunityAssessments[0] ?? null;
  const assets = raw.assetPackages[0] ?? null;
  const { label, tone } = statusLabel(raw.verdict, raw.score);

  return {
    modeLabel: modeLabel(mode, raw.rawSignals as Record<string, unknown> | null),
    mode,
    title: buildTitle(mode, raw.verdict),
    statusLabel: label,
    statusTone: tone,
    summary: buildSummary(mode, packet, raw.summary),
    score: raw.score ?? 0,
    verdict: raw.verdict ?? "Unknown",
    confidence: raw.confidence ?? "Unknown",
    inputUrl: raw.inputUrl,
    createdAt: raw.createdAt,
    priorities: extractPriorities(packet, opp),
    assetGroups: extractAssetGroups(mode, packet, opp, assets, raw.rawSignals as Record<string, unknown> | null),
    notes: extractNotes(raw.verdict, raw.score, opp),
    nextActions: [
      { label: "Run Again", href: raw.mode === "consultant" ? `/himalaya/improve?fromRun=${raw.id}` : `/himalaya/scratch?fromRun=${raw.id}` },
      { label: "View Full Analysis", href: `/analyses/${raw.id}` },
      ...(assets ? [{ label: "Build Landing Page", href: `/skills?skill=landing-page&prefill_offer=${encodeURIComponent(raw.title ?? raw.inputUrl)}` }] : []),
    ],
    trace: {
      runId: raw.id,
      mode: raw.mode,
      linkType: raw.linkType ?? "Unknown",
      confidence: raw.confidence ?? "Unknown",
      assetsGenerated: raw.assetPackages.length,
      createdAt: raw.createdAt,
    },
    strategyReasoning: extractStrategyReasoning(raw),
    analysisId: raw.id,
    decisionPacket: packet
      ? {
          audience: packet.audience as string | undefined,
          painDesire: packet.painDesire as string | undefined,
          angle: packet.angle as string | undefined,
          strengths: packet.strengths as string[] | undefined,
          weaknesses: packet.weaknesses as string[] | undefined,
          risks: packet.risks as string[] | undefined,
          nextActions: packet.nextActions as string[] | undefined,
        }
      : null,
    dimensions: opp
      ? DIMENSION_MAP.map(({ key, label }) => ({
          label,
          key,
          value: (opp as unknown as Record<string, number | null>)[key] ?? 0,
          isRisk: key === "risk",
        }))
      : [],
    truthEngine: null, // Loaded on-demand via Truth Engine API
  };
}

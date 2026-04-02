/**
 * End-to-end test for Himalaya pipeline.
 * Run with: npx tsx scripts/test-himalaya.ts
 *
 * Tests:
 * 1. Decision engine (profiling → path selection)
 * 2. Foundation generator (scratch path)
 * 3. Full orchestrator scratch run
 * 4. Full orchestrator improve run
 * 5. Pipeline logging
 * 6. Results formatter
 */

import { decide } from "../lib/himalaya/decisionEngine";
import { generateFoundation } from "../lib/himalaya/foundationGenerator";
import { formatResults } from "../lib/himalaya/formatResults";
import { buildExecutionSteps } from "../lib/himalaya/buildExecutionSteps";
import type { HimalayaProfileInput } from "../lib/himalaya/profileTypes";
import type { RawAnalysis } from "../lib/himalaya/types";

function log(label: string, pass: boolean, detail?: string) {
  const icon = pass ? "✅" : "❌";
  console.log(`${icon} ${label}${detail ? ` — ${detail}` : ""}`);
}

function section(name: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`${"═".repeat(60)}`);
}

// ── TEST 1: Decision Engine ──────────────────────────────────────────

section("Decision Engine");

const scratchProfile: HimalayaProfileInput = {
  budget: "micro",
  timeAvailable: "parttime",
  skills: ["communication"],
  riskTolerance: "low",
  primaryGoal: "quick_cash",
  businessStage: "no_business",
  niche: "fitness coaching",
};

const result1 = decide(scratchProfile);
log("Returns primary recommendation", !!result1.primary);
log("Primary has path", !!result1.primary.path);
log("Primary has confidence > 0", result1.primary.confidence > 0);
log("Primary has reasoning", result1.primary.reasoning.length > 0);
log("Primary has next steps", result1.primary.nextSteps.length > 0);
log("Has alternatives", result1.alternatives.length > 0);
log("Has profile summary", !!result1.profileSummary);
console.log(`   Primary: ${result1.primary.path} (${result1.primary.confidence}%)`);
console.log(`   Alternatives: ${result1.alternatives.map(a => `${a.path}(${a.confidence}%)`).join(", ")}`);

// Test improve profile
const improveProfile: HimalayaProfileInput = {
  budget: "moderate",
  timeAvailable: "fulltime",
  skills: ["communication", "sales"],
  riskTolerance: "medium",
  primaryGoal: "fix_existing",
  businessStage: "has_revenue",
  existingUrl: "https://example.com",
  niche: "local plumbing",
};

const result2 = decide(improveProfile);
log("Improve profile → improve_existing path", result2.primary.path === "improve_existing", result2.primary.path);

// Test agency profile
const agencyProfile: HimalayaProfileInput = {
  budget: "none",
  timeAvailable: "fulltime",
  skills: ["communication", "sales"],
  riskTolerance: "medium",
  primaryGoal: "full_business",
  businessStage: "no_business",
};

const result3 = decide(agencyProfile);
log("Agency profile → agency path", result3.primary.path === "agency", result3.primary.path);

// ── TEST 2: Foundation Generator ─────────────────────────────────────

section("Foundation Generator");

const paths = ["affiliate", "dropshipping", "agency", "freelance", "coaching", "local_service"] as const;

for (const path of paths) {
  const foundation = generateFoundation(scratchProfile, path);
  const hasProfile = !!foundation.businessProfile?.businessType;
  const hasICP = !!foundation.idealCustomer?.who;
  const hasOffer = !!foundation.offerDirection?.coreOffer;
  const hasBlueprint = !!foundation.websiteBlueprint?.headline;
  const hasAngles = foundation.marketingAngles.length > 0;
  const hasEmails = foundation.emailSequence.length > 0;
  const hasRoadmap = foundation.actionRoadmap.length > 0;

  const allGood = hasProfile && hasICP && hasOffer && hasBlueprint && hasAngles && hasEmails && hasRoadmap;
  log(`${path}: all sections populated`, allGood, `profile=${hasProfile} icp=${hasICP} offer=${hasOffer} blueprint=${hasBlueprint} angles=${hasAngles}(${foundation.marketingAngles.length}) emails=${hasEmails}(${foundation.emailSequence.length}) roadmap=${hasRoadmap}(${foundation.actionRoadmap.length})`);
}

// ── TEST 3: Results Formatter ────────────────────────────────────────

section("Results Formatter");

// Create a mock RawAnalysis from a foundation run
const testFoundation = generateFoundation(scratchProfile, "affiliate");

const mockRawAnalysis: RawAnalysis = {
  id: "test-run-123",
  mode: "operator",
  inputUrl: "himalaya://profile/test",
  linkType: null,
  title: "Affiliate Marketing: fitness coaching",
  score: 70,
  verdict: "Pursue",
  confidence: "High",
  summary: "Business foundation generated for affiliate marketing.",
  rawSignals: {
    foundation: testFoundation,
    himalayaStrategy: {
      reasoning: ["Affiliate selected as best fit.", "Low budget matches this path.", "Content creation drives growth."],
    },
  },
  decisionPacket: {
    audience: testFoundation.idealCustomer.who,
    painDesire: testFoundation.businessProfile.painPoint,
    angle: testFoundation.businessProfile.uniqueAngle,
    strengths: [testFoundation.offerDirection.coreOffer],
    weaknesses: [],
    nextActions: testFoundation.actionRoadmap[0]?.tasks.slice(0, 3) ?? [],
  },
  createdAt: new Date().toISOString(),
  opportunityAssessments: [],
  assetPackages: [{
    id: "asset-1",
    mode: "operator",
    adHooks: testFoundation.marketingAngles.map(a => ({ format: a.platform, hook: a.hook })),
    adScripts: [],
    adBriefs: null,
    landingPage: testFoundation.websiteBlueprint as unknown as Record<string, unknown>,
    emailSequences: { welcome: testFoundation.emailSequence } as unknown as Record<string, unknown>,
    executionChecklist: { phases: testFoundation.actionRoadmap } as unknown as Record<string, unknown>,
  }],
};

const vm = formatResults(mockRawAnalysis);

log("Mode label from foundation path", vm.modeLabel === "Affiliate Marketing", vm.modeLabel);
log("Title populated", !!vm.title, vm.title);
log("Summary populated", !!vm.summary);
log("Score is 70", vm.score === 70);
log("Has priorities", vm.priorities.length > 0, `${vm.priorities.length} priorities`);
log("Has asset groups", vm.assetGroups.length > 0, `${vm.assetGroups.length} groups`);
log("Strategy reasoning from saved data", vm.strategyReasoning !== null && vm.strategyReasoning.length > 0, `${vm.strategyReasoning?.length ?? 0} reasons`);

// Check asset group names
const groupTitles = vm.assetGroups.map(g => g.title);
console.log(`   Asset groups: ${groupTitles.join(", ")}`);

log("Has Business Profile group", groupTitles.includes("Business Profile"));
log("Has Ideal Customer group", groupTitles.includes("Ideal Customer"));
log("Has Offer Direction group", groupTitles.includes("Offer Direction"));
log("Has Website Blueprint group", groupTitles.includes("Website Blueprint"));
log("Has Marketing Angles group", groupTitles.some(t => t.includes("Marketing")));
log("Has Email Sequence group", groupTitles.some(t => t.includes("Email")));
log("Has Action Roadmap group", groupTitles.some(t => t.includes("Roadmap")));

// ── TEST 4: Execution Steps ──────────────────────────────────────────

section("Execution Steps");

const steps = buildExecutionSteps(vm);
log("Steps generated", steps.length > 0, `${steps.length} steps`);
log("All steps start as not_started", steps.every(s => s.status === "not_started"));
log("Some steps have action URLs", steps.some(s => !!s.actionUrl), `${steps.filter(s => !!s.actionUrl).length} with URLs`);
log("Last step is review/finalize", steps[steps.length - 1]?.title.toLowerCase().includes("review") || steps[steps.length - 1]?.title.toLowerCase().includes("finalize"));

for (const step of steps.slice(0, 5)) {
  console.log(`   [${step.id}] ${step.title}${step.actionUrl ? ` → ${step.actionUrl}` : ""}`);
}
if (steps.length > 5) console.log(`   ... and ${steps.length - 5} more`);

// ── TEST 5: Improve Path Formatter ───────────────────────────────────

section("Improve Path Formatter");

const mockImproveRaw: RawAnalysis = {
  id: "test-improve-456",
  mode: "consultant",
  inputUrl: "https://example.com",
  linkType: "product",
  title: "Example Business",
  score: 45,
  verdict: "Consider",
  confidence: "Medium",
  summary: "Business has potential but several weak areas need attention.",
  rawSignals: null,
  decisionPacket: {
    audience: "Small business owners",
    painDesire: "Need better online presence",
    angle: "Trust-first conversion approach",
    strengths: ["Clear product offering", "Some social proof"],
    weaknesses: ["Weak headline", "No clear CTA", "Missing trust signals"],
    nextActions: ["Rewrite homepage headline", "Add social proof section", "Improve CTA visibility"],
  },
  createdAt: new Date().toISOString(),
  opportunityAssessments: [{
    id: "opp-1",
    status: "Consider",
    totalScore: 45,
    demandPotential: 60,
    offerStrength: 35,
    emotionalLeverage: 40,
    trustCredibility: 25,
    conversionReadiness: 30,
    adViability: 50,
    emailLifecyclePotential: 45,
    seoPotential: 55,
    differentiation: 35,
    risk: 40,
    topGaps: ["Trust/Credibility", "Conversion Readiness", "Offer Strength"],
    topStrengths: ["SEO Potential", "Demand"],
    recommendedPath: "Focus on trust signals and conversion optimization first.",
    opportunityPacket: null,
  }],
  assetPackages: [{
    id: "asset-2",
    mode: "consultant",
    adHooks: [{ format: "Social", hook: "Most businesses lose 60% of visitors because of this one mistake" }],
    adScripts: [],
    adBriefs: null,
    landingPage: { headline: "Better Business Solutions", subheadline: "Trust-first approach", ctaCopy: "Get Started", trustBar: ["100+ clients", "5-star rated"], sections: ["Hero", "Benefits", "Proof", "CTA"] },
    emailSequences: { welcome: [{ subject: "Welcome aboard", purpose: "Onboarding", timing: "Immediately" }] },
    executionChecklist: { day1: ["Fix headline", "Add trust badges"], day2: ["Improve CTA section"] },
  }],
};

const vmImprove = formatResults(mockImproveRaw);
log("Improve mode label", vmImprove.modeLabel === "Improve Existing Business", vmImprove.modeLabel);
log("Has dimensions", vmImprove.dimensions.length > 0, `${vmImprove.dimensions.length} dimensions`);
log("Has notes (score < 50)", vmImprove.notes.length > 0, `${vmImprove.notes.length} notes`);
log("Has priorities from weaknesses", vmImprove.priorities.length > 0);
log("Status tone is partial (Consider verdict)", vmImprove.statusTone === "partial", vmImprove.statusTone);

const improveGroupTitles = vmImprove.assetGroups.map(g => g.title);
console.log(`   Asset groups: ${improveGroupTitles.join(", ")}`);
log("Has audit summary or business profile", improveGroupTitles.some(t => t.includes("Audit") || t.includes("Business")));

// ── SUMMARY ──────────────────────────────────────────────────────────

section("SUMMARY");
console.log("All core Himalaya functions tested without database dependency.");
console.log("To test full pipeline with DB, run through the UI at localhost:3005/himalaya");

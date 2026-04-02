import type { HimalayaResultsViewModel } from "./types";

export type ExecutionStep = {
  id: string;
  title: string;
  instruction: string;
  assetRef?: string; // references an asset group title
  actionUrl?: string; // link to relevant system tool
  actionLabel?: string; // button label for the action
  status: "not_started" | "in_progress" | "done";
};

export type ExecutionState = {
  steps: ExecutionStep[];
  startedAt: string | null;
  completedAt: string | null;
};

/**
 * Generates execution steps from the results view model.
 * Converts priorities + asset groups + roadmap into actionable steps.
 */
export function buildExecutionSteps(vm: HimalayaResultsViewModel): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let idx = 0;

  const makeId = () => `step_${++idx}`;

  // Step 1: Review priorities
  if (vm.priorities.length > 0) {
    steps.push({
      id: makeId(),
      title: "Review top priorities",
      instruction: `Read through your ${vm.priorities.length} priorities and decide which to tackle first. The system recommends starting with "${vm.priorities[0].label}".`,
      status: "not_started",
    });
  }

  // Steps from priorities → concrete actions
  for (const p of vm.priorities) {
    steps.push({
      id: makeId(),
      title: p.label,
      instruction: p.nextStep,
      status: "not_started",
    });
  }

  // Steps from asset groups → use each generated asset
  for (const group of vm.assetGroups) {
    // Skip non-actionable groups (business profile, strengths, etc)
    if (!group.regenerateTarget) continue;

    const actionVerb = getActionVerb(group.regenerateTarget, vm.mode);
    const action = getActionLink(group.regenerateTarget, vm);
    steps.push({
      id: makeId(),
      title: `${actionVerb} ${group.title.toLowerCase()}`,
      instruction: getAssetInstruction(group.regenerateTarget, vm.mode),
      assetRef: group.title,
      actionUrl: action?.url,
      actionLabel: action?.label,
      status: "not_started",
    });
  }

  // Final step: review and refine
  steps.push({
    id: makeId(),
    title: "Review and finalize",
    instruction: vm.mode === "consultant"
      ? "Review all implemented changes. Check that the highest-priority fixes are live and the improved assets are deployed."
      : "Review all generated assets. Ensure your homepage, ads, and emails are live and tracking is in place.",
    status: "not_started",
  });

  return steps;
}

function getActionLink(target: string, vm: HimalayaResultsViewModel): { url: string; label: string } | null {
  const title = encodeURIComponent(vm.title || "");
  const audience = encodeURIComponent(vm.decisionPacket?.audience || "");

  switch (target) {
    case "landingPage":
      return { url: `/websites/new?prefill_name=${title}`, label: "Open Site Builder" };
    case "emailSequences":
      return { url: `/emails/templates?prefill_offer=${title}`, label: "Open Email Builder" };
    case "adHooks":
    case "adScripts":
      return { url: `/skills?skill=ad-campaign&prefill_offer=${title}&prefill_audience=${audience}`, label: "Create Ad Campaign" };
    case "executionChecklist":
      return null; // roadmap is self-contained
    default:
      return null;
  }
}

function getActionVerb(target: string, mode: string): string {
  const verbs: Record<string, string> = {
    adHooks: "Deploy",
    adScripts: "Record or publish",
    adBriefs: "Launch",
    landingPage: mode === "consultant" ? "Rebuild" : "Build",
    emailSequences: "Set up",
    executionChecklist: "Follow",
  };
  return verbs[target] ?? "Apply";
}

function getAssetInstruction(target: string, mode: string): string {
  const instructions: Record<string, string> = {
    adHooks: "Copy the generated ad hooks into your ad platform. Test 3-5 hooks simultaneously and kill underperformers after 48 hours.",
    adScripts: "Use the generated scripts to record short-form video content. Follow the timestamps and direction cues for each section.",
    adBriefs: "Hand the generated briefs to your creative team or use them as a production guide for ad content.",
    landingPage: mode === "consultant"
      ? "Replace the weak sections of the existing homepage with the generated improvements. Focus on headline, CTA, and trust elements first."
      : "Build your landing page using the generated blueprint. Start with the headline and hero section, then add benefits, proof, and CTA.",
    emailSequences: "Import the generated email sequences into your email platform. Set up the timing triggers and verify all links before activating.",
    executionChecklist: "Follow the action roadmap day by day. Complete each step in order — the sequence is designed to build momentum.",
  };
  return instructions[target] ?? "Apply the generated content to your business.";
}

/**
 * Merges saved execution state with fresh steps (handles re-generated content).
 */
export function mergeExecutionState(
  freshSteps: ExecutionStep[],
  saved: ExecutionState | null
): ExecutionState {
  if (!saved) {
    return { steps: freshSteps, startedAt: null, completedAt: null };
  }

  const completedIds = new Set(
    saved.steps.filter((s) => s.status === "done").map((s) => s.id)
  );
  const inProgressIds = new Set(
    saved.steps.filter((s) => s.status === "in_progress").map((s) => s.id)
  );

  const merged = freshSteps.map((step) => ({
    ...step,
    status: completedIds.has(step.id)
      ? "done" as const
      : inProgressIds.has(step.id)
        ? "in_progress" as const
        : step.status,
  }));

  return {
    steps: merged,
    startedAt: saved.startedAt,
    completedAt: merged.every((s) => s.status === "done") ? new Date().toISOString() : null,
  };
}

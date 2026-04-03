import type { HimalayaResultsViewModel, AssetGroup } from "./types";

export type ExecutionStep = {
  id: string;
  title: string;
  instruction: string;
  assetRef?: string;
  actionUrl?: string;
  actionLabel?: string;
  deployTarget?: "site" | "campaign" | "emails";
  content?: {
    type: "text" | "list" | "kv" | "preview";
    data: unknown;
  };
  status: "not_started" | "in_progress" | "done";
};

export type ExecutionState = {
  steps: ExecutionStep[];
  startedAt: string | null;
  completedAt: string | null;
};

/**
 * Generates execution steps with inline content for immediate action.
 * Each step should feel actionable, not like homework.
 */
export function buildExecutionSteps(vm: HimalayaResultsViewModel): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let idx = 0;
  const makeId = () => `step_${++idx}`;

  // Find key asset groups
  const findGroup = (match: string) => vm.assetGroups.find(g => g.title.toLowerCase().includes(match.toLowerCase()));

  const businessProfile = findGroup("Business Profile");
  const idealCustomer = findGroup("Ideal Customer");
  const offerDirection = findGroup("Offer Direction");
  const blueprint = findGroup("Website Blueprint") || findGroup("Homepage");
  const angles = findGroup("Marketing Angles");
  const emails = findGroup("Email");
  const roadmap = findGroup("Roadmap");

  // Step 1: Your business identity (combines profile + ICP)
  if (businessProfile || idealCustomer) {
    const preview: string[] = [];
    if (businessProfile?.type === "kv") {
      for (const item of businessProfile.content as { label: string; value: string }[]) {
        preview.push(`${item.label}: ${item.value}`);
      }
    }
    if (idealCustomer?.type === "kv") {
      const icp = idealCustomer.content as { label: string; value: string }[];
      const who = icp.find(i => i.label === "Who");
      if (who) preview.push(`Target: ${who.value}`);
    }

    steps.push({
      id: makeId(),
      title: "Lock in your business identity",
      instruction: "This is who you are, who you serve, and why. Review it — everything else builds from this.",
      content: { type: "list", data: preview.slice(0, 5) },
      status: "not_started",
    });
  }

  // Step 2: Your offer (the money part)
  if (offerDirection) {
    steps.push({
      id: makeId(),
      title: "Finalize your offer",
      instruction: "This is what you sell and how you position it. Get this right before building anything else.",
      content: { type: "kv", data: offerDirection.content },
      assetRef: offerDirection.title,
      status: "not_started",
    });
  }

  // Step 3: Build your website
  if (blueprint) {
    const preview: string[] = [];
    if (blueprint.type === "kv") {
      for (const item of (blueprint.content as { label: string; value: string }[]).slice(0, 3)) {
        preview.push(`${item.label}: ${item.value}`);
      }
    }
    steps.push({
      id: makeId(),
      title: "Build your website",
      instruction: "Your homepage blueprint is ready. Deploy it to the site builder with one click, then customize.",
      content: preview.length > 0 ? { type: "list", data: preview } : undefined,
      assetRef: blueprint.title,
      actionUrl: `/websites/new`,
      actionLabel: "Open Site Builder",
      deployTarget: "site",
      status: "not_started",
    });
  }

  // Step 4: Launch your marketing
  if (angles) {
    const angleList = angles.type === "list" ? (angles.content as string[]).slice(0, 3) : [];
    steps.push({
      id: makeId(),
      title: "Launch your first marketing",
      instruction: "These hooks are ready to use. Pick your strongest 2-3 and test them on your primary platform.",
      content: angleList.length > 0 ? { type: "list", data: angleList } : undefined,
      assetRef: angles.title,
      deployTarget: "campaign",
      status: "not_started",
    });
  }

  // Step 5: Set up email follow-up
  if (emails) {
    const emailList = emails.type === "list" ? (emails.content as string[]).slice(0, 3) : [];
    steps.push({
      id: makeId(),
      title: "Set up email follow-up",
      instruction: "Import this sequence into your email platform. Automate it so every lead gets nurtured without manual work.",
      content: emailList.length > 0 ? { type: "list", data: emailList } : undefined,
      assetRef: emails.title,
      actionUrl: `/emails/templates`,
      actionLabel: "Open Email Builder",
      deployTarget: "emails",
      status: "not_started",
    });
  }

  // Step 6: Follow the roadmap
  if (roadmap) {
    const roadmapItems = roadmap.type === "list" ? (roadmap.content as string[]).slice(0, 5) : [];
    steps.push({
      id: makeId(),
      title: "Execute the roadmap",
      instruction: "This is your day-by-day plan. Follow it in order — the sequence is designed to build momentum.",
      content: roadmapItems.length > 0 ? { type: "list", data: roadmapItems } : undefined,
      assetRef: roadmap.title,
      status: "not_started",
    });
  }

  // If no specific groups found (improve path or minimal results), fall back to priority-based steps
  if (steps.length === 0) {
    for (const p of vm.priorities.slice(0, 3)) {
      steps.push({
        id: makeId(),
        title: p.label,
        instruction: p.nextStep,
        status: "not_started",
      });
    }

    // Add generic asset deploy step
    if (vm.assetGroups.length > 0) {
      steps.push({
        id: makeId(),
        title: "Deploy your improved assets",
        instruction: "Push the generated improvements to your site, campaigns, and email system.",
        deployTarget: "site",
        status: "not_started",
      });
    }
  }

  return steps;
}

/**
 * Merges saved execution state with fresh steps.
 */
export function mergeExecutionState(
  freshSteps: ExecutionStep[],
  saved: ExecutionState | null
): ExecutionState {
  if (!saved) {
    return { steps: freshSteps, startedAt: null, completedAt: null };
  }

  const completedIds = new Set(saved.steps.filter((s) => s.status === "done").map((s) => s.id));
  const inProgressIds = new Set(saved.steps.filter((s) => s.status === "in_progress").map((s) => s.id));

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

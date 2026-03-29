import type { Edge, Node } from "reactflow";

export type AutomationExecutionTier = "core" | "elite";

export type AutomationCampaignContext = {
  name: string;
  productName?: string | null;
  mode?: string | null;
  landingDraft?: {
    headline?: string | null;
    ctaCopy?: string | null;
    guarantee?: string | null;
  } | null;
  emailDrafts?: Array<{
    sequence?: string | null;
    subject?: string | null;
    timing?: string | null;
  }>;
  checklistItems?: Array<{
    day?: string | null;
    text?: string | null;
  }>;
};

export type GeneratedAutomationGraph = {
  name: string;
  nodes: Node[];
  edges: Edge[];
  summary: string;
};

function sequenceLabel(sequence?: string | null) {
  switch (sequence) {
    case "welcome":
      return "welcome";
    case "cart":
      return "cart recovery";
    case "post-purchase":
      return "post-purchase";
    default:
      return "follow-up";
  }
}

function inferTriggerLabel(context: AutomationCampaignContext) {
  const mode = context.mode ?? "operator";
  const title = context.productName?.trim() || context.name.trim() || "your offer";
  if (mode === "consultant") {
    return {
      label: "Lead Opt-In",
      subtitle: `A prospect requested more information about ${title}`,
    };
  }

  return {
    label: "Abandoned Checkout",
    subtitle: `A prospect left ${title} before buying`,
  };
}

export function generateAutomationGraph(
  executionTier: AutomationExecutionTier,
  context: AutomationCampaignContext
): GeneratedAutomationGraph {
  const title = context.productName?.trim() || context.name.trim() || "Your Campaign";
  const trigger = inferTriggerLabel(context);
  const firstEmail = context.emailDrafts?.[0];
  const secondEmail = context.emailDrafts?.[1];
  const thirdEmail = context.emailDrafts?.[2];
  const heroPromise = context.landingDraft?.headline?.trim() || title;
  const ctaCopy = context.landingDraft?.ctaCopy?.trim() || "Return and finish your order";
  const guarantee = context.landingDraft?.guarantee?.trim() || "Clear next steps and lower-risk decision framing";
  const checklistHint = context.checklistItems?.find((item) => item.text)?.text?.trim() || "Follow up before the prospect goes cold";

  if (executionTier === "elite") {
    return {
      name: `${title} — Elite Automation`,
      summary: `Deeper save sequence for ${title} with proof, hesitation handling, and a second recovery branch.`,
      nodes: [
        { id: "1", type: "trigger", data: trigger, position: { x: 250, y: 50 } },
        { id: "2", type: "delay", data: { label: firstEmail?.timing || "Wait 45 minutes" }, position: { x: 250, y: 200 } },
        {
          id: "3",
          type: "email",
          data: {
            label: `1. ${firstEmail?.subject || `Return to ${heroPromise}`}`,
            stats: `Hook: urgency + low-friction CTA (${ctaCopy})`,
          },
          position: { x: 250, y: 350 },
        },
        { id: "4", type: "delay", data: { label: secondEmail?.timing || "Wait 18 hours" }, position: { x: 250, y: 500 } },
        {
          id: "5",
          type: "condition",
          data: { label: context.mode === "consultant" ? "Clicked but did not book?" : "Clicked but did not purchase?" },
          position: { x: 250, y: 650 },
        },
        {
          id: "6",
          type: "email",
          data: {
            label: `2. ${secondEmail?.subject || "Proof + objection crusher"}`,
            stats: `Angle: trust, guarantee, and proof (${guarantee})`,
          },
          position: { x: 110, y: 820 },
        },
        { id: "7", type: "delay", data: { label: thirdEmail?.timing || "Wait 24 hours" }, position: { x: 110, y: 970 } },
        {
          id: "8",
          type: "email",
          data: {
            label: `3. ${thirdEmail?.subject || "Final save sequence"}`,
            stats: `Angle: direct next step + urgency (${checklistHint})`,
          },
          position: { x: 110, y: 1120 },
        },
        {
          id: "9",
          type: "email",
          data: {
            label: `2B. Re-entry reminder`,
            stats: `Angle: clean reactivation for colder ${sequenceLabel(secondEmail?.sequence)} prospects`,
          },
          position: { x: 390, y: 820 },
        },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#06b6d4" } },
        { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#8b5cf6" } },
        { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#06b6d4" } },
        { id: "e4-5", source: "4", target: "5", animated: true, style: { stroke: "#22c55e" } },
        { id: "e5-6", source: "5", sourceHandle: "yes", target: "6", animated: true, style: { stroke: "#22c55e" } },
        { id: "e6-7", source: "6", target: "7", animated: true, style: { stroke: "#8b5cf6" } },
        { id: "e7-8", source: "7", target: "8", animated: true, style: { stroke: "#06b6d4" } },
        { id: "e5-9", source: "5", sourceHandle: "no", target: "9", animated: true, style: { stroke: "#ef4444" } },
      ],
    };
  }

  return {
    name: `${title} — Core Automation`,
    summary: `Lean recovery sequence for ${title} with a clean reminder path and simple decision nudge.`,
    nodes: [
      { id: "1", type: "trigger", data: trigger, position: { x: 250, y: 50 } },
      { id: "2", type: "delay", data: { label: firstEmail?.timing || "Wait 1 hour" }, position: { x: 250, y: 200 } },
      {
        id: "3",
        type: "email",
        data: {
          label: `1. ${firstEmail?.subject || "Forgot something?"}`,
          stats: `Hook: simple reminder + return CTA (${ctaCopy})`,
        },
        position: { x: 250, y: 350 },
      },
      { id: "4", type: "delay", data: { label: secondEmail?.timing || "Wait 24 hours" }, position: { x: 250, y: 500 } },
      {
        id: "5",
        type: "email",
        data: {
          label: `2. ${secondEmail?.subject || "Final cart reminder"}`,
          stats: `Hook: urgency + decision nudge (${checklistHint})`,
        },
        position: { x: 250, y: 650 },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#8b5cf6" } },
      { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "#06b6d4" } },
      { id: "e4-5", source: "4", target: "5", animated: true, style: { stroke: "#8b5cf6" } },
    ],
  };
}

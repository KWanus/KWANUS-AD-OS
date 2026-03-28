import Anthropic from "@anthropic-ai/sdk";
import type { Block, BlockType } from "@/components/site-builder/BlockRenderer";
import {
  addCta,
  addFaq,
  addTestimonials,
  addTrust,
  applyBookingTemplate,
  applyLocalServiceTemplate,
  getCopilotDiagnostics,
  improveHero,
  interpretCopilotInstruction,
} from "@/lib/site-builder/copilotActions";
import {
  analyzeConversionInput,
  buildBusinessProfile,
  inferSiteInputFromPageContext,
} from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ExecutionTier = "core" | "elite";

type CopilotReport = {
  action: string;
  summary: string;
  before: string[];
  after: string[];
};

function summarizeBefore(blocks: Block[]) {
  const diagnostics = getCopilotDiagnostics(blocks);
  const before: string[] = [];
  if (!diagnostics.hasHero) before.push("The page was missing a clear hero section.");
  if (!diagnostics.hasCta) before.push("The page did not have a strong CTA block.");
  if (!diagnostics.hasTrust) before.push("Trust-building proof was weak or missing.");
  if (!diagnostics.hasFaq) before.push("Objection handling was missing because there was no FAQ.");
  if (!diagnostics.hasTestimonials) before.push("Social proof was missing or too light.");
  if (before.length === 0) {
    before.push("The page already had the main conversion blocks, but the request was about improving clarity or structure.");
  }
  return before;
}

function summarizeAfter(action: string) {
  switch (action) {
    case "improve_hero":
      return [
        "The above-the-fold promise is clearer and more action-oriented.",
        "The hero now reinforces trust and the next step more explicitly.",
      ];
    case "add_testimonials":
      return [
        "The page now adds visible proof to reduce hesitation.",
        "Visitors get stronger reassurance before reaching the CTA.",
      ];
    case "add_faq":
      return [
        "The page now answers common objections directly.",
        "The visitor has fewer unanswered questions before acting.",
      ];
    case "add_cta":
      return [
        "The page now has a clearer action moment.",
        "The next step is more visible instead of being implied.",
      ];
    case "add_trust":
      return [
        "Trust and credibility are easier to spot quickly.",
        "The page reduces doubt earlier in the scroll.",
      ];
    case "apply_booking_template":
      return [
        "The page flow is now more booking-first.",
        "Proof, process, and CTA rhythm are stronger for appointment-style conversion.",
      ];
    case "apply_local_service_template":
      return [
        "The page is now structured like a stronger local lead-gen page.",
        "Local relevance, trust, and CTA flow are more explicit.",
      ];
    default:
      return ["The page received a structured Copilot update."];
  }
}

function fallbackApply(action: string, blocks: Block[], siteName: string) {
  switch (action) {
    case "improve_hero":
      return improveHero(blocks, siteName);
    case "add_testimonials":
      return addTestimonials(blocks);
    case "add_faq":
      return addFaq(blocks);
    case "add_cta":
      return addCta(blocks);
    case "add_trust":
      return addTrust(blocks);
    case "apply_booking_template":
      return applyBookingTemplate(siteName);
    case "apply_local_service_template":
      return applyLocalServiceTemplate(siteName);
    default:
      return blocks;
  }
}

function detectRewriteTarget(instruction: string, blocks: Block[], selectedBlock?: Block | null) {
  if (selectedBlock) return selectedBlock.type;
  const lower = instruction.toLowerCase();
  if (lower.includes("hero")) return "hero";
  if (lower.includes("faq")) return "faq";
  if (lower.includes("cta") || lower.includes("call to action")) return "cta";
  if (lower.includes("trust") || lower.includes("badge")) return "trust_badges";
  if (lower.includes("testimonial") || lower.includes("review") || lower.includes("proof")) return "testimonials";
  if (lower.includes("benefit") || lower.includes("feature")) return "features";
  if (hasType(blocks, "hero")) return "hero";
  return "cta";
}

function hasType(blocks: Block[], type: Block["type"]) {
  return blocks.some((block) => block.type === type);
}

function rewriteTargetFallback(type: string, siteName: string) {
  if (type === "hero") {
    return {
      headline: `${siteName} with a clearer promise and stronger next step`,
      subheadline: "This rewrite makes the offer easier to understand and the CTA easier to act on.",
      socialProofText: "Built to convert better",
      trustItems: ["Clear offer", "More trust", "Stronger CTA"],
    };
  }
  if (type === "cta") {
    return {
      headline: `Ready to take the next step with ${siteName}?`,
      subheadline: "Use the call to action below to move forward with more confidence and less friction.",
      buttonText: "Get Started",
      secondaryButtonText: "Ask a Question",
      trustItems: ["Clear next step", "Lower friction", "Built for conversion"],
    };
  }
  if (type === "faq") {
    return {
      title: "Questions that stop visitors from converting",
      items: [
        { q: "What happens after I reach out?", a: "The page should make the next step and response process feel clear." },
        { q: "Why should I trust this business?", a: "Proof, reassurance, and clarity should answer this early." },
        { q: "How quickly can I get started?", a: "Set expectations directly so visitors do not hesitate." },
      ],
    };
  }
  if (type === "trust_badges") {
    return {
      title: "Trust signals visitors can see fast",
      badges: [
        { icon: "✅", label: "Clear next steps" },
        { icon: "⭐", label: "Visible proof" },
        { icon: "📍", label: "Local relevance" },
        { icon: "🛡️", label: "Lower-risk decision" },
      ],
    };
  }
  if (type === "testimonials") {
    return {
      title: "Proof that helps people say yes faster",
      items: [
        { name: "Client", role: "Customer", quote: "The page made the value and next step much easier to trust.", stars: 5 },
        { name: "Customer", role: "Buyer", quote: "Everything felt clearer and more confidence-building than before.", stars: 5 },
      ],
    };
  }
  return {
    title: "What makes this offer stronger",
    items: [
      { icon: "⚡", title: "Clearer outcome", body: "The value is easier to understand." },
      { icon: "✅", title: "More trust", body: "The page reduces hesitation faster." },
      { icon: "🎯", title: "Stronger action", body: "The next step is more visible and easier to take." },
    ],
  };
}

async function aiRewriteTarget(input: {
  instruction: string;
  siteName: string;
  pageTitle: string;
  blocks: Block[];
  selectedBlock?: Block | null;
  executionTier: ExecutionTier;
}) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const siteInput = inferSiteInputFromPageContext({
    siteName: input.siteName,
    pageTitle: input.pageTitle,
    blocks: input.blocks,
    notes: input.instruction,
  });
  const analysis = analyzeConversionInput(siteInput);
  const businessProfile = buildBusinessProfile(siteInput, analysis);
  const target = detectRewriteTarget(input.instruction, input.blocks, input.selectedBlock);
  const currentBlock = input.selectedBlock ?? input.blocks.find((block) => block.type === target);
  const currentProps = JSON.stringify(currentBlock?.props ?? {}, null, 2);

  const shapeByTarget: Record<string, string> = {
    hero: `{
  "headline": "",
  "subheadline": "",
  "socialProofText": "",
  "trustItems": ["", "", ""]
}`,
    cta: `{
  "headline": "",
  "subheadline": "",
  "buttonText": "",
  "secondaryButtonText": "",
  "trustItems": ["", "", ""]
}`,
    faq: `{
  "title": "",
  "items": [{ "q": "", "a": "" }, { "q": "", "a": "" }, { "q": "", "a": "" }]
}`,
    trust_badges: `{
  "title": "",
  "badges": [{ "icon": "✅", "label": "" }, { "icon": "⭐", "label": "" }, { "icon": "📍", "label": "" }]
}`,
    testimonials: `{
  "title": "",
  "items": [{ "name": "", "role": "", "quote": "", "stars": 5 }, { "name": "", "role": "", "quote": "", "stars": 5 }]
}`,
    features: `{
  "title": "",
  "items": [{ "icon": "⚡", "title": "", "body": "" }, { "icon": "✅", "title": "", "body": "" }, { "icon": "🎯", "title": "", "body": "" }]
}`,
  };

  const prompt = `You are rewriting one website section using a conversion-first strategy engine.
Instruction: ${input.instruction}
Site: ${input.siteName}
Page: ${input.pageTitle}
Target section: ${target}
Niche: ${siteInput.niche}
Location: ${siteInput.location}
Audience: ${businessProfile.primaryAudience}
Pains: ${businessProfile.pains.join(", ")}
Desires: ${businessProfile.desires.join(", ")}
Objections: ${businessProfile.objections.join(", ")}
Trust triggers: ${businessProfile.trustTriggers.join(", ")}
Primary CTA: ${businessProfile.primaryCta}
Current issues: ${Object.values(analysis.issues).flat().join(" | ") || "none"}
Current section props:
${currentProps}
Selected block id: ${input.selectedBlock?.id ?? "none"}
Execution tier: ${input.executionTier}

Rules:
- Write this section to convert better, not just sound prettier.
- Be specific, clear, and direct.
- Avoid generic fluff.
- ${input.executionTier === "elite"
    ? "Push for top-1% conversion execution: sharper specificity, stronger trust framing, clearer commercial intent, and more persuasive objection handling."
    : "Keep the rewrite clean, strong, practical, and ready to ship fast."}
- Return JSON only in the exact target shape.

Return:
${shapeByTarget[target] ?? shapeByTarget.hero}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 450,
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return {
      target,
      props: JSON.parse(match[0]) as Record<string, unknown>,
      analysis,
    };
  } catch {
    return null;
  }
}

function applyTargetRewrite(
  blocks: Block[],
  target: string,
  props: Record<string, unknown>,
  siteName: string,
  selectedBlockId?: string | null
) {
  const next = [...blocks];
  const index = selectedBlockId
    ? next.findIndex((block) => block.id === selectedBlockId)
    : next.findIndex((block) => block.type === target);
  if (index >= 0) {
    next[index] = {
      ...next[index],
      props: {
        ...next[index].props,
        ...props,
      },
    };
    return next;
  }

  if (target === "hero") {
    const heroBlock: Block = {
      id: `hero-${Math.random().toString(36).slice(2, 10)}`,
      type: "hero",
      props: {
        buttonText: "Get Started",
        secondaryButtonText: "Learn More",
        textAlign: "center",
        ...props,
      },
    };
    return [
      heroBlock,
      ...next,
    ];
  }

  const blockType = target as BlockType;
  return [
    ...next,
    {
      id: `${blockType}-${Math.random().toString(36).slice(2, 10)}`,
      type: blockType,
      props: rewriteTargetFallback(target, siteName),
    } as Block,
  ];
}

async function aiImproveHero(siteName: string, pageTitle: string, blocks: Block[]) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const hero = blocks.find((block) => block.type === "hero");
  const existingHeadline = (hero?.props.headline as string) ?? "";
  const existingSubheadline = (hero?.props.subheadline as string) ?? "";
  const pageSummary = blocks.slice(0, 6).map((block) => `${block.type}:${Object.values(block.props).slice(0, 2).join(" | ")}`).join("\n");

  const prompt = `You are improving a website hero for conversion.
Site name: ${siteName}
Page title: ${pageTitle}
Existing headline: ${existingHeadline}
Existing subheadline: ${existingSubheadline}
Current page summary:
${pageSummary}

Rules:
- clearer outcome
- stronger CTA direction
- less vague
- no hypey nonsense
- return JSON only

Return:
{
  "headline": "",
  "subheadline": "",
  "socialProofText": "",
  "trustItems": ["", "", ""]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 250,
    temperature: 0.55,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as {
      headline?: string;
      subheadline?: string;
      socialProofText?: string;
      trustItems?: string[];
    };
  } catch {
    return null;
  }
}

export async function runWebsiteCopilot(input: {
  instruction: string;
  siteName: string;
  pageTitle: string;
  blocks: Block[];
  selectedBlockId?: string | null;
  executionTier?: ExecutionTier;
  generationContext?: {
    businessName?: string;
    niche?: string;
    location?: string;
    sourceUrl?: string;
    templateId?: string;
    pageType?: string;
    blueprintScore?: { overall?: number };
    conversionNotes?: { primary_goal?: string; trust_elements_used?: string[]; objections_addressed?: string[] };
  } | null;
}): Promise<{ updatedBlocks: Block[]; report: CopilotReport }> {
  const executionTier: ExecutionTier = input.executionTier === "core" ? "core" : "elite";
  const action = interpretCopilotInstruction(input.instruction);
  const before = summarizeBefore(input.blocks);
  const selectedBlock = input.selectedBlockId
    ? input.blocks.find((block) => block.id === input.selectedBlockId) ?? null
    : null;

  let updatedBlocks = fallbackApply(action, input.blocks, input.siteName);
  let analysisLines: string[] = [];

  const aiRewrite = await aiRewriteTarget({
    ...input,
    siteName: input.generationContext?.businessName || input.siteName,
    pageTitle: input.pageTitle,
    blocks: input.blocks,
    instruction: [
      input.instruction,
      input.generationContext?.niche ? `Niche: ${input.generationContext.niche}` : "",
      input.generationContext?.location ? `Location: ${input.generationContext.location}` : "",
      input.generationContext?.templateId ? `Template: ${input.generationContext.templateId}` : "",
      input.generationContext?.pageType ? `Page Type: ${input.generationContext.pageType}` : "",
      input.generationContext?.sourceUrl ? `Source URL: ${input.generationContext.sourceUrl}` : "",
      input.generationContext?.conversionNotes?.primary_goal ? `Primary Goal: ${input.generationContext.conversionNotes.primary_goal}` : "",
      selectedBlock ? `Selected Block Type: ${selectedBlock.type}` : "",
    ].filter(Boolean).join("\n"),
    selectedBlock,
    executionTier,
  }).catch(() => null);
  if (aiRewrite && ["hero", "cta", "faq", "trust_badges", "testimonials", "features"].includes(aiRewrite.target)) {
    updatedBlocks = applyTargetRewrite(updatedBlocks, aiRewrite.target, aiRewrite.props, input.siteName, selectedBlock?.id);
    analysisLines = Object.values(aiRewrite.analysis.issues).flat().slice(0, 2);
  } else if (action === "improve_hero") {
    const aiHero = await aiImproveHero(input.siteName, input.pageTitle, updatedBlocks).catch(() => null);
    if (aiHero) {
      updatedBlocks = updatedBlocks.map((block) =>
        block.type === "hero"
          ? {
              ...block,
              props: {
                ...block.props,
                ...(aiHero.headline ? { headline: aiHero.headline } : {}),
                ...(aiHero.subheadline ? { subheadline: aiHero.subheadline } : {}),
                ...(aiHero.socialProofText ? { socialProofText: aiHero.socialProofText } : {}),
                ...(aiHero.trustItems ? { trustItems: aiHero.trustItems } : {}),
              },
            }
          : block
      );
    }
  }

  const report: CopilotReport = {
    action,
    summary:
      action === "unknown"
        ? selectedBlock
          ? `Copilot regenerated the selected ${selectedBlock.type} section with conversion guidance.`
          : "Copilot could not match that request to a structured page action yet."
        : analysisLines.length
          ? `Copilot ran ${action.replaceAll("_", " ")} with conversion guidance: ${analysisLines.join(" ")}`
          : `Copilot ran ${action.replaceAll("_", " ")} on this page.`,
    before,
    after: summarizeAfter(action),
  };

  return { updatedBlocks, report };
}

import Anthropic from "@anthropic-ai/sdk";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeInput } from "@/src/logic/ad-os/normalizeInput";
import { fetchPage } from "@/src/logic/ad-os/fetchPage";
import { extractSignals } from "@/src/logic/ad-os/extractSignals";
import {
  buildSiteInputFromScan,
  createSiteFromBlueprint,
  generateConversionSiteBlueprint,
  type SiteGenerationMetadata,
} from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type SiteScanMode = "clone" | "improve";

type WebsiteSection = {
  type: string;
  headline: string;
  body?: string;
  items?: string[] | { question: string; answer: string }[];
  steps?: string[];
  primary_cta?: string;
};

type WebsiteJson = {
  business_name?: string;
  page_type?: string;
  seo?: { title?: string; meta_description?: string };
  hero?: {
    headline?: string;
    subheadline?: string;
    primary_cta?: string;
    secondary_cta?: string;
  };
  sections?: WebsiteSection[];
  visual_direction?: { style?: string; color_direction?: string; image_prompts?: string[] };
  notes?: { conversion_notes?: string[]; mobile_notes?: string[] };
};

type SiteBlock = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

type CreateSiteFromScanInput = {
  userId: string;
  url: string;
  siteName?: string;
  niche?: string;
  notes?: string;
  mode: SiteScanMode;
  executionTier?: "core" | "elite";
  triggerN8n?: boolean;
};

type CreateSiteFromScanResult = {
  site: {
    id: string;
    name: string;
    slug: string;
    published: boolean;
  };
  executionTier: "core" | "elite";
  source: {
    url: string;
    title: string;
    headings: string[];
    ctas: string[];
    mode: SiteScanMode;
    niche: string;
  };
  summary: string;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function extractJsonObject(text: string): WebsiteJson | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as WebsiteJson;
  } catch {
    return null;
  }
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 30)
    .slice(0, 6);
}

function buildFallbackWebsiteJson(input: {
  mode: SiteScanMode;
  businessName: string;
  niche: string;
  pageTitle: string;
  metaDescription: string;
  headings: string[];
  ctas: string[];
  signals: ReturnType<typeof extractSignals>;
  notes?: string;
}): WebsiteJson {
  const primaryHeading = input.headings[0] || input.signals.headline || input.pageTitle || `Welcome to ${input.businessName}`;
  const secondaryHeading =
    input.mode === "clone"
      ? input.headings[1] || input.metaDescription || "A structure-first rebuild based on the source site."
      : `A sharper, higher-converting ${input.niche} experience built from the source site and improved with clearer positioning, trust, and calls to action.`;

  const benefits = [
    input.signals.benefits[0] || "Faster decision-making",
    input.signals.benefits[1] || "Clearer value proposition",
    input.signals.benefits[2] || "Stronger conversion path",
  ];
  const trustItems = [
    input.signals.trustSignals[0] || "Clear trust markers",
    input.signals.trustSignals[1] || "Focused proof points",
    input.signals.trustSignals[2] || "Mobile-first clarity",
  ];
  const processSteps = input.mode === "clone"
    ? ["Review the original structure", "Rebuild the page sections", "Publish a cleaner version in your workspace"]
    : ["Audit the original offer", "Upgrade the story and proof", "Launch a conversion-focused rebuild"];

  const faqs = [
    {
      question: "How close is this to the original site?",
      answer:
        input.mode === "clone"
          ? "This draft keeps the source structure and key messaging cues while rebuilding it inside your site system."
          : "This draft uses the source site as reference material, then improves the positioning, hierarchy, and conversion flow.",
    },
    {
      question: "Can I edit everything after generation?",
      answer: "Yes. The generated draft is added to your Sites workspace so you can adjust copy, blocks, products, and styling before publishing.",
    },
  ];

  return {
    business_name: input.businessName,
    page_type: input.mode === "clone" ? "reference-rebuild" : "improved-conversion-rebuild",
    seo: {
      title: `${input.businessName} | ${input.mode === "clone" ? "Reference Rebuild" : "Conversion Upgrade"}`,
      meta_description: input.metaDescription || `AI-built ${input.niche} site draft for ${input.businessName}.`,
    },
    hero: {
      headline: primaryHeading,
      subheadline: secondaryHeading,
      primary_cta: input.ctas[0] || (input.mode === "clone" ? "Explore the Site" : "Get Started"),
      secondary_cta: input.ctas[1] || "See How It Works",
    },
    sections: [
      {
        type: "solution",
        headline: input.mode === "clone" ? "What this rebuild preserves" : "What this rebuild improves",
        body:
          input.mode === "clone"
            ? "The page keeps the strongest structure, messaging cues, and intent from the original site while making it editable and deployable in your workspace."
            : "The page keeps the niche fit from the source site, then upgrades the clarity, trust, and conversion flow to feel more like a top performer.",
      },
      {
        type: "benefits",
        headline: input.mode === "clone" ? "Core sections captured from the source" : "Conversion upgrades built into this draft",
        items: benefits,
      },
      {
        type: "trust",
        headline: "Trust and authority signals",
        items: trustItems,
      },
      {
        type: "process",
        headline: "How this site comes together",
        steps: processSteps,
      },
      {
        type: "faq",
        headline: "Questions before you publish",
        items: faqs,
      },
      {
        type: "cta",
        headline: input.mode === "clone" ? "Open the draft and keep building" : "Open the improved draft and tune it for launch",
        body: input.notes?.trim() || "The site is ready in your workspace now.",
        primary_cta: input.ctas[0] || "Open Draft",
      },
    ],
    visual_direction: {
      style: input.mode === "clone" ? "Clean reconstruction of the source site" : "Top-1%-inspired niche landing page with stronger hierarchy",
      color_direction: input.mode === "clone" ? "Respect the reference tone where possible" : "Sharper contrast, stronger CTA emphasis, polished modern layout",
      image_prompts: [`${input.niche} website hero visual for ${input.businessName}`],
    },
    notes: {
      conversion_notes: [
        "Keep the headline outcome-driven.",
        "Make primary CTA visible above the fold and repeated throughout the page.",
        "Use proof and trust cues before the offer ask.",
      ],
      mobile_notes: [
        "Keep sections short and stacked cleanly on mobile.",
        "Front-load CTA, trust, and proof in the first two viewports.",
      ],
    },
  };
}

function isStringArray(arr: unknown[]): arr is string[] {
  return arr.length === 0 || typeof arr[0] === "string";
}

function convertToBlocks(json: WebsiteJson, siteName: string): SiteBlock[] {
  const blocks: SiteBlock[] = [];

  blocks.push({
    id: crypto.randomUUID(),
    type: "urgency",
    props: {
      text: "AI Scan Mode Active | Reference site transformed into an editable draft",
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "hero",
    props: {
      headline: json.hero?.headline ?? `Welcome to ${siteName}`,
      subheadline: json.hero?.subheadline ?? "Built from a live site reference and tuned for conversion.",
      buttonText: json.hero?.primary_cta ?? "Get Started",
      secondaryButtonText: json.hero?.secondary_cta ?? "Learn More",
      textAlign: "center",
      socialProofText: "Built with Himalaya Scan Mode",
      bgColor: "#020509",
    },
  });

  for (const section of json.sections ?? []) {
    switch (section.type) {
      case "solution":
      case "problem":
        blocks.push({
          id: crypto.randomUUID(),
          type: "text",
          props: {
            content: `## ${section.headline}\n\n${section.body ?? ""}`,
            bgColor: "#07101f",
          },
        });
        break;

      case "benefits": {
        const rawItems = section.items ?? [];
        const items = isStringArray(rawItems)
          ? rawItems.map((item) => ({ icon: "✓", title: item, body: "" }))
          : [];
        blocks.push({
          id: crypto.randomUUID(),
          type: "features",
          props: {
            title: section.headline,
            subtitle: section.body ?? "",
            columns: 3,
            items,
            bgColor: "#050a14",
          },
        });
        break;
      }

      case "trust": {
        const rawItems = section.items ?? [];
        const badges = isStringArray(rawItems)
          ? rawItems.map((item) => ({ icon: "✅", label: item }))
          : [];
        blocks.push({
          id: crypto.randomUUID(),
          type: "trust_badges",
          props: {
            title: section.headline,
            badges,
          },
        });
        break;
      }

      case "process":
        blocks.push({
          id: crypto.randomUUID(),
          type: "process",
          props: {
            title: section.headline,
            steps: (section.steps ?? []).map((step, index) => ({
              icon: String(index + 1),
              title: step,
              body: "",
            })),
          },
        });
        break;

      case "faq": {
        const rawItems = section.items ?? [];
        const items = !isStringArray(rawItems)
          ? rawItems.map((item) => ({ q: item.question, a: item.answer }))
          : [];
        blocks.push({
          id: crypto.randomUUID(),
          type: "faq",
          props: {
            title: section.headline,
            items,
            bgColor: "#050a14",
          },
        });
        break;
      }

      case "cta":
        blocks.push({
          id: crypto.randomUUID(),
          type: "cta",
          props: {
            headline: section.headline,
            subheadline: section.body ?? "",
            buttonText: section.primary_cta ?? "Get Started",
            bgColor: "#020509",
          },
        });
        break;

      default:
        break;
    }
  }

  blocks.push({
    id: crypto.randomUUID(),
    type: "testimonials",
    props: {
      title: "Why this draft is built to perform",
      items: [
        {
          name: "AI Build Note",
          role: "Scan Mode",
          quote: "This page was generated from a live reference site, then rebuilt into a cleaner, more editable funnel structure.",
          stars: 5,
        },
      ],
      bgColor: "#020509",
    },
  });

  blocks.push({
    id: crypto.randomUUID(),
    type: "footer",
    props: {
      copyright: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
      links: [
        { label: "Privacy Policy", url: "#" },
        { label: "Terms", url: "#" },
      ],
      showPoweredBy: true,
    },
  });

  return blocks;
}

async function generateWebsiteJson(input: {
  mode: SiteScanMode;
  businessName: string;
  niche: string;
  pageTitle: string;
  metaDescription: string;
  headings: string[];
  ctas: string[];
  bodyText: string;
  notes?: string;
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  const modeInstruction =
    input.mode === "clone"
      ? "Rebuild the source site's structure and positioning faithfully, but make the result cleaner, tighter, and easier to edit."
      : "Use the source site only as raw competitive intelligence, then produce a meaningfully better, higher-converting version for this niche.";

  const prompt = `You are the website scan-to-build engine for Himalaya.
Your job is to study a reference site and generate a site blueprint that can become a top-performing draft in our builder.

IMPORTANT:
- Think like a top 1% landing-page strategist for the ${input.niche} niche.
- ${modeInstruction}
- Use the source material for text, visual direction, and offer clues.
- Return only valid JSON.

Return JSON with this exact structure:
{
  "business_name": "",
  "page_type": "reference-rebuild|conversion-upgrade",
  "seo": { "title": "", "meta_description": "" },
  "hero": { "headline": "", "subheadline": "", "primary_cta": "", "secondary_cta": "" },
  "sections": [
    { "type": "solution", "headline": "", "body": "" },
    { "type": "benefits", "headline": "", "items": ["", "", ""] },
    { "type": "trust", "headline": "", "items": ["", "", ""] },
    { "type": "process", "headline": "", "steps": ["", "", ""] },
    { "type": "faq", "headline": "", "items": [{ "question": "", "answer": "" }] },
    { "type": "cta", "headline": "", "body": "", "primary_cta": "" }
  ],
  "visual_direction": { "style": "", "color_direction": "", "image_prompts": [""] },
  "notes": { "conversion_notes": ["", "", ""], "mobile_notes": ["", ""] }
}

Reference input:
- business_name: ${input.businessName}
- niche: ${input.niche}
- scan_mode: ${input.mode}
- page_title: ${input.pageTitle}
- meta_description: ${input.metaDescription}
- headings: ${input.headings.join(" | ") || "none"}
- ctas: ${input.ctas.join(" | ") || "none"}
- notes_from_user: ${input.notes?.trim() || "none"}
- body_excerpt:
${input.bodyText.slice(0, 2500)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 2200,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return extractJsonObject(text);
}

async function triggerN8nSiteScan(payload: Record<string, unknown>) {
  const webhookUrl = process.env.N8N_SITE_SCAN_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[Site Scan] n8n trigger failed:", error);
  }
}

export async function createSiteFromScan(input: CreateSiteFromScanInput): Promise<CreateSiteFromScanResult> {
  const executionTier = input.executionTier === "core" ? "core" : "elite";
  const siteInput = await buildSiteInputFromScan({
    businessName: input.siteName,
    niche: input.niche,
    location: input.notes?.match(/location:\s*([^\n]+)/i)?.[1],
    url: input.url,
    executionTier,
    notes: input.notes,
  });
  const generated = await generateConversionSiteBlueprint(siteInput);
  const generationMetadata: SiteGenerationMetadata = {
    sourceMode: input.mode === "clone" ? "scan_clone" : "scan_improve",
    executionTier,
    sourceUrl: siteInput.currentSite?.url,
    sourceTitle: siteInput.currentSite?.title,
    sourceHeadings: siteInput.currentSite?.headings ?? [],
    sourceCtas: siteInput.currentSite?.ctas ?? [],
    sourceImages: siteInput.currentSite?.images ?? [],
    businessName: siteInput.businessName,
    niche: siteInput.niche,
    location: siteInput.location,
    templateId: generated.blueprint.template_id,
    pageType: generated.blueprint.page_type,
    blueprintScore: generated.blueprint.score,
    conversionNotes: generated.blueprint.conversion_notes,
    generationTrace: generated.blueprint.generation_trace,
  };
  const created = await createSiteFromBlueprint({
    userId: input.userId,
    siteName: input.mode === "clone" ? `${siteInput.businessName} Clone Draft` : `${siteInput.businessName} AI Upgrade`,
    description:
      input.mode === "clone"
        ? `Reference rebuild generated from ${siteInput.currentSite?.url ?? input.url}`
        : `Conversion-focused site draft generated from ${siteInput.currentSite?.url ?? input.url}`,
    blueprint: generated.blueprint,
    referenceImages: siteInput.currentSite?.images ?? [],
    elevateVisuals: input.mode === "improve" || executionTier === "elite",
    generationMetadata,
  });

  const currentSite = siteInput.currentSite;
  const summarySentences = splitIntoSentences(currentSite?.bodyText ?? "");

  if (input.triggerN8n !== false) {
    await triggerN8nSiteScan({
      userId: input.userId,
      sourceUrl: currentSite?.url ?? input.url,
      mode: input.mode,
      niche: siteInput.niche,
      siteId: created.site.id,
      siteSlug: created.site.slug,
      businessName: siteInput.businessName,
      headings: currentSite?.headings ?? [],
      ctas: currentSite?.ctas ?? [],
      summarySentences,
      visualDirection: {
        templateId: generated.blueprint.template_id,
        pageType: generated.blueprint.page_type,
        tone: generated.blueprint.brand.tone,
      },
      notes: generated.blueprint.conversion_notes,
    });
  }

  return {
    site: created.site,
    executionTier,
    source: {
      url: currentSite?.url ?? input.url,
      title: currentSite?.title ?? siteInput.businessName,
      headings: currentSite?.headings ?? [],
      ctas: currentSite?.ctas ?? [],
      mode: input.mode,
      niche: siteInput.niche,
    },
    summary:
      input.mode === "clone"
        ? `Built a draft that mirrors the source site's structure and messaging cues while making it editable in your workspace.`
        : `Built an upgraded draft using the source site as reference, then improved the page for stronger niche fit, hierarchy, and conversion flow.`,
  };
}

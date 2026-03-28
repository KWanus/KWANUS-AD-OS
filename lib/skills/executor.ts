import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type { SkillInput, SkillResult } from "./types";
import { getSkill } from "./registry";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import { getSkillPrompt, hasSkillPrompt, buildSystemPrompt } from "@/prompts/skillPrompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildPrompt(slug: string, input: SkillInput): string {
  switch (slug) {
    case "ad-copy":
      return `You are a world-class direct-response copywriter. Generate 5 high-converting ad variations.

OFFER: ${input.offer}
TARGET AUDIENCE: ${input.audience}
PLATFORM: ${input.platform}
OBJECTIVE: ${input.objective}
TONE: ${input.tone ?? "Bold & direct"}

For each variation, provide:
- HOOK (first line — must stop the scroll)
- BODY (2–4 sentences)
- CTA (call to action)

Format each as:
---
VARIATION [N]: [short angle name]
HOOK: ...
BODY: ...
CTA: ...
---

Make the hooks radically different (curiosity, stat, story, pain, bold claim). Be specific, not generic.`;

    case "tiktok-script":
      return `You are a viral TikTok creator and ad strategist. Write a ${input.duration ?? "30 seconds"} video script.

PRODUCT/SERVICE: ${input.product}
HOOK ANGLE: ${input.hook_angle}
CTA: ${input.cta ?? "Link in bio"}

Format:
[0:00–0:03] HOOK (spoken + text overlay)
[timestamp] Scene description | Spoken VO | Text overlay
...
[final 3s] CTA card

Keep every line punchy. The hook must work in the first 2 seconds. Include 3 alternative hook options at the end.`;

    case "google-ads":
      return `You are a Google Ads expert. Create a complete Responsive Search Ad pack.

BUSINESS: ${input.business}
LANDING URL: ${input.landing_url ?? "TBD"}
LOCATION: ${input.location ?? "United States"}
DAILY BUDGET: $${input.budget_daily ?? "50"}

Provide:
1. 15 HEADLINES (max 30 characters each — be specific, include keywords)
2. 4 DESCRIPTIONS (max 90 characters each)
3. 30 KEYWORDS grouped by match type: [Exact], [Phrase], Broad
4. 10 NEGATIVE KEYWORDS to exclude irrelevant traffic
5. 3 BIDDING RECOMMENDATIONS for this budget

Format clearly with numbered lists for each section.`;

    case "landing-page":
      return `You are a conversion copywriter. Write complete copy for an 8-block landing page.

OFFER: ${input.offer}
AUDIENCE: ${input.audience}
BRAND: ${input.business_name}
TONE: ${input.tone ?? "Professional & clean"}

Return a JSON object with this exact structure:
{
  "hero": { "headline": "...", "subheadline": "...", "buttonText": "..." },
  "features": { "title": "...", "items": [{"icon":"⚡","title":"...","body":"..."},{"icon":"🎯","title":"...","body":"..."},{"icon":"💎","title":"...","body":"..."}] },
  "testimonials": { "title": "What clients say", "items": [{"name":"[Fictional name]","role":"[Role]","quote":"...","stars":5},{"name":"...","role":"...","quote":"...","stars":5}] },
  "cta": { "headline": "...", "subheadline": "...", "buttonText": "..." },
  "faq": { "title": "Frequently Asked Questions", "items": [{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}] },
  "seoTitle": "...",
  "seoDesc": "..."
}

Return ONLY valid JSON, no markdown fences.`;

    case "seo-audit":
      return `You are an SEO expert. Provide a comprehensive SEO audit.

URL: ${input.url}
NICHE: ${input.niche ?? "general business"}
TARGET KEYWORD: ${input.target_keyword ?? "not specified"}

Audit format:
## SEO SCORE: [0–100]/100

## CRITICAL ISSUES (fix immediately)
- [issue]: [why it matters] → [exact fix]

## QUICK WINS (fix this week, high ROI)
- ...

## KEYWORD OPPORTUNITIES
- [keyword] | Volume: [est] | Difficulty: [low/med/high] | Recommendation

## CONTENT GAPS
- ...

## TECHNICAL CHECKLIST
- [ ] Title tag (60 chars max)
- [ ] Meta description (160 chars max)
- [ ] H1 present and includes keyword
- [ ] Mobile-friendly
- [ ] Page speed < 3s
- [ ] Schema markup
- [ ] Internal linking
- [ ] Image alt text

## 30-DAY ACTION PLAN
Week 1: ...
Week 2: ...
Week 3–4: ...`;

    case "email-sequence":
      return `You are an email marketing strategist. Write a 5-email nurture sequence.

OFFER: ${input.offer}
AUDIENCE: ${input.audience}
FROM NAME: ${input.from_name ?? "Your Brand"}
GOAL: ${input.sequence_goal ?? "Sell a product"}

For each email provide:
EMAIL [N]: [name of email in sequence]
SUBJECT: ...
PREVIEW TEXT: ...
BODY:
[Full email body — 150–250 words, personalized feel]

Sequence structure:
1. Welcome + quick win (deliver immediate value)
2. Story / credibility (build trust)
3. Problem agitation (deepen the pain)
4. Solution reveal (introduce your offer naturally)
5. Offer + urgency (close with CTA)

Use {{first_name}} for personalization. Write like a human, not a robot.`;

    case "broadcast-blast":
      return `You are a top email copywriter. Write one high-converting broadcast email.

TOPIC: ${input.subject_matter}
TONE: ${input.tone ?? "Exciting / launch energy"}
CTA TEXT: ${input.cta_text ?? "Learn More"}
CTA URL: ${input.cta_url ?? "#"}

Return:
SUBJECT LINE: ...
PREVIEW TEXT: ...
BODY:
[Full email — 150–300 words, conversational, one clear CTA]

Rules: One topic. One CTA. Make the opening line irresistible. Use short paragraphs. No filler words.`;

    case "lead-magnet":
      return `You are a lead generation strategist. Create a complete lead magnet package.

TOPIC: ${input.topic}
AUDIENCE: ${input.audience}
FORMAT: ${input.format}
BUSINESS: ${input.business_name ?? "Your Business"}

Provide:
## LEAD MAGNET OUTLINE
Title: ...
Subtitle: ...
[10–15 specific, actionable points/sections]

## OPT-IN PAGE COPY
Headline: ...
Subheadline: ...
Bullet points (5): ...
Button text: ...

## FOLLOW-UP EMAIL (sent immediately after opt-in)
Subject: ...
Body: [100–150 words delivering the lead magnet + next step]

## TRAFFIC TIPS
3 best ways to drive traffic to this specific lead magnet`;

    case "offer-script":
      return `You are a world-class sales copywriter. Write a complete ${input.format ?? "VSL (video sales letter)"}.

OFFER: ${input.offer_name}
PRICE: ${input.price}
AUDIENCE: ${input.audience}
BIG PROMISE: ${input.big_promise ?? "Transform your results"}

Script structure with timestamps:
[0:00–0:30] OPENING HOOK — grab attention, qualify viewer
[0:30–2:00] PROBLEM AGITATION — make them feel the pain
[2:00–4:00] CREDIBILITY — who are you, why listen?
[4:00–7:00] SOLUTION REVEAL — introduce your offer
[7:00–9:00] PROOF — results, testimonials, case studies (write placeholders)
[9:00–11:00] OFFER STACK — what they get, total value
[11:00–12:00] PRICE REVEAL + CLOSE
[12:00–12:30] CTA — exactly what to do next

## OBJECTION HANDLERS (for sales calls or FAQ)
1. "It's too expensive" →
2. "I don't have time" →
3. "I need to think about it" →`;

    default:
      throw new Error(`Unknown skill: ${slug}`);
  }
}

function buildSkillSystemPrompt(skillName: string, businessContext: string, executionTier: "core" | "elite"): string {
  return `You are the elite execution engine for Himalaya Marketing OS.
You are generating output for the "${skillName}" skill.

CORE DIRECTIVE:
- Use the user's saved business profile as grounding context whenever it is relevant.
- Think like a top 1% operator in this exact niche before writing anything.
- Prefer sharp, specific, conversion-focused outputs over generic best practices.
- When inputs are incomplete, infer intelligently from the business context instead of staying vague.
- Return in the exact format requested by the skill prompt.
- Execution tier: ${executionTier}
- ${executionTier === "elite"
    ? "Elite means top-operator output: tighter specificity, better proof logic, stronger angles, and higher-conviction execution."
    : "Core means strong launch-ready output: clear, structured, useful, and conversion-focused without overextending."}

${businessContext}`;
}

// ---------------------------------------------------------------------------
// Post-processing: save results to DB
// ---------------------------------------------------------------------------

async function saveResults(
  slug: string,
  userId: string,
  rawText: string
): Promise<{ created: SkillResult["created"]; data: SkillResult["data"] }> {
  const created: SkillResult["created"] = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { rawText };

  try {
    if (slug === "landing-page") {
      // Parse the JSON response and build a site
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, any>;
        data.parsed = parsed;

        // Build blocks from parsed sections
        const blocks = [];
        if (parsed.hero) blocks.push({ id: `hero-${Date.now()}`, type: "hero", props: parsed.hero });
        if (parsed.features) blocks.push({ id: `features-${Date.now()}`, type: "features", props: parsed.features });
        if (parsed.testimonials) blocks.push({ id: `testimonials-${Date.now()}`, type: "testimonials", props: parsed.testimonials });
        if (parsed.cta) blocks.push({ id: `cta-${Date.now()}`, type: "cta", props: parsed.cta });
        if (parsed.faq) blocks.push({ id: `faq-${Date.now()}`, type: "faq", props: parsed.faq });

        // Create site + page
        const baseSlug = `skill-${Date.now()}`;
        const site = await prisma.site.create({
          data: {
            userId,
            name: `AI Landing Page — ${new Date().toLocaleDateString()}`,
            slug: baseSlug,
            published: false,
            theme: { primaryColor: "#06b6d4", font: "inter", mode: "dark" },
            pages: {
              create: {
                title: "Home",
                slug: "home",
                published: true,
                blocks: blocks as never,
                seoTitle: parsed.seoTitle ?? null,
                seoDesc: parsed.seoDesc ?? null,
              },
            },
          },
          include: { pages: true },
        });
        created.siteId = site.id;
        data.pageId = site.pages[0]?.id ?? null;
      }
    }

    if (slug === "email-sequence") {
      // Parse emails from the raw text and create an email flow
      const flow = await prisma.emailFlow.create({
        data: {
          userId,
          name: `AI Email Sequence — ${new Date().toLocaleDateString()}`,
          status: "draft",
          trigger: "manual",
          nodes: [] as never,
        },
      });
      created.emailFlowId = flow.id;
    }

    if (slug === "broadcast-blast") {
      // Extract subject + body and create a broadcast draft
      const subjectMatch = rawText.match(/SUBJECT LINE:\s*(.+)/i);
      const previewMatch = rawText.match(/PREVIEW TEXT:\s*(.+)/i);
      const bodyStart = rawText.indexOf("BODY:");
      const body = bodyStart >= 0 ? rawText.slice(bodyStart + 5).trim() : rawText;

      const broadcast = await prisma.emailBroadcast.create({
        data: {
          userId,
          name: `AI Broadcast — ${new Date().toLocaleDateString()}`,
          subject: subjectMatch?.[1]?.trim() ?? "Your Broadcast",
          previewText: previewMatch?.[1]?.trim() ?? "",
          body,
          status: "draft",
          segmentTags: [],
        },
      });
      created.broadcastId = broadcast.id;
    }

    if (slug === "lead-magnet") {
      // Build opt-in page as a site
      const site = await prisma.site.create({
        data: {
          userId,
          name: `Lead Magnet — ${new Date().toLocaleDateString()}`,
          slug: `lead-magnet-${Date.now()}`,
          published: false,
          theme: { primaryColor: "#8b5cf6", font: "inter", mode: "dark" },
          pages: {
            create: {
              title: "Opt-In Page",
              slug: "home",
              published: true,
              blocks: [] as never,
            },
          },
        },
      });
      created.siteId = site.id;
    }
  } catch (err) {
    console.error("Skill save error:", err);
  }

  return { created, data };
}

// ---------------------------------------------------------------------------
// Main executor
// ---------------------------------------------------------------------------

export async function runSkill(
  slug: string,
  userId: string,
  input: SkillInput
): Promise<SkillResult> {
  const skill = getSkill(slug);
  if (!skill) {
    return { ok: false, skill: slug, summary: "", created: {}, data: {}, error: "Unknown skill" };
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { ok: false, skill: slug, summary: "", created: {}, data: {}, error: "AI service not configured. Please set ANTHROPIC_API_KEY." };
    }

    // Use centralized prompt library if available, fallback to inline prompts
    const prompt = hasSkillPrompt(slug) ? getSkillPrompt(slug, input) : buildPrompt(slug, input);
    const businessContext = await getBusinessContext(userId);
    const executionTier = input.executionTier === "core" ? "core" : "elite";
    const system = buildSkillSystemPrompt(skill.name, businessContext, executionTier);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const { created, data } = await saveResults(slug, userId, rawText);

    return {
      ok: true,
      skill: slug,
      summary: `${skill.name} completed successfully (${executionTier} execution).`,
      created,
      data: {
        ...data,
        executionTier,
      },
    };
  } catch (err) {
    console.error(`Skill ${slug} error:`, err);
    return {
      ok: false,
      skill: slug,
      summary: "",
      created: {},
      data: {},
      error: err instanceof Error ? err.message : "Failed",
    };
  }
}

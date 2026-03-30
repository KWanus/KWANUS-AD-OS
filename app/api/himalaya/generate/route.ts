import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import type {
  DiagnosisPayload,
  ScratchDiagnosis,
  ImproveDiagnosis,
  StrategyPayload,
  GenerationPayload,
  HomepagePayload,
  CreatedResources,
  SiteBlock,
} from "@/lib/himalaya/contracts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Himalaya Generation API — creates assets from DiagnosisPayload + StrategyPayload.
 *
 * Returns typed GenerationPayload + CreatedResources (saved site/email IDs).
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ ok: false, error: "AI not configured." }, { status: 500 });
    }

    const body = await req.json() as {
      mode: "scratch" | "improve";
      diagnosis: DiagnosisPayload;
      strategy: StrategyPayload;
    };

    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch { /* auth optional */ }

    // Generate
    const systemPrompt = body.mode === "scratch"
      ? SCRATCH_GENERATION_SYSTEM
      : IMPROVE_GENERATION_SYSTEM;

    const userPrompt = body.mode === "scratch"
      ? buildScratchPrompt(body.diagnosis as ScratchDiagnosis, body.strategy)
      : buildImprovePrompt(body.diagnosis as ImproveDiagnosis, body.strategy);

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json({ ok: false, error: "Generation failed." }, { status: 500 });
    }

    const parsed = JSON.parse(match[0]);
    const genWarnings: string[] = [];
    const hasHomepage = "homepage" in parsed && parsed.homepage?.headline;
    const hasEmails = "emails" in parsed && parsed.emails?.sequence?.length;
    if (!hasHomepage) genWarnings.push("No homepage generated");
    if (!hasEmails) genWarnings.push("No email sequence generated");
    const generated: GenerationPayload = {
      ...parsed,
      status: genWarnings.length ? "partial" : "success",
      warnings: genWarnings,
    };

    // Save to DB
    const created = await saveToDb(generated, userId);

    // Save business profile for scratch users
    if (userId && body.mode === "scratch" && "profile" in generated) {
      await saveBusinessProfile(userId, body.diagnosis as ScratchDiagnosis, generated);
    }

    return NextResponse.json({ ok: true, mode: body.mode, generated, created });
  } catch (err) {
    console.error("Himalaya generate error:", err);
    return NextResponse.json({ ok: false, error: "Generation failed." }, { status: 500 });
  }
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildScratchPrompt(diagnosis: ScratchDiagnosis, strategy: StrategyPayload): string {
  return `BUSINESS TYPE: ${diagnosis.businessType}
NICHE: ${diagnosis.niche}
GOAL: ${diagnosis.goal}
DESCRIPTION: ${diagnosis.description || "none"}
ARCHETYPE: ${diagnosis.archetype ? JSON.stringify(diagnosis.archetype) : "none"}

STRATEGY:
${JSON.stringify(strategy, null, 2)}

Generate everything. Be specific to the niche. Write copy that converts.`;
}

function buildImprovePrompt(diagnosis: ImproveDiagnosis, strategy: StrategyPayload): string {
  return `DIAGNOSIS:
${JSON.stringify(diagnosis, null, 2)}

STRATEGY:
${JSON.stringify(strategy, null, 2)}

Fix the biggest weaknesses. Rewrite homepage. Create follow-up emails. Generate ad angles. Build action roadmap.`;
}

// ─── DB Save ─────────────────────────────────────────────────────────────────

async function saveToDb(
  generated: GenerationPayload,
  userId: string | null
): Promise<CreatedResources> {
  const result: CreatedResources = { siteId: null, emailFlowId: null };
  if (!userId) return result;

  // Save site
  const homepage = "homepage" in generated ? generated.homepage : null;
  if (homepage) {
    try {
      const blocks = buildSiteBlocks(homepage);
      const name = "profile" in generated ? (generated.profile?.businessName || "Himalaya Site") : "Himalaya Site";

      const site = await prisma.site.create({
        data: {
          userId,
          name,
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
    } catch (e) {
      console.error("Site save failed:", e);
    }
  }

  // Save email flow
  const emails = "emails" in generated ? generated.emails : null;
  if (emails?.sequence?.length) {
    try {
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
    } catch (e) {
      console.error("Email flow save failed:", e);
    }
  }

  return result;
}

async function saveBusinessProfile(
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

function buildSiteBlocks(homepage: HomepagePayload): SiteBlock[] {
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

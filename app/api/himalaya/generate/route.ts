import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Himalaya Generation API — creates assets based on strategy + diagnosis.
 *
 * Takes the diagnosis context and generates:
 * - Business profile + positioning
 * - Offer direction
 * - Website blueprint + homepage copy
 * - Email starter sequence
 * - Action roadmap
 *
 * For "improve" mode, generates fixes instead of new assets.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ ok: false, error: "AI not configured." }, { status: 500 });
    }

    const body = await req.json() as {
      mode: "scratch" | "improve";
      diagnosis: Record<string, unknown>;
      strategy: Record<string, unknown>;
    };

    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch { /* auth optional */ }

    const systemPrompt = buildGenerationSystemPrompt(body.mode);
    const userPrompt = buildGenerationUserPrompt(body.mode, body.diagnosis, body.strategy);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json({ ok: false, error: "Generation failed." }, { status: 500 });
    }

    const generated = JSON.parse(jsonMatch[0]);

    // Persist site if homepage copy was generated
    let siteId: string | null = null;
    if (userId && generated.homepage) {
      try {
        const blocks = buildSiteBlocks(generated.homepage);
        const site = await prisma.site.create({
          data: {
            userId,
            name: generated.profile?.businessName || "Himalaya Site",
            slug: `himalaya-${Date.now()}`,
            published: false,
            theme: { primaryColor: "#06b6d4", font: "inter", mode: "dark" },
            pages: {
              create: {
                title: "Home",
                slug: "home",
                published: true,
                blocks: blocks as never,
                seoTitle: generated.homepage.seoTitle ?? null,
                seoDesc: generated.homepage.seoDesc ?? null,
              },
            },
          },
        });
        siteId = site.id;
      } catch (e) {
        console.error("Site creation failed:", e);
      }
    }

    // Persist email flow if generated
    let emailFlowId: string | null = null;
    if (userId && generated.emails?.sequence?.length) {
      try {
        const flow = await prisma.emailFlow.create({
          data: {
            userId,
            name: "Himalaya Starter Sequence",
            status: "draft",
            trigger: "manual",
            nodes: generated.emails.sequence as never,
          },
        });
        emailFlowId = flow.id;
      } catch (e) {
        console.error("Email flow creation failed:", e);
      }
    }

    // Save business profile if scratch mode
    if (userId && body.mode === "scratch" && generated.profile) {
      try {
        await prisma.businessProfile.upsert({
          where: { userId },
          create: {
            userId,
            businessType: String(body.diagnosis.businessType || ""),
            businessName: generated.profile.businessName || null,
            niche: String(body.diagnosis.niche || ""),
            mainOffer: generated.profile.offer || null,
            targetAudience: generated.profile.targetAudience || null,
            stage: "starting",
          },
          update: {
            businessName: generated.profile.businessName || undefined,
            mainOffer: generated.profile.offer || undefined,
            targetAudience: generated.profile.targetAudience || undefined,
          },
        });
      } catch (e) {
        console.error("Business profile save failed:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      mode: body.mode,
      generated,
      created: {
        siteId,
        emailFlowId,
      },
    });
  } catch (err) {
    console.error("Himalaya generate error:", err);
    return NextResponse.json({ ok: false, error: "Generation failed." }, { status: 500 });
  }
}

// ── Prompt builders ─────────────────────────────────────────────────────────

function buildGenerationSystemPrompt(mode: "scratch" | "improve"): string {
  if (mode === "scratch") {
    return `You are Himalaya's Generation Engine — a world-class business strategist and copywriter.

You create complete business foundations from scratch. Your output must feel custom, specific, and immediately actionable — not generic template filler.

Return a single JSON object (no markdown fences) with this structure:
{
  "profile": {
    "businessName": "suggested name",
    "positioning": "one-line positioning statement",
    "targetAudience": "specific audience description",
    "offer": "core offer description",
    "differentiator": "what makes this different",
    "priceRange": "suggested price range"
  },
  "idealCustomer": {
    "demographics": "who they are",
    "painPoints": ["pain 1", "pain 2", "pain 3"],
    "desires": ["desire 1", "desire 2", "desire 3"],
    "buyingTriggers": ["trigger 1", "trigger 2"]
  },
  "homepage": {
    "headline": "main headline",
    "subheadline": "supporting line",
    "heroButtonText": "CTA text",
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
    { "angle": "short name", "hook": "the hook line", "platform": "best platform for this" }
  ],
  "emails": {
    "sequence": [
      { "name": "email name", "subject": "subject line", "preview": "preview text", "body": "full email body", "delayDays": 0 }
    ]
  },
  "roadmap": {
    "thisWeek": ["action 1", "action 2"],
    "thisMonth": ["action 1", "action 2"],
    "thisQuarter": ["action 1", "action 2"]
  }
}

Be specific. Use the niche and business type to make everything feel tailored. Write copy that converts, not copy that fills space.`;
  }

  return `You are Himalaya's Generation Engine — a world-class business optimizer.

You take diagnosis results and generate specific fixes and improvements. Every output must directly address a weakness found in the diagnosis.

Return a single JSON object (no markdown fences) with this structure:
{
  "audit": {
    "overallScore": 0-100,
    "summary": "1-2 sentence assessment",
    "strengths": ["what's working"],
    "weaknesses": ["what's broken, ranked by impact"]
  },
  "fixes": [
    {
      "priority": 1,
      "area": "site | offer | trust | conversion | followup | brand",
      "problem": "what's wrong",
      "fix": "what to do",
      "impact": "high | medium | low"
    }
  ],
  "homepage": {
    "headline": "improved headline",
    "subheadline": "improved subheadline",
    "heroButtonText": "improved CTA",
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
    "thisWeek": ["fix 1", "fix 2"],
    "thisMonth": ["fix 1", "fix 2"],
    "thisQuarter": ["fix 1", "fix 2"]
  }
}

Every fix must tie back to the diagnosis. Be specific about what's broken and how to fix it. Don't suggest generic improvements — address the actual weaknesses.`;
}

function buildGenerationUserPrompt(
  mode: "scratch" | "improve",
  diagnosis: Record<string, unknown>,
  strategy: Record<string, unknown>
): string {
  if (mode === "scratch") {
    return `Generate a complete business foundation.

BUSINESS TYPE: ${diagnosis.businessType || "not specified"}
NICHE: ${diagnosis.niche || "not specified"}
GOAL: ${diagnosis.goal || "not specified"}
DESCRIPTION: ${diagnosis.description || "none"}

ARCHETYPE INTELLIGENCE:
${diagnosis.archetype ? JSON.stringify(diagnosis.archetype, null, 2) : "none"}

STRATEGY DECISION:
${JSON.stringify(strategy, null, 2)}

Generate everything this person needs to get started. Make it specific to their niche and business type. The copy should be ready to use, not placeholder text.`;
  }

  return `Generate fixes and improvements based on this diagnosis.

DIAGNOSIS:
${JSON.stringify(diagnosis, null, 2)}

STRATEGY DECISION:
${JSON.stringify(strategy, null, 2)}

Fix the biggest weaknesses first. Rewrite the homepage copy to address conversion issues. Create email follow-up to address retention gaps. Generate ad angles based on the audience and pain points found in diagnosis.`;
}

// ── Site block builder ──────────────────────────────────────────────────────

function buildSiteBlocks(homepage: Record<string, unknown>): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];
  const now = Date.now();

  // Hero block
  blocks.push({
    id: `hero-${now}`,
    type: "hero",
    props: {
      headline: homepage.headline,
      subheadline: homepage.subheadline,
      buttonText: homepage.heroButtonText || "Get Started",
    },
  });

  // Section blocks
  const sections = homepage.sections as Array<Record<string, unknown>> | undefined;
  if (sections) {
    for (const section of sections) {
      blocks.push({
        id: `${section.type}-${now}-${Math.random().toString(36).slice(2, 6)}`,
        type: String(section.type),
        props: section,
      });
    }
  }

  return blocks;
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const GLOBAL_RULE = `You are the world's best affiliate marketing strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% 7-figure affiliate marketers do in this niche.
Study the best bridge pages, email sequences, ad angles, and traffic strategies used by super-affiliates.
Then produce outputs that BEAT those benchmarks.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: AI_MODELS.CLAUDE_PRIMARY,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = r.content[0].type === "text" ? r.content[0].text : "{}";
  const match = raw.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON in Claude response");
  return JSON.parse(match[0]);
}

const BODY_SIZE_LIMIT = 64 * 1024; // 64 KB

// POST /api/affiliate/offers/analyze
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    // Rate limiting: 10 AI analysis calls per minute per user
    const rl = checkRateLimit(`${user.id}:affiliate-analyze`, RATE_LIMITS.AI_ANALYSIS);
    if (!rl.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many requests — please wait before trying again" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Body size guard
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > BODY_SIZE_LIMIT) {
      return NextResponse.json({ ok: false, error: "Request body too large" }, { status: 413 });
    }

    const body = await req.json() as {
      offerId?: string;
      name?: string;
      niche?: string;
      platform?: string;
      url?: string;
      commission?: number;
      gravity?: number;
      executionTier?: ExecutionTier;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    let offerId: string | null = null;
    let offerData: {
      name: string;
      niche: string;
      platform: string;
      url: string;
      commission?: string | number | null;
      gravity?: number | null;
    };

    if (body.offerId) {
      const offer = await prisma.affiliateOffer.findFirst({
        where: { id: body.offerId, userId: user.id },
      });
      if (!offer) return NextResponse.json({ ok: false, error: "Offer not found" }, { status: 404 });
      offerId = offer.id;
      offerData = {
        name: offer.name,
        niche: offer.niche,
        platform: offer.platform,
        url: offer.url,
        commission: offer.commission,
        gravity: offer.gravity,
      };
    } else {
      if (!body.name || !body.niche || !body.platform || !body.url) {
        return NextResponse.json(
          { ok: false, error: "name, niche, platform, and url are required when offerId is not provided" },
          { status: 400 }
        );
      }
      offerData = {
        name: body.name,
        niche: body.niche,
        platform: body.platform,
        url: body.url,
        commission: body.commission,
        gravity: body.gravity,
      };
    }

    const prompt = `Analyze this affiliate offer and return a JSON object with the exact structure specified.

Offer Details:
- Name: ${offerData.name}
- Platform: ${offerData.platform}
- Niche: ${offerData.niche}
- URL: ${offerData.url}
${offerData.commission != null ? `- Commission: ${offerData.commission}%` : ""}
${offerData.gravity != null ? `- Gravity: ${offerData.gravity}` : ""}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: analyze this like a serious affiliate operator deciding where to place budget and attention. Be sharper on EPC realism, angle durability, traffic fit, and buyer psychology."
  : "Core mode: produce a strong practical offer analysis with clear verdict logic and usable launch guidance."}

Return this exact JSON structure:
{
  "offerSummary": "concise overview of what this offer is and why affiliates would promote it",
  "targetAudience": {
    "demographics": "age, gender, income, location details",
    "psychographics": "values, beliefs, lifestyle, motivations",
    "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
    "desiredOutcome": "what the buyer ultimately wants"
  },
  "offerStrengths": ["strength 1", "strength 2", "strength 3"],
  "offerWeaknesses": ["weakness 1", "weakness 2"],
  "bestTrafficSources": [
    { "source": "Facebook Ads", "difficulty": "medium", "cost": "$$$", "notes": "why this works" }
  ],
  "competitorLandscape": "overview of who else is promoting in this niche",
  "estimatedEpc": "$X.XX",
  "verdict": "promote|pass|test_first",
  "verdictReason": "clear reasoning for the verdict",
  "topAngles": ["angle 1", "angle 2", "angle 3"],
  "audienceSegments": [
    { "segment": "segment name", "angle": "best angle for this segment", "size": "large|medium|small" }
  ]
}`;

    const analysis = await callClaude(GLOBAL_RULE, prompt);

    // If we have an offerId, update the record
    if (offerId) {
      const shouldApprove = analysis.verdict === "promote";
      await prisma.affiliateOffer.update({
        where: { id: offerId },
        data: {
          offerAnalysis: analysis as object,
          ...(shouldApprove ? { status: "approved" } : {}),
        },
      });
    }

    return NextResponse.json({ ok: true, analysis, offerId, executionTier });
  } catch (err) {
    console.error("Affiliate offer analyze error:", err);
    return NextResponse.json({ ok: false, error: "Analysis failed" }, { status: 500 });
  }
}

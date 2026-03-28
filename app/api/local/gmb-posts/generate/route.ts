import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best local SEO and digital marketing expert inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, analyze what the TOP 1% local marketing agencies charge and deliver for this niche/location.
Then produce outputs that BEAT those benchmarks — more specific, higher ROI, better positioned.`;

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

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user)
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { businessName, niche, location, auditId } = body as {
      businessName: string;
      niche: string;
      location: string;
      auditId?: string;
    };
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!businessName || !niche || !location) {
      return NextResponse.json(
        { ok: false, error: "businessName, niche, and location are required" },
        { status: 400 }
      );
    }

    // Optionally verify the audit belongs to this user
    if (auditId) {
      const auditCheck = await prisma.localAudit.findFirst({
        where: { id: auditId, userId: user.id },
        select: { id: true },
      });
      if (!auditCheck)
        return NextResponse.json({ ok: false, error: "Audit not found" }, { status: 404 });
    }

    const prompt = `Generate a 30-day Google My Business posting calendar for:
Business Name: ${businessName}
Niche: ${niche}
Location: ${location}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: make the content calendar feel like it came from a premium local content strategist. Use stronger local trust, offer framing, seasonal relevance, and booking intent."
  : "Core mode: produce a strong, practical local content calendar with clear CTAs and useful topic variation."}

Requirements:
- Mix post types: offer (25%), update (35%), event (15%), product (25%)
- Each post must be locally relevant — mention the city/area naturally
- Include niche-specific CTAs that drive phone calls and bookings
- Hashtags should be a mix of niche, local, and branded tags
- Body text 150-300 characters (GMB optimal length)
- Vary the posting days/times for maximum reach
- Posts should build a narrative arc over the 30 days (not random)

Return this exact JSON structure:
{
  "posts": [
    {
      "day": <1-30>,
      "type": "offer|update|event|product",
      "title": "post title (max 58 chars for GMB)",
      "body": "post body (150-300 chars, locally relevant, compelling)",
      "cta": "Learn More|Book|Order|Sign Up|Call Now|Get Offer",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "bestPostTime": "day of week and time e.g. Tuesday 10am"
    }
  ],
  "strategy": "brief explanation of the 30-day content strategy and what business outcomes it's designed to achieve"
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);

    // If auditId provided, store gmbPostsJson on the LocalAudit
    if (auditId) {
      await prisma.localAudit.update({
        where: { id: auditId },
        data: { gmbPostsJson: result as object },
      });
    }

    return NextResponse.json({ ok: true, calendar: result, executionTier });
  } catch (err) {
    console.error("GMB posts generate POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate GMB posts" },
      { status: 500 }
    );
  }
}

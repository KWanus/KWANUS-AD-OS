// ---------------------------------------------------------------------------
// POST /api/ai/content-calendar
// Generates a full week of social media content from business data
// Returns 7 posts across multiple platforms, ready to copy-paste
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { niche?: string; audience?: string; platforms?: string[] };

    // Try to load business context
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const niche = body.niche ?? profile?.niche ?? "business";
    const audience = body.audience ?? profile?.targetAudience ?? "your audience";
    const platforms = body.platforms ?? ["instagram", "tiktok", "twitter", "linkedin"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "AI not configured" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `Generate a 7-day social media content calendar for a ${niche} business targeting ${audience}.

Platforms to cover: ${platforms.join(", ")}

For EACH day, provide:
1. Platform (rotate between the listed platforms)
2. Content type (post, carousel caption, thread, reel script, story)
3. Topic/theme
4. The actual ready-to-post content (no placeholders, no [insert X])
5. Best time to post
6. Hashtags (if applicable to platform)

Requirements:
- Each post must be UNIQUE — different topic, different angle
- Mix educational, entertaining, and promotional content (70/20/10 rule)
- Every post should build authority in ${niche}
- Include one post that directly promotes the product/service
- All content must be ready to copy-paste — no instructions, just content

Return as JSON array:
[
  {
    "day": "Monday",
    "platform": "instagram",
    "type": "carousel",
    "topic": "...",
    "content": "...",
    "bestTime": "9:00 AM",
    "hashtags": "..."
  }
]`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const raw = textContent?.text ?? "[]";

    // Parse JSON from response
    let calendar;
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      calendar = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      calendar = [{ day: "Error", platform: "unknown", type: "post", topic: "Generation failed", content: raw, bestTime: "", hashtags: "" }];
    }

    return NextResponse.json({ ok: true, calendar, niche, audience });
  } catch (err) {
    console.error("Content calendar error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

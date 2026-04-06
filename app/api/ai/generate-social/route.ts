// ---------------------------------------------------------------------------
// POST /api/ai/generate-social
// Generates ready-to-post social media content from business data
// Supports: Instagram, TikTok, Twitter/X, LinkedIn, Facebook
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

type SocialPlatform = "instagram" | "tiktok" | "twitter" | "linkedin" | "facebook";
type ContentType = "post" | "caption" | "thread" | "story" | "carousel";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      platform: SocialPlatform;
      contentType: ContentType;
      niche?: string;
      audience?: string;
      topic?: string;
      tone?: string;
    };

    const { platform, contentType, niche, audience, topic, tone } = body;

    const platformRules: Record<SocialPlatform, string> = {
      instagram: "Instagram rules: Use line breaks for readability. Include 15-20 relevant hashtags at the end. Emojis are okay but not excessive. Include a CTA in the last line.",
      tiktok: "TikTok rules: Keep caption under 150 characters. Hook in first 5 words. Include 3-5 hashtags. Use native TikTok language (casual, punchy). Include a CTA.",
      twitter: "Twitter/X rules: Each tweet under 280 characters. Thread format: number each tweet. First tweet must hook. Last tweet must CTA. No hashtags in main text (only 1-2 at end if needed).",
      linkedin: "LinkedIn rules: Professional but not stiff. Lead with a contrarian or surprising statement. Use short paragraphs. End with a question to drive comments. 200-300 words.",
      facebook: "Facebook rules: Conversational tone. Can be longer. Start with a hook question or bold statement. Include a clear CTA. No excessive hashtags.",
    };

    const prompt = `Write a ${contentType} for ${platform} about ${topic || niche || "business growth"}.

Target audience: ${audience || "business owners"}
Niche: ${niche || "business"}
Tone: ${tone || "authoritative but approachable"}

${platformRules[platform]}

Requirements:
- Write READY-TO-POST content. No placeholders. No "[insert X]".
- Make it specific and valuable — not generic advice.
- The goal is engagement + authority building.
- Output ONLY the post content. No explanations.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        content: `[Use this prompt in ChatGPT/Claude]\n\n${prompt}`,
        model: "fallback",
      });
    }

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    return NextResponse.json({ ok: true, content: textContent?.text ?? "", model: response.model });
  } catch (err) {
    console.error("Social content error:", err);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}

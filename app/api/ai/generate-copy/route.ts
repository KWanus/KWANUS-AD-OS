// ---------------------------------------------------------------------------
// POST /api/ai/generate-copy
// Takes a pre-built prompt from the PromptKit and generates copy via Claude
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { prompt, context } = body as {
      prompt: string;
      context?: { title?: string; niche?: string; audience?: string };
    };

    if (!prompt) return NextResponse.json({ ok: false, error: "prompt required" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback: return the prompt itself as a template
      return NextResponse.json({
        ok: true,
        content: `[AI generation unavailable — use this prompt in ChatGPT/Claude]\n\n${prompt}`,
        model: "fallback",
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are a world-class direct response copywriter and marketing strategist. You write copy that converts — not copy that sounds good. Every word earns its place. You understand ${context?.niche ?? "business"} deeply and write for ${context?.audience ?? "the target audience"} specifically.

Rules:
- Write ready-to-use copy. No placeholders like [INSERT X]. Fill in everything with specific, believable details.
- Use the business context provided in the prompt — niche, audience, pain points, outcomes.
- Be direct, specific, and proof-based. No fluff, no filler, no generic marketing speak.
- Match the platform and format specified (e.g., TikTok = casual/authentic, LinkedIn = professional, Google = concise).
- If the prompt asks for multiple variations, number them clearly.
- Output only the copy. No explanations, no "here's what I wrote" preamble.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const content = textContent?.text ?? "";

    return NextResponse.json({ ok: true, content, model: response.model });
  } catch (err) {
    console.error("Generate copy error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}

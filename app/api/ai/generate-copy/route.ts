// ---------------------------------------------------------------------------
// POST /api/ai/generate-copy
// Unified AI copy generation — works with ANY provider or none at all
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateAI } from "@/lib/integrations/aiInference";

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

    const result = await generateAI({
      prompt,
      systemPrompt: `You are a world-class direct response copywriter. You write copy that converts. You understand ${context?.niche ?? "business"} deeply and write for ${context?.audience ?? "the target audience"} specifically. Write ready-to-use copy. No placeholders. No preamble. Output only the copy.`,
      maxTokens: 2000,
    });

    return NextResponse.json({
      ok: true,
      content: result.content,
      model: result.model,
      provider: result.provider,
    });
  } catch (err) {
    console.error("Generate copy error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}

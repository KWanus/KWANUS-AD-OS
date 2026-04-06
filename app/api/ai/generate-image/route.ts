// ---------------------------------------------------------------------------
// POST /api/ai/generate-image
// Takes a pre-built image prompt and generates via OpenAI GPT Image / fal.ai
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateImages } from "@/lib/integrations/imageGeneration";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { prompt, size, quality } = body as {
      prompt: string;
      size?: "1024x1024" | "1792x1024" | "1024x1792";
      quality?: "standard" | "hd";
    };

    if (!prompt) return NextResponse.json({ ok: false, error: "prompt required" }, { status: 400 });

    const result = await generateImages([
      { prompt, size: size ?? "1024x1024", quality: quality ?? "standard" },
    ]);

    if (!result.ok || result.images.length === 0) {
      return NextResponse.json({
        ok: false,
        error: result.error ?? "Image generation failed — check OPENAI_API_KEY or FAL_KEY",
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      imageBase64: result.images[0].base64,
      model: result.images[0].model,
    });
  } catch (err) {
    console.error("Generate image error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}

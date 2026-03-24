import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { deductCredits } from "@/lib/auth";

// Supported aspect ratios mapped to OpenAI size params
const RATIO_TO_SIZE: Record<string, "1024x1024" | "1024x1792" | "1792x1024"> = {
  "1:1": "1024x1024",
  "9:16": "1024x1792",
  "16:9": "1792x1024",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "no_key",
      message: "Add OPENAI_API_KEY to your .env file to enable AI image generation.",
    }, { status: 402 });
  }

  try {
    const body = await req.json() as {
      prompt: string;
      aspectRatio?: "1:1" | "9:16" | "16:9";
      model?: "dall-e-3" | "dall-e-2";
      quality?: "standard" | "hd";
    };

    // Credit check
    try {
      await deductCredits(1); // 1 credit per image
    } catch (cErr) {
      return NextResponse.json({ ok: false, error: "insufficient_credits", message: "You need 1 credit to generate an image." }, { status: 402 });
    }

    const size = RATIO_TO_SIZE[body.aspectRatio ?? "1:1"] ?? "1024x1024";
    const client = new OpenAI({ apiKey });

    const response = await client.images.generate({
      model: body.model ?? "dall-e-3",
      prompt: body.prompt,
      n: 1,
      size,
      quality: body.quality ?? "standard",
      response_format: "url",
    });

    const url = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!url) {
      return NextResponse.json({ ok: false, error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url, revisedPrompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("Image generation error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

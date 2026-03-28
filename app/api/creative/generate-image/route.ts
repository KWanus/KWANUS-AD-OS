import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { deductCredits, getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

// Supported aspect ratios mapped to OpenAI size params
const RATIO_TO_SIZE: Record<string, "1024x1024" | "1024x1792" | "1792x1024"> = {
  "1:1": "1024x1024",
  "9:16": "1024x1792",
  "16:9": "1792x1024",
};

function buildCreativePrompt(prompt: string, executionTier: "core" | "elite") {
  if (executionTier === "elite") {
    return `Create a premium direct-response advertising image with category-leading visual polish, stronger product clarity, richer trust cues, sharper composition, better emotional pull, and conversion-first framing.\n\nOriginal brief:\n${prompt}`;
  }
  return `Create a clean, effective performance-marketing image with strong clarity, practical commercial composition, and clear ad-ready execution.\n\nOriginal brief:\n${prompt}`;
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const limited = rateLimit(`ai:${user.id}`, RATE_LIMITS.aiGeneration);
  if (limited) return limited;

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
      executionTier?: "core" | "elite";
    };
    const executionTier = body.executionTier === "core" ? "core" : "elite";

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
      prompt: buildCreativePrompt(body.prompt, executionTier),
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

    return NextResponse.json({ ok: true, url, revisedPrompt, executionTier });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json({ ok: false, error: "Image generation failed" }, { status: 500 });
  }
}

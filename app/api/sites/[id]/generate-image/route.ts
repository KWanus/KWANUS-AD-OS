import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildGenericBlockImagePrompt, buildHeroImagePrompt, buildTestimonialAvatarPrompt, buildProductImagePrompt } from "@/lib/sites/imagePromptBuilder";

const RATIO_TO_SIZE: Record<string, "1024x1024" | "1024x1792" | "1792x1024"> = {
  "1:1": "1024x1024",
  "9:16": "1024x1792",
  "16:9": "1792x1024",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: siteId } = await params;

  const site = await prisma.site.findFirst({
    where: { id: siteId, userId: user.id },
    select: { id: true, name: true, niche: true, theme: true },
  });
  if (!site) {
    return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "no_key", message: "OPENAI_API_KEY required for image generation." },
      { status: 402 }
    );
  }

  const body = await req.json() as {
    prompt?: string;
    blockType?: string;
    context?: string;
    aspectRatio?: "1:1" | "9:16" | "16:9";
  };

  let finalPrompt: string;

  if (body.prompt) {
    finalPrompt = body.prompt;
  } else if (body.blockType) {
    const theme = (site.theme as Record<string, string> | null)?.mode ?? "dark";
    finalPrompt = buildGenericBlockImagePrompt(body.blockType, {
      niche: site.niche ?? undefined,
      businessName: site.name,
      theme,
    });
  } else {
    finalPrompt = buildHeroImagePrompt(
      site.niche ?? "professional services",
      site.name
    );
  }

  const size = RATIO_TO_SIZE[body.aspectRatio ?? "16:9"] ?? "1792x1024";

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size,
      quality: "hd",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ ok: false, error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      url: imageUrl,
      prompt: finalPrompt,
    });
  } catch (err) {
    console.error("Site image generation failed:", err);
    return NextResponse.json(
      { ok: false, error: "Image generation failed" },
      { status: 500 }
    );
  }
}

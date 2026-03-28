import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessContext } from "@/lib/archetypes/getBusinessContext";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";
import { config } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const GLOBAL_RULE = `You are the world's best e-commerce and dropshipping strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% Shopify stores and dropshippers do in this niche.
Analyze 7-figure store patterns, winning product characteristics, and viral ad strategies.
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

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { productId } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!productId) {
      return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });
    }

    const product = await prisma.dropshipProduct.findFirst({
      where: { id: productId, userId: user.id },
    });
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });

    const productContext = product.productJson
      ? `\nProduct analysis context:\n${JSON.stringify(product.productJson)}`
      : "";
    const businessContext = await getBusinessContext(user.id);

    const prompt = `Generate a complete multi-platform ad creative package for this dropshipping product.

Product: ${product.name}
Niche: ${product.niche}
${product.category ? `Category: ${product.category}` : ""}
${product.suggestedPrice ? `Retail Price: $${product.suggestedPrice}` : ""}
${productContext}
${businessContext}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: build this like a serious scaling operator. Push for stronger pattern interrupts, better creative angles, sharper UGC direction, and more platform-native hook variety."
  : "Core mode: generate strong practical ad creative for testing and early scale."}

Create hooks and scripts that would stop the scroll. Study what viral dropshipping ads do: pattern interrupts, bold claims, demonstration hooks, before/after, and social proof.

Return this exact JSON structure:
{
  "facebook": {
    "hooks": ["string"],
    "primaryTexts": ["string"],
    "thumbnailConcepts": [{ "concept": "string", "style": "ugc|lifestyle|product|before_after" }]
  },
  "tiktok": {
    "hooks": ["string"],
    "scripts": [{ "hook": "string", "demo": "string", "proof": "string", "cta": "string" }],
    "sounds": ["string"],
    "trends": ["string"]
  },
  "google": {
    "searchAds": [{ "headline1": "string", "headline2": "string", "description": "string" }],
    "shoppingTitle": "string",
    "shoppingDescription": "string"
  },
  "ugcBrief": {
    "creatorType": "string",
    "scriptOutline": "string",
    "deliverables": ["string"],
    "dontDo": ["string"]
  }
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);

    const updated = await prisma.dropshipProduct.updateMany({
      where: { id: productId, userId: user.id },
      data: { adAnglesJson: result as object },
    });

    return NextResponse.json({ ok: true, ads: result, product: updated, executionTier });
  } catch (err) {
    console.error("Ads generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate ads" }, { status: 500 });
  }
}

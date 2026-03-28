import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";
import { AI_MODELS } from "@/lib/ai/models";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
      ? `\nDetailed product analysis:\n${JSON.stringify(product.productJson)}`
      : "";

    const prompt = `Generate a complete, conversion-optimized Shopify product page for:

Product: ${product.name}
Niche: ${product.niche}
${product.category ? `Category: ${product.category}` : ""}
${product.suggestedPrice ? `Price: $${product.suggestedPrice}` : ""}
${product.shippingTime ? `Shipping time: ${product.shippingTime}` : ""}
Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: write this like a top 1% Shopify conversion page. Push harder on benefit framing, proof, objections, buying confidence, and AOV-minded persuasion."
  : "Core mode: write strong practical PDP copy with clear benefits, FAQ, and conversion-friendly structure."}
${productContext}

Write copy that converts like a top 1% Shopify store. Use power words, social proof triggers, and emotional hooks.

Return this exact JSON structure:
{
  "title": "string",
  "seoTitle": "string",
  "seoDescription": "string",
  "shortDescription": "string",
  "bulletPoints": ["string"],
  "fullDescription": "string",
  "faq": [{ "q": "string", "a": "string" }],
  "specifications": [{ "label": "string", "value": "string" }],
  "shippingText": "string",
  "guaranteeText": "string",
  "socialProofElements": ["string"]
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);

    const updated = await prisma.dropshipProduct.update({
      where: { id: productId },
      data: { storeJson: result as object },
    });

    return NextResponse.json({ ok: true, storeContent: result, product: updated, executionTier });
  } catch (err) {
    console.error("Store content error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate store content" }, { status: 500 });
  }
}

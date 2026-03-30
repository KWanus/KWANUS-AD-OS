import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GLOBAL_RULE = `You are the world's best e-commerce and dropshipping strategist inside Himalaya Agency OS.
Return valid JSON only. No markdown. No commentary outside JSON.
Before generating any output, research what the TOP 1% Shopify stores and dropshippers do in this niche.
Analyze 7-figure store patterns, winning product characteristics, and viral ad strategies.
Then produce outputs that BEAT those benchmarks.`;

async function callClaude(system: string, prompt: string) {
  const r = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
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

    const prompt = `Generate a complete email flow suite for this dropshipping product.

Product: ${product.name}
Niche: ${product.niche}
${product.suggestedPrice ? `Price: $${product.suggestedPrice}` : ""}
Execution Tier: ${executionTier}
${executionTier === "elite"
  ? "Elite mode: write this like a high-performing e-commerce retention operator. Push harder on revenue recovery, post-purchase delight, objection handling, and repeat-purchase psychology."
  : "Core mode: produce strong practical e-commerce flows with clear conversion and retention logic."}
${productContext}

Write email copy that recovers abandoned carts and maximizes LTV post-purchase. Use proven e-commerce email tactics: urgency, scarcity, social proof, objection handling, and delight sequences.

Return this exact JSON structure:
{
  "abandonedCart": [
    { "delay": "1 hour", "subject": "string", "preview": "string", "body": "string" },
    { "delay": "24 hours", "subject": "string", "preview": "string", "body": "string" },
    { "delay": "72 hours", "subject": "string", "preview": "string", "body": "string" }
  ],
  "postPurchase": [
    { "delay": "immediately", "subject": "string", "preview": "string", "body": "string" },
    { "delay": "3 days", "subject": "string", "preview": "string", "body": "string" },
    { "delay": "7 days", "subject": "string", "preview": "string", "body": "string" }
  ],
  "winback": [
    { "delay": "30 days", "subject": "string", "preview": "string", "body": "string" }
  ]
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);

    const updated = await prisma.dropshipProduct.update({
      where: { id: productId },
      data: { emailsJson: result as object },
    });

    return NextResponse.json({ ok: true, emails: result, product: updated, executionTier });
  } catch (err) {
    console.error("Emails generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate emails" }, { status: 500 });
  }
}

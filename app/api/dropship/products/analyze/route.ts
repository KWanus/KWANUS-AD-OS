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
    model: "claude-sonnet-4-6",
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
    const { productId, name, niche, supplierUrl, supplierPrice, shippingCost } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    let product = null;
    let productName = name;
    let productNiche = niche;
    let productSupplierUrl = supplierUrl;
    let productSupplierPrice = supplierPrice;
    let productShippingCost = shippingCost;

    if (productId) {
      product = await prisma.dropshipProduct.findFirst({
        where: { id: productId, userId: user.id },
      });
      if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
      productName = product.name;
      productNiche = product.niche;
      productSupplierUrl = product.supplierUrl;
      productSupplierPrice = product.supplierPrice;
      productShippingCost = product.shippingCost;
    }

    if (!productName || !productNiche) {
      return NextResponse.json({ ok: false, error: "name and niche are required" }, { status: 400 });
    }

    const prompt = `Perform a deep single-product analysis for dropshipping.

Product: ${productName}
Niche: ${productNiche}
${productSupplierUrl ? `Supplier URL: ${productSupplierUrl}` : ""}
${productSupplierPrice != null ? `Supplier Price: $${productSupplierPrice}` : ""}
${productShippingCost != null ? `Shipping Cost: $${productShippingCost}` : "Shipping Cost: estimate based on typical dropship rates"}
Execution Tier: ${executionTier}

${executionTier === "elite"
  ? "Elite mode: analyze this like a top e-commerce operator deciding whether to allocate serious test spend. Be sharper on economics, saturation risk, creative durability, angle quality, and long-term viability."
  : "Core mode: provide a strong practical product analysis with clear scoring, economics, and testing guidance."}

Calculate exact profit metrics, break-even ROAS, and a definitive winner score (0-100).
Break-even ROAS = retail_price / profit_per_unit (e.g. if retail is $40 and profit is $20, ROAS = 2.0).

Return this exact JSON structure:
{
  "verdict": "winner|potential|pass",
  "verdictReason": "string",
  "scores": {
    "demand": 0,
    "competition": 0,
    "trend": 0,
    "margin": 0,
    "overall": 0
  },
  "pricing": {
    "supplierPrice": 0,
    "shippingCost": 0,
    "totalCogs": 0,
    "suggestedRetail": 0,
    "profitMargin": 0,
    "profitPerUnit": 0,
    "breakEvenRoas": 0
  },
  "targetAudience": {
    "age": "string",
    "gender": "string",
    "interests": ["string"],
    "pain": "string",
    "desire": "string"
  },
  "topAngles": ["string"],
  "seasonality": "year_round|seasonal",
  "riskFactors": ["string"],
  "upsellOpportunities": ["string"]
}`;

    const result = await callClaude(GLOBAL_RULE, prompt);

    // Build update payload from Claude result
    const pricing = result.pricing ?? {};
    const scores = result.scores ?? {};

    const updateData: Record<string, unknown> = {
      productJson: result as object,
      demandScore: scores.demand ?? null,
      competitionScore: scores.competition ?? null,
      trendScore: scores.trend ?? null,
      marginScore: scores.margin ?? null,
      winnerScore: scores.overall ?? null,
      suggestedPrice: pricing.suggestedRetail ?? null,
      profitMargin: pricing.profitMargin ?? null,
      profitPerUnit: pricing.profitPerUnit ?? null,
      breakEvenRoas: pricing.breakEvenRoas ?? null,
    };

    if (pricing.supplierPrice != null) updateData.supplierPrice = pricing.supplierPrice;
    if (pricing.shippingCost != null) updateData.shippingCost = pricing.shippingCost;

    if (productId && product) {
      const updated = await prisma.dropshipProduct.update({
        where: { id: productId },
        data: updateData,
      });
      return NextResponse.json({ ok: true, analysis: result, product: updated, executionTier });
    }

    // Ad-hoc analysis (no productId) — just return result
    return NextResponse.json({ ok: true, analysis: result, executionTier });
  } catch (err) {
    console.error("Dropship analyze error:", err);
    return NextResponse.json({ ok: false, error: "Failed to analyze product" }, { status: 500 });
  }
}

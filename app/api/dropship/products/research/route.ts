import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { callClaude, DROPSHIP_SYSTEM_PROMPT } from "@/lib/ai/claude";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json() as {
      niche?: string;
      budget?: string;
      targetMarket?: string;
      executionTier?: ExecutionTier;
    };
    const { niche, budget, targetMarket } = body;
    const executionTier: ExecutionTier = body.executionTier === "core" ? "core" : "elite";

    if (!niche) {
      return NextResponse.json({ ok: false, error: "niche is required" }, { status: 400 });
    }

    const prompt = `Perform deep product opportunity research for the dropshipping niche: "${niche}".
${budget ? `Budget constraint: ${budget}` : ""}
${targetMarket ? `Target market: ${targetMarket}` : ""}
Execution tier: ${executionTier}
${executionTier === "elite"
  ? "Think like a top 1% e-commerce operator allocating real budget. Prioritize product economics, angle durability, creative potential, supplier reliability, and where crowded markets still leave room for differentiated execution."
  : "Keep the research strong, practical, and immediately useful for testing product opportunities."}

Identify the top winning product opportunities that meet 7-figure store criteria.
Score each product on demand (0-100), competition (0-100), trend (0-100), and overall winner score (0-100).
Higher demand = better. Lower competition = better. Higher trend = better.

Return this exact JSON structure:
{
  "marketAnalysis": "string",
  "winningCriteria": ["string"],
  "productOpportunities": [
    {
      "name": "string",
      "category": "string",
      "problemSolved": "string",
      "targetAudience": "string",
      "estimatedSupplierPrice": "$X-$XX",
      "estimatedRetailPrice": "$XX-$XXX",
      "estimatedMargin": "XX%",
      "demandScore": 0,
      "competitionScore": 0,
      "trendScore": 0,
      "winnerScore": 0,
      "bestSupplierPlatform": "aliexpress|cjdropshipping|zendrop|spocket",
      "topAngle": "string",
      "warningFlags": ["string"]
    }
  ],
  "avoidList": ["string"],
  "seasonality": "string",
  "trendingNow": ["string"]
}`;

    const result = await callClaude(DROPSHIP_SYSTEM_PROMPT, prompt);

    return NextResponse.json({ ok: true, research: result, executionTier });
  } catch (err) {
    console.error("Dropship research error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate research" }, { status: 500 });
  }
}

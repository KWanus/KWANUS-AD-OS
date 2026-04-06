// ---------------------------------------------------------------------------
// POST /api/ai/generate-proposal
// Generates a complete client proposal from analysis data
// For consultant mode — creates the deliverable they send to close deals
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      runId?: string;
      clientName?: string;
      packageTier?: string;
    };

    // Load analysis data if runId provided
    let analysisContext = "";
    if (body.runId) {
      const run = await prisma.analysisRun.findFirst({
        where: { id: body.runId, userId: user.id },
      });
      if (run) {
        const packet = run.decisionPacket as Record<string, unknown> | null;
        analysisContext = `
Analysis results:
- Title: ${run.title}
- Score: ${run.score}/100
- Verdict: ${run.verdict}
- Summary: ${run.summary}
- Audience: ${packet?.audience ?? "not specified"}
- Pain points: ${packet?.painDesire ?? "not specified"}
- Strengths: ${(packet?.strengths as string[])?.join(", ") ?? "none identified"}
- Weaknesses: ${(packet?.weaknesses as string[])?.join(", ") ?? "none identified"}
- Recommended actions: ${(packet?.nextActions as string[])?.join("; ") ?? "not specified"}`;
      }
    }

    // Load business profile for consultant info
    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "AI not configured" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const prompt = `Generate a professional client proposal. You are writing this FOR the consultant to send TO their client.

Consultant info:
- Business: ${profile?.businessName ?? "Consultant"}
- Niche: ${profile?.niche ?? "marketing"}

Client: ${body.clientName ?? "the client"}
Package tier: ${body.packageTier ?? "standard"}

${analysisContext}

Generate a complete proposal with these sections:
1. EXECUTIVE SUMMARY (2-3 sentences — what you found, why it matters)
2. PROBLEM STATEMENT (specific gaps identified, quantified where possible)
3. PROPOSED SOLUTION (exactly what you'll do, deliverables list)
4. TIMELINE (week-by-week for 90 days)
5. INVESTMENT (3 tiers: Starter, Growth, Premium — with specific prices and deliverables for each)
6. GUARANTEE (risk reversal — what happens if results don't materialize)
7. NEXT STEPS (specific action the client takes to move forward)

Requirements:
- Write it as ready-to-send content (no [FILL IN X] placeholders)
- Use the analysis data to make it specific to this client
- Pricing should feel grounded (not arbitrary)
- The guarantee should feel genuine
- Format in clean markdown

Output ONLY the proposal. No meta-commentary.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    return NextResponse.json({ ok: true, proposal: textContent?.text ?? "" });
  } catch (err) {
    console.error("Proposal generation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

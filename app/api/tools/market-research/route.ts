// ---------------------------------------------------------------------------
// POST /api/tools/market-research
// Analyzes a market from competitor URLs
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeMarket } from "@/lib/intelligence/marketResearch";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      competitors: { url: string; title: string; pricing?: string; trustSignals: string[]; weaknesses: string[] }[];
    };

    if (!body.competitors?.length) {
      return NextResponse.json({ ok: false, error: "competitors array required" }, { status: 400 });
    }

    const insight = analyzeMarket(body.competitors);
    return NextResponse.json({ ok: true, insight });
  } catch (err) {
    console.error("Market research error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

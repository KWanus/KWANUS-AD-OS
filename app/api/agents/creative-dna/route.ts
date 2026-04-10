import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeDNA, findWinningPatterns } from "@/lib/agents/creativeDNA";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      action: "analyze" | "find_patterns";
      adText?: string;
      performance?: number;
      creatives?: { text: string; performance: number }[];
    };

    if (body.action === "analyze" && body.adText) {
      const analysis = analyzeDNA(body.adText, body.performance);
      return NextResponse.json({ ok: true, analysis });
    }

    if (body.action === "find_patterns" && body.creatives) {
      const patterns = findWinningPatterns(body.creatives);
      return NextResponse.json({ ok: true, patterns });
    }

    return NextResponse.json({ ok: false, error: "action + data required" }, { status: 400 });
  } catch (err) {
    console.error("Creative DNA error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

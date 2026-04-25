import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { scanWebsiteWithPlaywright, analyzeCompetitors } from "@/lib/sites/playwrightScanner";

export const maxDuration = 300; // 5 minutes for Playwright operations

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      url?: string;
      competitors?: string[];
      mode: "single" | "competitors";
    };

    if (body.mode === "single") {
      if (!body.url) {
        return NextResponse.json({ ok: false, error: "URL is required" }, { status: 400 });
      }

      const result = await scanWebsiteWithPlaywright(body.url);

      return NextResponse.json({
        ok: true,
        scan: result,
      });
    }

    if (body.mode === "competitors") {
      if (!body.competitors || body.competitors.length === 0) {
        return NextResponse.json({ ok: false, error: "Competitor URLs required" }, { status: 400 });
      }

      const analysis = await analyzeCompetitors(body.competitors);

      return NextResponse.json({
        ok: true,
        analysis,
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid mode" }, { status: 400 });

  } catch (error) {
    console.error("Advanced scan route failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Scan failed" },
      { status: 500 }
    );
  }
}

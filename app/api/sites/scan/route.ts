import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createSiteFromScan, type SiteScanMode } from "@/lib/sites/scanMode";

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
      siteName?: string;
      niche?: string;
      notes?: string;
      mode?: SiteScanMode;
      executionTier?: "core" | "elite";
      triggerN8n?: boolean;
    };

    if (!body.url?.trim()) {
      return NextResponse.json({ ok: false, error: "Reference URL is required" }, { status: 400 });
    }

    const mode: SiteScanMode = body.mode === "clone" ? "clone" : "improve";
    const result = await createSiteFromScan({
      userId: user.id,
      url: body.url,
      siteName: body.siteName,
      niche: body.niche,
      notes: body.notes,
      mode,
      executionTier: body.executionTier === "core" ? "core" : "elite",
      triggerN8n: body.triggerN8n,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Site scan route failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to scan and build site" },
      { status: 500 }
    );
  }
}

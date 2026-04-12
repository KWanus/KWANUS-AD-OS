// ---------------------------------------------------------------------------
// POST /api/video/generate
// Generate an AI video spokesperson for a business
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateVideoSpokesperson, type VideoConfig } from "@/lib/agents/himalayaVideo";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as Partial<VideoConfig>;

    const config: VideoConfig = {
      businessName: body.businessName ?? "My Business",
      niche: body.niche ?? "business services",
      targetAudience: body.targetAudience ?? "potential customers",
      style: body.style ?? "professional",
      duration: body.duration ?? "30s",
      purpose: body.purpose ?? "sales",
    };

    const result = await generateVideoSpokesperson(config, user.id);

    return NextResponse.json({
      ok: result.ok,
      method: result.method,
      script: result.script,
      scenes: result.scenes,
      presenterImageUrl: result.presenterImageUrl,
      embedCode: result.embedCode,
      error: result.error,
    });
  } catch (err) {
    console.error("Video generate error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

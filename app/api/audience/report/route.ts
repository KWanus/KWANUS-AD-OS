// ---------------------------------------------------------------------------
// GET /api/audience/report — audience intelligence report
// Returns segments, sources, growth rate, engagement levels
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { buildAudienceReport } from "@/lib/intelligence/audienceIntelligence";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await buildAudienceReport(user.id);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Audience report error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

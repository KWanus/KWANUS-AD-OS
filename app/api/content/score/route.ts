// ---------------------------------------------------------------------------
// POST /api/content/score — score any piece of copy
// Returns overall grade + dimension breakdown
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scoreContent } from "@/lib/intelligence/contentScoring";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { text: string; type?: "ad" | "email" | "landing" | "social" };
    if (!body.text) return NextResponse.json({ ok: false, error: "text required" }, { status: 400 });

    const result = scoreContent(body.text, body.type ?? "ad");
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Content score error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

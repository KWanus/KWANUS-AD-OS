// ---------------------------------------------------------------------------
// POST /api/leads/enrich — enrich a lead from their email
// Returns company guess, industry, business email flag, quality score
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { enrichFromEmail, priorityScore } from "@/lib/leads/leadEnrichment";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { email: string; hasPhone?: boolean; hasMessage?: boolean };
    if (!body.email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });

    const enrichment = enrichFromEmail(body.email);
    const priority = priorityScore(enrichment, body.hasPhone ?? false, body.hasMessage ?? false);

    return NextResponse.json({
      ok: true,
      enrichment,
      priorityScore: priority,
    });
  } catch (err) {
    console.error("Enrich error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

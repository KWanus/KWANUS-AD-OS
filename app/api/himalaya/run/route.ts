import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runHimalaya } from "@/lib/himalaya";
import type { HimalayaInput } from "@/lib/himalaya";

/**
 * Himalaya Full Pipeline — single endpoint.
 *
 * Runs Diagnose → Strategize → Generate → Save in one request.
 * Returns the full ResultsPayload.
 *
 * Body: HimalayaInput (either ScratchInput or ImproveInput)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as HimalayaInput;

    if (body.mode !== "scratch" && body.mode !== "improve") {
      return NextResponse.json({ ok: false, error: "Invalid mode." }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const { userId: clerkId } = await auth();
      if (clerkId) {
        const user = await getOrCreateUser();
        userId = user?.id ?? null;
      }
    } catch { /* auth optional */ }

    const results = await runHimalaya(body, userId);

    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("Himalaya run error:", err);
    const message = err instanceof Error ? err.message : "Pipeline failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

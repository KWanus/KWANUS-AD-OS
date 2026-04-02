import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runHimalaya } from "@/lib/himalaya/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { profileId: string; path: string };

    if (!body.profileId || !body.path) {
      return NextResponse.json({ ok: false, error: "profileId and path are required" }, { status: 400 });
    }

    const result = await runHimalaya(
      {
        mode: "scratch",
        profileId: body.profileId,
        path: body.path,
      },
      user.id,
    );

    if (!result.success || !result.runId) {
      return NextResponse.json({
        ok: false,
        error: "Pipeline failed",
        trace: result.trace,
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      analysisId: result.runId,
      strategy: result.strategy,
      trace: result.trace,
    });
  } catch (err) {
    console.error("Launch error:", err);
    return NextResponse.json({ ok: false, error: "Launch failed" }, { status: 500 });
  }
}

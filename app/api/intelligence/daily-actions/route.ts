// ---------------------------------------------------------------------------
// GET /api/intelligence/daily-actions
// Returns the user's top 3-5 actions for today
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateDailyActions } from "@/lib/intelligence/dailyActionQueue";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actions = await generateDailyActions(user.id);
    return NextResponse.json({ ok: true, actions, count: actions.length });
  } catch (err) {
    console.error("Daily actions error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

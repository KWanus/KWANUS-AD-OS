import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runAdAgent } from "@/lib/agents/adBuyingAgent";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await runAdAgent({
      userId: user.id,
      targetROAS: 2.0,
      maxDailyBudget: 100,
      minDailyBudget: 10,
      autoScale: true,
      autoKill: true,
      autoBudgetShift: true,
    });

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Ad agent error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

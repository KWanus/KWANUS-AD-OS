import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getUserAccess, upgradeTier } from "@/lib/himalaya/access";
import type { HimalayaTier } from "@/lib/himalaya/access";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const access = await getUserAccess(user.id);
    return NextResponse.json({ ok: true, access });
  } catch (err) {
    console.error("Access check error:", err);
    return NextResponse.json({ ok: true, access: { tier: "free", limits: {}, canRun: true, canDeploy: true, runsRemaining: 2, deploysRemaining: 1, usage: { runsUsed: 0, deploysUsed: 0, executionsUsed: 0, outcomesLogged: 0 } } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { tier?: string };
    const validTiers: HimalayaTier[] = ["free", "pro", "business"];
    const tier = (body.tier ?? "free") as HimalayaTier;

    if (!validTiers.includes(tier)) {
      return NextResponse.json({ ok: false, error: "Invalid tier" }, { status: 400 });
    }

    // In production, verify Stripe payment before upgrading
    // For now, allow direct upgrade for development/demo
    await upgradeTier(user.id, tier);
    const access = await getUserAccess(user.id);

    return NextResponse.json({ ok: true, access });
  } catch (err) {
    console.error("Upgrade error:", err);
    return NextResponse.json({ ok: false, error: "Upgrade failed" }, { status: 500 });
  }
}

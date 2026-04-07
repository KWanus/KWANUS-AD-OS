import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getPlaybookForStage } from "@/lib/wealth/scalingPlaybooks";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const siteIds = (await prisma.site.findMany({ where: { userId: user.id }, select: { id: true } })).map(s => s.id);
    const revenue = siteIds.length > 0
      ? (await prisma.siteOrder.aggregate({ where: { siteId: { in: siteIds }, status: "paid" }, _sum: { amountCents: true } }))._sum.amountCents ?? 0
      : 0;

    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    const playbook = getPlaybookForStage(revenue / 100, profile?.niche ?? "business");

    return NextResponse.json({ ok: true, playbook, currentRevenue: revenue / 100 });
  } catch (err) {
    console.error("Playbook error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

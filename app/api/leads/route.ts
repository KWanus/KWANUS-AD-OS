import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const niche = searchParams.get("niche") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const cursor = searchParams.get("cursor") ?? undefined;

    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(niche ? { niche } : {}),
    };

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = leads.length > limit;
    if (hasMore) leads.pop();
    const nextCursor = hasMore ? leads[leads.length - 1]?.id : undefined;

    return NextResponse.json({ ok: true, leads, nextCursor, hasMore });
  } catch (err) {
    console.error("Leads fetch error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, leads: [], databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch leads" }, { status: 500 });
  }
}

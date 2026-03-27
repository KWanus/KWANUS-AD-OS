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

    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        ...(status ? { status } : {}),
        ...(niche ? { niche } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, leads });
  } catch (err) {
    console.error("Leads fetch error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, leads: [], databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch leads" }, { status: 500 });
  }
}

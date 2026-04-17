import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId: user.id, event: "notification" },
      select: { id: true, metadata: true },
    });

    for (const e of events) {
      const m = e.metadata as Record<string, unknown>;
      if (!m.read) {
        await prisma.himalayaFunnelEvent.update({
          where: { id: e.id },
          data: { metadata: { ...m, read: true } },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

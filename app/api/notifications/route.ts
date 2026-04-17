import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId: user.id, event: "notification" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const notifications = events.map(e => {
      const m = e.metadata as Record<string, unknown>;
      return {
        id: e.id,
        type: (m.type as string) ?? "system",
        title: (m.title as string) ?? "",
        body: (m.body as string) ?? "",
        href: (m.href as string) ?? "/",
        read: (m.read as boolean) ?? false,
        createdAt: e.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ ok: true, notifications });
  } catch {
    return NextResponse.json({ ok: true, notifications: [] });
  }
}

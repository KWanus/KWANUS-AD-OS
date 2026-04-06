// ---------------------------------------------------------------------------
// POST /api/tools/links — create a trackable short link
// GET /api/tools/links — list user's links
// Stores in HimalayaFunnelEvent for simplicity (no extra table)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { url: string; alias?: string };
    if (!body.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });

    const code = body.alias?.trim() || Math.random().toString(36).slice(2, 8);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: user.id,
        event: "link_created",
        metadata: {
          originalUrl: body.url,
          code,
          clicks: 0,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      link: {
        id: event.id,
        original: body.url,
        short: `${appUrl}/go/${code}`,
        clicks: 0,
        createdAt: event.createdAt,
      },
    });
  } catch (err) {
    console.error("Link creation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId: user.id, event: "link_created" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
    const links = events.map((e) => {
      const meta = e.metadata as Record<string, unknown>;
      return {
        id: e.id,
        original: meta.originalUrl as string,
        short: `${appUrl}/go/${meta.code as string}`,
        clicks: (meta.clicks as number) ?? 0,
        createdAt: e.createdAt,
      };
    });

    return NextResponse.json({ ok: true, links });
  } catch (err) {
    console.error("Links error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

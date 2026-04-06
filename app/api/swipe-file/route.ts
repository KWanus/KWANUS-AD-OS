// ---------------------------------------------------------------------------
// GET/POST /api/swipe-file
// Swipe file — save and retrieve best-performing copy for reuse
// Stored in HimalayaFunnelEvent with event="swipe_saved"
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.himalayaFunnelEvent.findMany({
      where: { userId: user.id, event: "swipe_saved" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const swipes = items.map((item) => {
      const meta = item.metadata as Record<string, unknown>;
      return {
        id: item.id,
        type: meta.type ?? "hook",
        title: meta.title ?? "",
        content: meta.content ?? "",
        platform: meta.platform ?? "",
        source: meta.source ?? "",
        tags: (meta.tags as string[]) ?? [],
        savedAt: item.createdAt,
      };
    });

    return NextResponse.json({ ok: true, swipes });
  } catch (err) {
    console.error("Swipe file error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      type: string;
      title: string;
      content: string;
      platform?: string;
      source?: string;
      tags?: string[];
    };

    if (!body.content) return NextResponse.json({ ok: false, error: "content required" }, { status: 400 });

    const item = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: user.id,
        event: "swipe_saved",
        metadata: {
          type: body.type ?? "hook",
          title: body.title ?? "",
          content: body.content,
          platform: body.platform ?? "",
          source: body.source ?? "",
          tags: body.tags ?? [],
        },
      },
    });

    return NextResponse.json({ ok: true, id: item.id });
  } catch (err) {
    console.error("Swipe save error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

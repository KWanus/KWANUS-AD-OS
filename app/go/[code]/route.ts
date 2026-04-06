// ---------------------------------------------------------------------------
// GET /go/[code] — redirect short link and track click
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    // Find the link event
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { event: "link_created" },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const linkEvent = events.find((e) => {
      const meta = e.metadata as Record<string, unknown>;
      return meta.code === code;
    });

    if (!linkEvent) {
      return NextResponse.redirect(new URL("/", _req.url));
    }

    const meta = linkEvent.metadata as Record<string, unknown>;
    const originalUrl = meta.originalUrl as string;

    // Track click (fire-and-forget)
    prisma.himalayaFunnelEvent.update({
      where: { id: linkEvent.id },
      data: {
        metadata: { ...meta, clicks: ((meta.clicks as number) ?? 0) + 1 },
      },
    }).catch(() => {});

    // Also log the click as separate event
    prisma.himalayaFunnelEvent.create({
      data: {
        userId: linkEvent.userId,
        event: "link_clicked",
        metadata: { code, originalUrl },
      },
    }).catch(() => {});

    return NextResponse.redirect(originalUrl);
  } catch {
    return NextResponse.redirect(new URL("/", _req.url));
  }
}

// ---------------------------------------------------------------------------
// POST /api/track — Himalaya internal analytics (zero setup required)
// Receives pageviews, clicks, form submits, engagement data from published sites
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type: "pageview" | "click" | "form_submit" | "engagement" | "conversion";
      siteId: string;
      url?: string;
      referrer?: string;
      element?: string;
      href?: string;
      duration?: number;
      scrollDepth?: number;
      ts?: number;
    };

    if (!body.siteId || !body.type) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Increment page views for pageview events
    if (body.type === "pageview") {
      await prisma.site.update({
        where: { id: body.siteId },
        data: { totalViews: { increment: 1 } },
      }).catch(() => {});
    }

    // Store the event for analytics
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: body.siteId, // we'll look up the real userId from site
        event: `track_${body.type}`,
        metadata: JSON.parse(JSON.stringify({
          siteId: body.siteId,
          url: body.url,
          referrer: body.referrer,
          element: body.element,
          href: body.href,
          duration: body.duration,
          scrollDepth: body.scrollDepth,
          timestamp: body.ts,
        })),
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail tracking — fire and forget
  }
}

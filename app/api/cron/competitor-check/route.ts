// ---------------------------------------------------------------------------
// GET /api/cron/competitor-check
// Weekly competitor scan — checks saved competitor URLs for changes
// Called by Vercel cron. Sends notification if changes found.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export async function GET() {
  try {
    // Find all analysis runs that have competitor data
    const runs = await prisma.analysisRun.findMany({
      where: {
        rawSignals: { not: undefined },
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      },
      select: {
        id: true,
        userId: true,
        title: true,
        inputUrl: true,
        rawSignals: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    let checked = 0;
    let alertsSent = 0;

    for (const run of runs) {
      if (!run.userId) continue;
      const signals = run.rawSignals as Record<string, unknown> | null;
      const nicheIntel = signals?.nicheIntelligence as Record<string, unknown> | undefined;
      const competitors = nicheIntel?.competitors as { url: string; name?: string }[] | undefined;

      if (!competitors?.length) continue;

      // For each competitor, do a quick check
      for (const comp of competitors.slice(0, 3)) {
        try {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 10000);

          const res = await fetch(comp.url, {
            signal: controller.signal,
            headers: { "User-Agent": "Himalaya-Monitor/1.0" },
          });

          if (res.ok) {
            const html = await res.text();
            // Quick check: extract title
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = titleMatch?.[1]?.trim() ?? "";

            // Check if title changed (simple change detection)
            const prevTitle = (comp as Record<string, unknown>).lastTitle as string | undefined;
            if (prevTitle && title && prevTitle !== title) {
              await createNotification({
                userId: run.userId,
                type: "system",
                title: `Competitor update: ${comp.name ?? comp.url}`,
                body: `Title changed: "${prevTitle}" → "${title}"`,
                href: `/himalaya/run/${run.id}`,
              });
              alertsSent++;
            }

            checked++;
          }
        } catch {
          // Individual competitor check failure is non-blocking
        }
      }
    }

    return NextResponse.json({ ok: true, checked, alertsSent });
  } catch (err) {
    console.error("Competitor check error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

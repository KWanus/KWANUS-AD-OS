import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics/eventTracker";
import type { AnalyticsEvent } from "@/lib/analytics/eventTracker";
import { processEventTrigger } from "@/lib/email/behaviorTriggers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      siteId: string;
      visitorId: string;
      event: string;
      page?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.siteId || !body.visitorId || !body.event) {
      return NextResponse.json({ ok: true }); // Silent — don't error on bad tracking
    }

    const validEvents = ["page_view", "form_start", "form_submit", "cta_click", "checkout_start", "checkout_complete", "scroll_25", "scroll_50", "scroll_75", "scroll_100", "time_on_page", "outbound_click", "video_play", "return_visit"];
    if (!validEvents.includes(body.event)) {
      return NextResponse.json({ ok: true });
    }

    await trackEvent({
      siteId: body.siteId,
      visitorId: body.visitorId,
      event: body.event as AnalyticsEvent["event"],
      page: body.page,
      metadata: {
        ...body.metadata,
        userAgent: req.headers.get("user-agent") ?? undefined,
        referer: req.headers.get("referer") ?? undefined,
      },
    });

    // Fire behavior-based email triggers (non-blocking)
    processEventTrigger({
      siteId: body.siteId,
      visitorId: body.visitorId,
      eventType: body.event,
      metadata: body.metadata,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Always succeed — tracking is fire-and-forget
  }
}

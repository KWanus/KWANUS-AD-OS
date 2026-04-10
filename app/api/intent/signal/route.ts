// Public endpoint — receives intent signals from visitor tracking script
import { NextRequest, NextResponse } from "next/server";
import { processVisitorEvent } from "@/lib/agents/predictiveIntent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      siteId: string;
      visitorId: string;
      eventType: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.siteId || !body.visitorId || !body.eventType) {
      return NextResponse.json({ ok: true }); // Silent — don't error on bad tracking data
    }

    const intent = await processVisitorEvent({
      siteId: body.siteId,
      visitorId: body.visitorId,
      eventType: body.eventType as any,
      metadata: body.metadata,
    });

    // Return action recommendation (the client-side script can use this)
    return NextResponse.json({
      ok: true,
      intent: intent.intentScore,
      stage: intent.stage,
      action: intent.recommendedAction,
    });
  } catch {
    return NextResponse.json({ ok: true }); // Always succeed — tracking is fire-and-forget
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat/message — receive chat messages from the widget
// Public — no auth (visitors send messages)
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { saveChatMessage } from "@/lib/integrations/chatWidget";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      siteId: string;
      visitorId: string;
      message: string;
      visitorEmail?: string;
      visitorName?: string;
    };

    if (!body.siteId || !body.message) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const result = await saveChatMessage({
      siteId: body.siteId,
      visitorId: body.visitorId ?? "anonymous",
      visitorEmail: body.visitorEmail,
      visitorName: body.visitorName,
      message: body.message,
    });

    return NextResponse.json({ ok: result.ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

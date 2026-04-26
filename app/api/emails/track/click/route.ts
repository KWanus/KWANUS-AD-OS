// ---------------------------------------------------------------------------
// Email Click Tracking API — track when links are clicked
// GET /api/emails/track/click?messageId=xxx&url=xxx
// Redirects to the target URL after tracking
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { trackEmailClick } from "@/lib/email/emailDeployment";

export async function GET(req: NextRequest) {
  try {
    const messageId = req.nextUrl.searchParams.get("messageId");
    const targetUrl = req.nextUrl.searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
    }

    if (messageId) {
      // Track the click event asynchronously
      void trackEmailClick(messageId, targetUrl);
    }

    // Redirect to the target URL
    return NextResponse.redirect(targetUrl, 302);
  } catch (err) {
    console.error("[API] Email click tracking error:", err);
    // Still redirect even on error
    const targetUrl = req.nextUrl.searchParams.get("url");
    if (targetUrl) {
      return NextResponse.redirect(targetUrl, 302);
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

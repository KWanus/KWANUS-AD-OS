// ---------------------------------------------------------------------------
// Email Open Tracking API — track when emails are opened
// GET /api/emails/track/open?messageId=xxx
// Returns a 1x1 transparent pixel
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { trackEmailOpen } from "@/lib/email/emailDeployment";

export async function GET(req: NextRequest) {
  try {
    const messageId = req.nextUrl.searchParams.get("messageId");

    if (messageId) {
      // Track the open event asynchronously
      void trackEmailOpen(messageId);
    }

    // Return a 1x1 transparent GIF pixel
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Content-Length": pixel.length.toString(),
      },
    });
  } catch (err) {
    console.error("[API] Email open tracking error:", err);
    // Still return pixel even on error
    const pixel = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(pixel, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  }
}

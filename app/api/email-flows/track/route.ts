import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/email-flows/track?type=open&eid=enrollmentId
 * GET /api/email-flows/track?type=click&eid=enrollmentId&url=redirectUrl
 *
 * Tracking pixel (open) and link wrapper (click) for email analytics.
 * Returns 1x1 transparent pixel for opens, redirects for clicks.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "open" or "click"
  const eid = searchParams.get("eid"); // enrollment ID
  const url = searchParams.get("url"); // redirect URL for clicks
  const fid = searchParams.get("fid"); // flow ID

  // Track the event (non-blocking)
  if (eid || fid) {
    try {
      if (type === "open" && fid) {
        await prisma.emailFlow.update({
          where: { id: fid },
          data: { opens: { increment: 1 } },
        });
        if (eid) {
          await prisma.emailFlowEnrollment.update({
            where: { id: eid },
            data: { emailsSent: { increment: 0 } }, // just touch the record for last activity
          }).catch(() => {});
        }
      }

      if (type === "click" && fid) {
        await prisma.emailFlow.update({
          where: { id: fid },
          data: { clicks: { increment: 1 } },
        });
      }
    } catch {
      // tracking never fails the redirect
    }
  }

  if (type === "click" && url) {
    // Redirect to actual URL
    return NextResponse.redirect(url);
  }

  // Return 1x1 transparent pixel for opens
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/compliance/unsubscribe?email=xxx&userId=xxx
// Public unsubscribe endpoint — one-click unsubscribe from emails
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { processUnsubscribe } from "@/lib/compliance/gdprManager";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!email) {
    return new NextResponse(
      "<html><body style='font-family:sans-serif;text-align:center;padding:60px'><h2>Invalid unsubscribe link</h2></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  }

  await processUnsubscribe({ email, userId: userId ?? undefined });

  return new NextResponse(
    `<html><body style='font-family:sans-serif;text-align:center;padding:60px;background:#f9fafb'>
      <div style='max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08)'>
        <h2 style='margin:0 0 12px'>Unsubscribed</h2>
        <p style='color:#666;font-size:14px'>You've been removed from our mailing list.</p>
        <p style='color:#999;font-size:12px;margin-top:16px'>${email}</p>
      </div>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

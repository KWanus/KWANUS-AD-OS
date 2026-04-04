// ---------------------------------------------------------------------------
// Email Flow Processor — cron endpoint to process pending email enrollments
// Call this on a schedule (e.g., every 5 minutes) to send queued emails
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { processAllPendingEnrollments } from "@/lib/integrations/emailFlowEngine";

export async function POST(req: Request) {
  // Verify webhook secret for cron security
  const authHeader = req.headers.get("authorization");
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (webhookSecret && webhookSecret !== "REPLACE_ME") {
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processAllPendingEnrollments();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Email flow processing error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}

// Also support GET for simple health checks / manual triggers
export async function GET() {
  try {
    const result = await processAllPendingEnrollments();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Email flow processing error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}

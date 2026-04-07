// ---------------------------------------------------------------------------
// GET /api/cron/proactive-alerts — check all users for threshold alerts
// Called by Vercel cron every 6 hours
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { runAlertChecksForAllUsers } from "@/lib/intelligence/proactiveAlerts";

export async function GET() {
  try {
    const result = await runAlertChecksForAllUsers();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Proactive alerts cron error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

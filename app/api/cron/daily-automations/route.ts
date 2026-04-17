// GET /api/cron/daily-automations — runs ALL daily background automations
// Called by Vercel cron every day at 6am

import { NextResponse } from "next/server";
import { runDailyAutomations } from "@/lib/himalaya/autoRunner";

export async function GET() {
  try {
    const result = await runDailyAutomations();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Daily automations error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

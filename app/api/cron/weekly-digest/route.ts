// ---------------------------------------------------------------------------
// GET /api/cron/weekly-digest — send weekly performance email to all users
// Called by Vercel cron every Monday 7am
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigest } from "@/lib/intelligence/weeklyDigest";

export async function GET() {
  try {
    const users = await prisma.user.findMany({ select: { id: true }, take: 100 });
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const ok = await sendWeeklyDigest(user.id);
      if (ok) sent++;
      else failed++;
    }

    return NextResponse.json({ ok: true, sent, failed, total: users.length });
  } catch (err) {
    console.error("Weekly digest cron error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

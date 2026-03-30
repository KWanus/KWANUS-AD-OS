/**
 * POST /api/automations/process-delayed
 *
 * Cron-callable endpoint that resumes paused automation runs
 * whose delay period has elapsed (resumeAfter <= now).
 *
 * Secured by a CRON_SECRET header check. Call this every 1-5 minutes.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeAutomation } from "@/lib/automations/executeAutomation";

export async function POST(req: NextRequest) {
  // Verify cron secret (skip in dev)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Find all paused runs ready to resume
    const pausedRuns = await prisma.automationRun.findMany({
      where: {
        status: "paused",
        resumeAfter: { lte: new Date() },
      },
      include: {
        automation: {
          select: { id: true, userId: true, status: true },
        },
      },
      take: 50, // Process in batches to avoid timeout
    });

    if (pausedRuns.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processed = 0;
    let failed = 0;
    const results: { runId: string; status: string; error?: string }[] = [];

    for (const run of pausedRuns) {
      // Skip if automation was deactivated while paused
      if (run.automation.status !== "active") {
        await prisma.automationRun.update({
          where: { id: run.id },
          data: { status: "failed", completedAt: new Date() },
        });
        results.push({ runId: run.id, status: "skipped", error: "Automation no longer active" });
        continue;
      }

      // Reload contacts from the run metadata
      const meta = run.metadata as { contactEmails?: string[] } | null;
      const contactEmails = meta?.contactEmails ?? [];

      let contacts: { email: string; firstName?: string | null; lastName?: string | null; tags?: string[] }[] = [];
      if (contactEmails.length > 0) {
        contacts = await prisma.emailContact.findMany({
          where: { userId: run.userId, email: { in: contactEmails } },
          select: { email: true, firstName: true, lastName: true, tags: true },
        });
      }

      // If no contacts found from metadata, try to get the user for creds anyway
      const user = await prisma.user.findUnique({
        where: { id: run.userId },
        select: { resendApiKey: true, sendingFromEmail: true, sendingFromName: true },
      });

      if (!user) {
        await prisma.automationRun.update({
          where: { id: run.id },
          data: { status: "failed", completedAt: new Date() },
        });
        results.push({ runId: run.id, status: "failed", error: "User not found" });
        failed++;
        continue;
      }

      try {
        const result = await executeAutomation({
          automationId: run.automationId,
          userId: run.userId,
          contacts,
          userCreds: user,
          resumeRunId: run.id,
          resumeFromNode: run.stoppedAtNode ?? undefined,
        });

        processed++;
        results.push({ runId: run.id, status: result.status });
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.automationRun.update({
          where: { id: run.id },
          data: { status: "failed", completedAt: new Date() },
        });
        results.push({ runId: run.id, status: "failed", error: msg });
      }
    }

    return NextResponse.json({ ok: true, processed, failed, results });
  } catch (err) {
    console.error("Process delayed automations error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

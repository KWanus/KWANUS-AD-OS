/**
 * POST /api/email-flows/process-delayed
 *
 * Cron-callable endpoint that resumes paused email flow enrollments
 * whose delay period has elapsed (resumeAfter <= now).
 *
 * Secured by CRON_SECRET header. Call every 1-5 minutes.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeFlowForContact } from "@/lib/email-flows/executeFlow";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const pausedEnrollments = await prisma.emailFlowEnrollment.findMany({
      where: {
        status: "paused",
        resumeAfter: { lte: new Date() },
      },
      include: {
        flow: {
          select: { id: true, status: true, userId: true },
        },
      },
      take: 50,
    });

    if (pausedEnrollments.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    let processed = 0;
    let failed = 0;
    const results: { enrollmentId: string; email: string; status: string; error?: string }[] = [];

    for (const enrollment of pausedEnrollments) {
      // Skip if flow was deactivated
      if (enrollment.flow.status !== "active") {
        await prisma.emailFlowEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "failed" },
        });
        results.push({ enrollmentId: enrollment.id, email: enrollment.contactEmail, status: "skipped", error: "Flow no longer active" });
        continue;
      }

      // Load contact and user creds
      const [contact, user] = await Promise.all([
        prisma.emailContact.findFirst({
          where: { userId: enrollment.userId, email: enrollment.contactEmail },
          select: { email: true, firstName: true, lastName: true },
        }),
        prisma.user.findUnique({
          where: { id: enrollment.userId },
          select: { resendApiKey: true, sendingFromEmail: true, sendingFromName: true },
        }),
      ]);

      if (!contact || !user) {
        await prisma.emailFlowEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "failed" },
        });
        results.push({ enrollmentId: enrollment.id, email: enrollment.contactEmail, status: "failed", error: "Contact or user not found" });
        failed++;
        continue;
      }

      try {
        const result = await executeFlowForContact(
          enrollment.flowId,
          contact,
          user,
          { resumeFromNode: enrollment.currentNodeId ?? undefined, enrollmentId: enrollment.id }
        );

        processed++;
        results.push({ enrollmentId: enrollment.id, email: enrollment.contactEmail, status: result.stoppedAt ? "paused" : "completed" });
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.emailFlowEnrollment.update({
          where: { id: enrollment.id },
          data: { status: "failed" },
        });
        results.push({ enrollmentId: enrollment.id, email: enrollment.contactEmail, status: "failed", error: msg });
      }
    }

    return NextResponse.json({ ok: true, processed, failed, results });
  } catch (err) {
    console.error("Process delayed flows error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/**
 * POST /api/automations/[id]/trigger
 *
 * Manually trigger an automation to run.
 * Uses the shared execution engine which tracks runs, handles conditions,
 * delays (pausing for cron resume), and tag operations.
 *
 * Body: { contactIds?: string[]; email?: string; metadata?: Record<string,unknown> }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { executeAutomation } from "@/lib/automations/executeAutomation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const automation = await prisma.automation.findFirst({ where: { id, userId: user.id } });
    if (!automation) return NextResponse.json({ ok: false, error: "Automation not found" }, { status: 404 });

    if (automation.status !== "active" && automation.trigger !== "manual") {
      return NextResponse.json({ ok: false, error: "Automation is not active" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as {
      contactIds?: string[];
      email?: string;
      metadata?: Record<string, unknown>;
    };

    // Resolve contacts
    const contacts: { email: string; firstName?: string | null; lastName?: string | null; tags?: string[] }[] = [];
    if (body.contactIds?.length) {
      const found = await prisma.emailContact.findMany({
        where: { id: { in: body.contactIds }, userId: user.id },
        select: { email: true, firstName: true, lastName: true, tags: true },
      });
      contacts.push(...found);
    } else if (body.email) {
      const found = await prisma.emailContact.findFirst({
        where: { email: body.email.toLowerCase().trim(), userId: user.id },
        select: { email: true, firstName: true, lastName: true, tags: true },
      });
      if (found) contacts.push(found);
      else contacts.push({ email: body.email, firstName: null, lastName: null, tags: [] });
    }

    const result = await executeAutomation({
      automationId: id,
      userId: user.id,
      contacts,
      userCreds: {
        resendApiKey: user.resendApiKey,
        sendingFromEmail: user.sendingFromEmail,
        sendingFromName: user.sendingFromName,
      },
      trigger: "manual",
      metadata: body.metadata,
    });

    return NextResponse.json({
      ok: result.ok,
      runId: result.runId,
      status: result.status,
      contactsProcessed: contacts.length,
      emailsSent: result.emailsSent,
      stepsCompleted: result.stepsCompleted,
      stoppedAt: result.stoppedAtNode,
      resumeAfter: result.resumeAfter,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error("Automation trigger error:", err);
    return NextResponse.json({ ok: false, error: "Failed to trigger automation" }, { status: 500 });
  }
}

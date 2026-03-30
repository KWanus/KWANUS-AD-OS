/**
 * POST /api/automations/webhook
 *
 * External webhook trigger for automations.
 * Triggers an automation by matching on the automation ID or a named trigger key.
 *
 * Auth: requires the user's webhookUrl secret or automation-specific API key.
 *
 * Body: {
 *   automationId: string;
 *   contacts?: { email: string; firstName?: string; lastName?: string }[];
 *   email?: string;
 *   metadata?: Record<string, unknown>;
 *   secret: string; // must match user.webhookUrl or WEBHOOK_SECRET env
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeAutomation } from "@/lib/automations/executeAutomation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      automationId?: string;
      contacts?: { email: string; firstName?: string; lastName?: string }[];
      email?: string;
      metadata?: Record<string, unknown>;
      secret?: string;
    };

    if (!body.automationId) {
      return NextResponse.json({ ok: false, error: "automationId is required" }, { status: 400 });
    }
    if (!body.secret) {
      return NextResponse.json({ ok: false, error: "secret is required" }, { status: 401 });
    }

    // Find the automation and its owner
    const automation = await prisma.automation.findUnique({
      where: { id: body.automationId },
      select: {
        id: true,
        userId: true,
        status: true,
        trigger: true,
        user: {
          select: {
            webhookUrl: true,
            resendApiKey: true,
            sendingFromEmail: true,
            sendingFromName: true,
          },
        },
      },
    });

    if (!automation) {
      return NextResponse.json({ ok: false, error: "Automation not found" }, { status: 404 });
    }

    // Verify secret: must match user's webhook secret or the global WEBHOOK_SECRET
    const validSecret =
      body.secret === automation.user.webhookUrl ||
      body.secret === process.env.WEBHOOK_SECRET;

    if (!validSecret) {
      return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
    }

    if (automation.status !== "active") {
      return NextResponse.json({ ok: false, error: "Automation is not active" }, { status: 400 });
    }

    // Resolve contacts
    const contacts: { email: string; firstName?: string | null; lastName?: string | null; tags?: string[] }[] = [];

    if (body.contacts?.length) {
      for (const c of body.contacts) {
        const dbContact = await prisma.emailContact.findFirst({
          where: { userId: automation.userId, email: c.email.toLowerCase().trim() },
          select: { email: true, firstName: true, lastName: true, tags: true },
        });
        contacts.push(dbContact ?? { email: c.email, firstName: c.firstName ?? null, lastName: c.lastName ?? null, tags: [] });
      }
    } else if (body.email) {
      const dbContact = await prisma.emailContact.findFirst({
        where: { userId: automation.userId, email: body.email.toLowerCase().trim() },
        select: { email: true, firstName: true, lastName: true, tags: true },
      });
      contacts.push(dbContact ?? { email: body.email, firstName: null, lastName: null, tags: [] });
    }

    const result = await executeAutomation({
      automationId: automation.id,
      userId: automation.userId,
      contacts,
      userCreds: {
        resendApiKey: automation.user.resendApiKey,
        sendingFromEmail: automation.user.sendingFromEmail,
        sendingFromName: automation.user.sendingFromName,
      },
      trigger: "webhook",
      metadata: body.metadata,
    });

    return NextResponse.json({
      ok: result.ok,
      runId: result.runId,
      status: result.status,
      emailsSent: result.emailsSent,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error("Automation webhook error:", err);
    return NextResponse.json({ ok: false, error: "Webhook processing failed" }, { status: 500 });
  }
}

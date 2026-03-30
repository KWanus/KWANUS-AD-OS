/**
 * POST /api/automations/[id]/enroll
 *
 * Enroll one or more contacts in an automation and execute it.
 * Similar to trigger but with a consistent contact resolution interface
 * matching the email-flows enroll endpoint.
 *
 * Body:
 *   { contactId?: string }       — enroll by contact DB id
 *   { email?: string }           — enroll by email address
 *   { contactIds?: string[] }    — enroll multiple contacts
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

    const automation = await prisma.automation.findFirst({
      where: { id, userId: user.id },
    });
    if (!automation) return NextResponse.json({ ok: false, error: "Automation not found" }, { status: 404 });

    const body = await req.json() as {
      contactId?: string;
      email?: string;
      contactIds?: string[];
    };

    // Resolve contacts
    const contacts: { email: string; firstName: string | null; lastName: string | null; tags: string[] }[] = [];

    if (body.contactIds?.length) {
      const found = await prisma.emailContact.findMany({
        where: { id: { in: body.contactIds }, userId: user.id },
        select: { email: true, firstName: true, lastName: true, tags: true },
      });
      contacts.push(...found);
    } else if (body.contactId) {
      const found = await prisma.emailContact.findFirst({
        where: { id: body.contactId, userId: user.id },
        select: { email: true, firstName: true, lastName: true, tags: true },
      });
      if (!found) return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
      contacts.push(found);
    } else if (body.email) {
      const found = await prisma.emailContact.findFirst({
        where: { email: body.email.toLowerCase().trim(), userId: user.id },
        select: { email: true, firstName: true, lastName: true, tags: true },
      });
      if (!found) return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
      contacts.push(found);
    } else {
      return NextResponse.json({ ok: false, error: "Provide contactId, email, or contactIds" }, { status: 400 });
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
    });

    return NextResponse.json({
      ok: result.ok,
      runId: result.runId,
      enrolled: contacts.length,
      totalSent: result.emailsSent,
      totalErrors: result.errors.length,
      status: result.status,
      results: contacts.map((c) => ({
        email: c.email,
        sent: result.emailsSent,
        errors: result.errors.filter((e) => e.includes(c.email)),
      })),
    });
  } catch (err) {
    console.error("Automation enroll error:", err);
    return NextResponse.json({ ok: false, error: "Failed to enroll contacts" }, { status: 500 });
  }
}

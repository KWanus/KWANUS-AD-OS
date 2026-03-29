/**
 * POST /api/email-flows/[id]/enroll
 *
 * Enroll one or more contacts in a flow and immediately execute
 * all non-delayed nodes (sends emails up to the first delay/condition).
 *
 * Body:
 *   { contactId?: string }          — enroll by contact DB id
 *   { email?: string }              — enroll by email address
 *   { contactIds?: string[] }       — enroll multiple contacts
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { executeFlowForContact } from "@/lib/email-flows/executeFlow";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flowId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const flow = await prisma.emailFlow.findFirst({ where: { id: flowId, userId: user.id } });
    if (!flow) return NextResponse.json({ ok: false, error: "Flow not found" }, { status: 404 });

    const body = await req.json() as {
      contactId?: string;
      email?: string;
      contactIds?: string[];
    };

    // Resolve contacts list
    const contactRecords: { email: string; firstName: string | null; lastName: string | null }[] = [];

    if (body.contactIds?.length) {
      const found = await prisma.emailContact.findMany({
        where: { id: { in: body.contactIds }, userId: user.id },
        select: { email: true, firstName: true, lastName: true },
      });
      contactRecords.push(...found);
    } else if (body.contactId) {
      const found = await prisma.emailContact.findFirst({
        where: { id: body.contactId, userId: user.id },
        select: { email: true, firstName: true, lastName: true },
      });
      if (!found) return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
      contactRecords.push(found);
    } else if (body.email) {
      const found = await prisma.emailContact.findFirst({
        where: { email: body.email.toLowerCase().trim(), userId: user.id },
        select: { email: true, firstName: true, lastName: true },
      });
      if (!found) return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
      contactRecords.push(found);
    } else {
      return NextResponse.json({ ok: false, error: "Provide contactId, email, or contactIds" }, { status: 400 });
    }

    const userCreds = {
      resendApiKey: user.resendApiKey,
      sendingFromEmail: user.sendingFromEmail,
      sendingFromName: user.sendingFromName,
    };

    let totalSent = 0;
    let totalErrors = 0;
    const results: { email: string; sent: number; errors: string[] }[] = [];

    for (const contact of contactRecords) {
      const result = await executeFlowForContact(flowId, contact, userCreds);
      totalSent += result.emailsSent;
      totalErrors += result.errors.length;
      results.push({ email: contact.email, sent: result.emailsSent, errors: result.errors });
    }

    return NextResponse.json({
      ok: true,
      enrolled: contactRecords.length,
      totalSent,
      totalErrors,
      results,
    });
  } catch (err) {
    console.error("Flow enroll error:", err);
    return NextResponse.json({ ok: false, error: "Failed to enroll contacts" }, { status: 500 });
  }
}

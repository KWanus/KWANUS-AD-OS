// ---------------------------------------------------------------------------
// GET /api/contacts/[id]/timeline
// Returns all touchpoints for a specific contact: form submissions,
// email sends, opens, clicks, purchases, flow enrollments
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type TimelineEvent = {
  type: "form_submit" | "email_sent" | "email_opened" | "email_clicked" | "purchase" | "enrolled" | "lead_created";
  title: string;
  detail: string;
  timestamp: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const contact = await prisma.emailContact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const timeline: TimelineEvent[] = [];

    // Contact creation
    timeline.push({
      type: "form_submit",
      title: "Contact created",
      detail: `Source: ${contact.source ?? "unknown"}. Tags: ${contact.tags.join(", ") || "none"}`,
      timestamp: contact.createdAt.toISOString(),
    });

    // Find lead records
    const leads = await prisma.lead.findMany({
      where: { userId: user.id, email: contact.email },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    for (const lead of leads) {
      timeline.push({
        type: "lead_created",
        title: `Lead: ${lead.name}`,
        detail: `Score: ${lead.score ?? "—"} · ${lead.verdict ?? lead.status} · ${lead.niche}`,
        timestamp: lead.createdAt.toISOString(),
      });
    }

    // Find enrollments
    const enrollments = await prisma.emailFlowEnrollment.findMany({
      where: { contactEmail: contact.email, userId: user.id },
      include: { flow: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    for (const e of enrollments) {
      timeline.push({
        type: "enrolled",
        title: `Enrolled in "${e.flow.name}"`,
        detail: `Status: ${e.status}. Emails sent: ${e.emailsSent}`,
        timestamp: e.createdAt.toISOString(),
      });
    }

    // Find funnel events for this contact
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: {
        userId: user.id,
        event: { in: ["form_submission", "purchase_completed"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    for (const event of events) {
      const meta = event.metadata as Record<string, unknown> | null;
      if (meta?.customerEmail === contact.email || meta?.contactId === contact.id) {
        if (event.event === "purchase_completed") {
          timeline.push({
            type: "purchase",
            title: `Purchase: $${((meta?.amount as number ?? 0) / 100).toFixed(2)}`,
            detail: `Stripe session: ${meta?.stripeSessionId ?? "—"}`,
            timestamp: event.createdAt.toISOString(),
          });
        }
      }
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      ok: true,
      contact: {
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        status: contact.status,
        tags: contact.tags,
        createdAt: contact.createdAt,
      },
      timeline,
    });
  } catch (err) {
    console.error("Timeline error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/inbox — unified inbox: all messages across all channels
// Combines: form submissions, chat messages, email replies, booking requests
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type InboxItem = {
  id: string;
  type: "form" | "chat" | "email" | "booking" | "testimonial";
  from: string;
  email: string | null;
  preview: string;
  read: boolean;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Pull all message-type events
    const events = await prisma.himalayaFunnelEvent.findMany({
      where: {
        userId: user.id,
        event: { in: ["form_submission", "chat_message", "booking_created", "testimonial_submitted"] },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const items: InboxItem[] = events.map((e) => {
      const meta = e.metadata as Record<string, unknown>;

      if (e.event === "chat_message") {
        return {
          id: e.id,
          type: "chat" as const,
          from: (meta.visitorName as string) ?? "Visitor",
          email: (meta.visitorEmail as string) ?? null,
          preview: ((meta.message as string) ?? "").slice(0, 100),
          read: (meta.read as boolean) ?? false,
          timestamp: e.createdAt.toISOString(),
          metadata: meta,
        };
      }

      if (e.event === "booking_created") {
        return {
          id: e.id,
          type: "booking" as const,
          from: (meta.clientName as string) ?? "Client",
          email: (meta.clientEmail as string) ?? null,
          preview: `Booking: ${meta.date} at ${meta.startTime}`,
          read: true,
          timestamp: e.createdAt.toISOString(),
          metadata: meta,
        };
      }

      if (e.event === "testimonial_submitted") {
        return {
          id: e.id,
          type: "testimonial" as const,
          from: (meta.name as string) ?? "Customer",
          email: null,
          preview: ((meta.quote as string) ?? "").slice(0, 100),
          read: (meta.status as string) !== "pending",
          timestamp: e.createdAt.toISOString(),
          metadata: meta,
        };
      }

      // Form submission
      return {
        id: e.id,
        type: "form" as const,
        from: "Site Visitor",
        email: (meta.contactEmail as string) ?? null,
        preview: `Form submission from ${meta.siteSlug ?? "site"}`,
        read: true,
        timestamp: e.createdAt.toISOString(),
        metadata: meta,
      };
    });

    // Also get recent leads
    const leads = await prisma.lead.findMany({
      where: { userId: user.id, status: "new" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    for (const lead of leads) {
      items.push({
        id: lead.id,
        type: "form",
        from: lead.name,
        email: lead.email,
        preview: lead.notes?.slice(0, 100) ?? `New lead from ${lead.niche}`,
        read: false,
        timestamp: lead.createdAt.toISOString(),
        metadata: { leadId: lead.id, score: lead.score, verdict: lead.verdict },
      });
    }

    // Sort by timestamp, unread first
    items.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    const unreadCount = items.filter((i) => !i.read).length;

    return NextResponse.json({ ok: true, items, unreadCount });
  } catch (err) {
    console.error("Inbox error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

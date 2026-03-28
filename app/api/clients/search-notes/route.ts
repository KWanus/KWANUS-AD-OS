import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/clients/search-notes?q=keyword
 * Search across all client activity notes and content.
 * Useful for finding specific conversations, decisions, or follow-up items.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ ok: true, results: [], total: 0 });
    }

    const contains = { contains: q, mode: "insensitive" as const };

    // Search client notes and activity content
    const [clientsWithNotes, activities] = await Promise.all([
      prisma.client.findMany({
        where: { userId: user.id, notes: contains },
        select: { id: true, name: true, notes: true },
        take: 10,
      }),
      prisma.clientActivity.findMany({
        where: {
          client: { userId: user.id },
          content: contains,
        },
        select: {
          id: true,
          type: true,
          content: true,
          createdAt: true,
          client: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const results = [
      ...clientsWithNotes.map(c => ({
        type: "client_note" as const,
        clientId: c.id,
        clientName: c.name,
        content: c.notes ?? "",
        href: `/clients/${c.id}`,
      })),
      ...activities.map(a => ({
        type: "activity" as const,
        clientId: a.client.id,
        clientName: a.client.name,
        content: a.content ?? "",
        activityType: a.type,
        date: a.createdAt.toISOString(),
        href: `/clients/${a.client.id}`,
      })),
    ];

    return NextResponse.json({ ok: true, results, total: results.length });
  } catch (err) {
    console.error("Client notes search error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

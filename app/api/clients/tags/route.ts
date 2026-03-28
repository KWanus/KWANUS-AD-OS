import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/clients/tags
 * Returns all unique tags used across the user's clients, with counts.
 * Useful for building tag filter dropdowns and managing tags.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    for (const client of clients) {
      for (const tag of (client.tags as string[]) ?? []) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }

    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ ok: true, tags, total: tags.length });
  } catch (err) {
    console.error("Client tags error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

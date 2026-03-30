/**
 * GET /api/automations/[id]/runs
 *
 * Returns paginated run history for an automation, including step details.
 * Query: ?limit=20&offset=0&status=completed
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const automation = await prisma.automation.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!automation) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const statusFilter = url.searchParams.get("status");

    const where = {
      automationId: id,
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    const [runs, total] = await Promise.all([
      prisma.automationRun.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          steps: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.automationRun.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      runs,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("Automation runs GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

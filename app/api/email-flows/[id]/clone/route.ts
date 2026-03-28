import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/email-flows/[id]/clone
 * Duplicate an email flow with all its nodes and edges.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const source = await prisma.emailFlow.findFirst({
      where: { id, userId: user.id },
    });

    if (!source) {
      return NextResponse.json({ ok: false, error: "Flow not found" }, { status: 404 });
    }

    const clone = await prisma.emailFlow.create({
      data: {
        userId: user.id,
        name: `${source.name} (Copy)`,
        trigger: source.trigger,
        triggerConfig: source.triggerConfig as object ?? undefined,
        nodes: source.nodes as object,
        edges: source.edges as object,
        tags: source.tags as string[],
        status: "draft",
      },
    });

    return NextResponse.json({ ok: true, flow: { id: clone.id, name: clone.name } });
  } catch (err) {
    console.error("Flow clone error:", err);
    return NextResponse.json({ ok: false, error: "Failed to clone flow" }, { status: 500 });
  }
}

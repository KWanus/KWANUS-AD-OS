/**
 * POST /api/automations/[id]/clone
 * Duplicate an automation with all its nodes, edges, and config.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

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

    const source = await prisma.automation.findFirst({
      where: { id, userId: user.id },
    });

    if (!source) {
      return NextResponse.json({ ok: false, error: "Automation not found" }, { status: 404 });
    }

    const clone = await prisma.automation.create({
      data: {
        userId: user.id,
        name: `${source.name} (Copy)`,
        description: source.description,
        campaignId: source.campaignId,
        trigger: source.trigger,
        triggerConfig: source.triggerConfig as object ?? undefined,
        nodes: source.nodes as object,
        edges: source.edges as object,
        status: "draft",
      },
    });

    return NextResponse.json({ ok: true, automation: { id: clone.id, name: clone.name } });
  } catch (err) {
    console.error("Automation clone error:", err);
    return NextResponse.json({ ok: false, error: "Failed to clone automation" }, { status: 500 });
  }
}

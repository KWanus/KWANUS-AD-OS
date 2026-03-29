import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const flow = await prisma.emailFlow.findFirst({ where: { id, userId: user.id } });
    if (!flow) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, flow });
  } catch (err) {
    console.error("EmailFlow GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, flow: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
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
    const existing = await prisma.emailFlow.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json() as {
      name?: string;
      trigger?: string;
      triggerConfig?: Record<string, unknown>;
      nodes?: object[];
      edges?: object[];
      status?: string;
      tags?: string[];
      executionTier?: "core" | "elite";
    };

    // Validate status
    const VALID_STATUSES = ["draft", "active", "paused", "archived"];
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ ok: false, error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    // Validate trigger
    const VALID_TRIGGERS = ["signup", "purchase", "abandoned_cart", "browse_abandon", "custom", "manual"];
    if (body.trigger && !VALID_TRIGGERS.includes(body.trigger)) {
      return NextResponse.json({ ok: false, error: `trigger must be one of: ${VALID_TRIGGERS.join(", ")}` }, { status: 400 });
    }

    // Validate name not empty
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ ok: false, error: "Flow name cannot be empty" }, { status: 400 });
    }

    const triggerConfig =
      body.triggerConfig !== undefined || body.executionTier !== undefined
        ? {
            ...(body.triggerConfig ?? {}),
            ...(body.executionTier !== undefined ? { executionTier: body.executionTier === "core" ? "core" : "elite" } : {}),
          }
        : undefined;
    const flow = await prisma.emailFlow.update({
      where: { id, userId: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.trigger !== undefined && { trigger: body.trigger }),
        ...(triggerConfig !== undefined && { triggerConfig }),
        ...(body.nodes !== undefined && { nodes: body.nodes }),
        ...(body.edges !== undefined && { edges: body.edges }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    });
    return NextResponse.json({ ok: true, flow });
  } catch (err) {
    console.error("EmailFlow PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await prisma.emailFlow.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("EmailFlow DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

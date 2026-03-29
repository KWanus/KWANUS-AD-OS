import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50"), 100);
    const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
    const status = req.nextUrl.searchParams.get("status") ?? undefined;

    const flows = await prisma.emailFlow.findMany({
      where: { userId: user.id, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, name: true, status: true, trigger: true,
        tags: true, createdAt: true, updatedAt: true,
      },
    });

    const hasMore = flows.length > limit;
    if (hasMore) flows.pop();
    const nextCursor = hasMore ? flows[flows.length - 1]?.id : undefined;

    return NextResponse.json({ ok: true, flows, nextCursor, hasMore });
  } catch (err) {
    console.error("EmailFlows GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, flows: [], databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to load flows" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json() as {
      name: string;
      trigger: string;
      triggerConfig?: Record<string, unknown>;
      nodes?: object[];
      edges?: object[];
      tags?: string[];
      executionTier?: "core" | "elite";
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Flow name is required" }, { status: 400 });
    }
    if (!body.trigger?.trim()) {
      return NextResponse.json({ ok: false, error: "Trigger type is required" }, { status: 400 });
    }

    const VALID_TRIGGERS = ["signup", "purchase", "abandoned_cart", "browse_abandon", "custom", "manual"];
    if (!VALID_TRIGGERS.includes(body.trigger.trim())) {
      return NextResponse.json(
        { ok: false, error: `trigger must be one of: ${VALID_TRIGGERS.join(", ")}` },
        { status: 400 }
      );
    }

    const executionTier = body.executionTier === "core" ? "core" : "elite";

    const flow = await prisma.emailFlow.create({
      data: {
        userId: user.id,
        name: body.name,
        trigger: body.trigger,
        triggerConfig: {
          ...(body.triggerConfig ?? {}),
          executionTier,
        },
        nodes: body.nodes ?? [],
        edges: body.edges ?? [],
        tags: body.tags ?? [],
        status: "draft",
      },
    });
    return NextResponse.json({ ok: true, flow });
  } catch (err) {
    console.error("EmailFlows POST:", err);
    return NextResponse.json({ ok: false, error: "Failed to create flow" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const flows = await prisma.emailFlow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ ok: true, flows });
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
      triggerConfig?: object;
      nodes?: object[];
      edges?: object[];
      tags?: string[];
    };

    const flow = await prisma.emailFlow.create({
      data: {
        userId: user.id,
        name: body.name,
        trigger: body.trigger,
        triggerConfig: body.triggerConfig,
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

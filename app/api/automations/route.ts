import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") ?? "";
    const campaignId = searchParams.get("campaignId") ?? "";

    const where = {
      userId: user.id,
      ...(status && { status }),
      ...(campaignId && { campaignId }),
    };

    const automations = await prisma.automation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    return NextResponse.json({ ok: true, automations });
  } catch (err) {
    console.error("Automations GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
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
      description?: string;
      campaignId?: string;
      trigger?: string;
      triggerConfig?: Record<string, unknown>;
      nodes?: unknown[];
      edges?: unknown[];
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }

    const automation = await prisma.automation.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        campaignId: body.campaignId || null,
        trigger: body.trigger ?? "manual",
        triggerConfig: (body.triggerConfig ?? undefined) as undefined,
        nodes: (body.nodes ?? []) as object,
        edges: (body.edges ?? []) as object,
      },
    });

    return NextResponse.json({ ok: true, automation });
  } catch (err) {
    console.error("Automations POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

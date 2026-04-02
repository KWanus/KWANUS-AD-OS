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

    const { searchParams } = new URL(req.url);
    const assetType = searchParams.get("assetType");
    const mode = searchParams.get("mode");

    const where: Record<string, unknown> = { userId: user.id };
    if (assetType) where.assetType = assetType;
    if (mode) where.mode = mode;

    const templates = await prisma.himalayaTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, templates });
  } catch (err) {
    console.error("Templates GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      name?: string;
      assetType?: string;
      mode?: string;
      content?: unknown;
      sourceRunId?: string;
    };

    if (!body.name || !body.assetType || !body.mode || body.content === undefined) {
      return NextResponse.json({ ok: false, error: "name, assetType, mode, and content are required" }, { status: 400 });
    }

    const template = await prisma.himalayaTemplate.create({
      data: {
        userId: user.id,
        name: body.name,
        assetType: body.assetType,
        mode: body.mode,
        content: body.content as object,
        sourceRunId: body.sourceRunId ?? null,
      },
    });

    return NextResponse.json({ ok: true, template });
  } catch (err) {
    console.error("Templates POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

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

    // Verify ownership
    const client = await prisma.client.findFirst({ where: { id, userId: user.id } });
    if (!client) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const activities = await prisma.clientActivity.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, activities });
  } catch (err) {
    console.error("Activities GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, activities: [], databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const client = await prisma.client.findFirst({ where: { id, userId: user.id } });
    if (!client) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json() as {
      type: string;
      content?: string;
      metadata?: object;
    };

    const activity = await prisma.clientActivity.create({
      data: {
        clientId: id,
        type: body.type,
        content: body.content,
        metadata: body.metadata,
        createdBy: user.id,
      },
    });

    // Update lastContactAt when logging a real touchpoint
    if (["email", "call", "meeting", "sms"].includes(body.type)) {
      await prisma.client.updateMany({
        where: { id, userId: user.id },
        data: { lastContactAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, activity });
  } catch (err) {
    console.error("Activities POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

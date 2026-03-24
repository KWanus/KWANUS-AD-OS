import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const broadcasts = await prisma.emailBroadcast.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ ok: true, broadcasts });
  } catch (err) {
    console.error("EmailBroadcasts GET:", err);
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
      subject: string;
      previewText?: string;
      body: string;
      fromName?: string;
      fromEmail?: string;
      segmentTags?: string[];
      scheduledAt?: string;
    };

    if (!body.name?.trim() || !body.subject?.trim()) {
      return NextResponse.json({ ok: false, error: "Name and subject are required" }, { status: 400 });
    }

    const broadcast = await prisma.emailBroadcast.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        subject: body.subject.trim(),
        previewText: body.previewText,
        body: body.body ?? "",
        fromName: body.fromName,
        fromEmail: body.fromEmail,
        segmentTags: body.segmentTags ?? [],
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: "draft",
      },
    });

    return NextResponse.json({ ok: true, broadcast });
  } catch (err) {
    console.error("EmailBroadcasts POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

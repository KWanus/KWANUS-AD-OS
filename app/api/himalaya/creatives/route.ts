import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST — save a creative to a project */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await req.json() as {
      projectId: string;
      templateId: string;
      templateName: string;
      values: Record<string, string>;
      preview?: string;
      status: "draft" | "saved" | "published";
    };

    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: user.id,
        event: "creative_saved",
        metadata: JSON.parse(JSON.stringify({
          projectId: body.projectId,
          templateId: body.templateId,
          templateName: body.templateName,
          values: body.values,
          preview: body.preview?.slice(0, 500), // Don't store full SVG in metadata
          status: body.status,
          savedAt: new Date().toISOString(),
        })),
      },
    });

    return NextResponse.json({ ok: true, id: event.id });
  } catch (err) {
    console.error("Save creative error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** GET — list saved creatives for a user */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const events = await prisma.himalayaFunnelEvent.findMany({
      where: { userId: user.id, event: "creative_saved" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const creatives = events.map(e => ({
      id: e.id,
      ...(e.metadata as Record<string, unknown>),
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, creatives });
  } catch {
    return NextResponse.json({ ok: true, creatives: [] });
  }
}

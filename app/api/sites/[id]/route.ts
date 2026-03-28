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

    const site = await prisma.site.findFirst({
      where: { id, userId: user.id },
      include: {
        pages: { orderBy: { order: "asc" } },
        products: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, site });
  } catch (err) {
    console.error("Site GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, site: null, databaseUnavailable: true });
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

    const body = await req.json() as {
      name?: string;
      description?: string;
      faviconEmoji?: string;
      theme?: any;
      customDomain?: string;
      published?: boolean;
    };

    const result = await prisma.site.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.faviconEmoji !== undefined && { faviconEmoji: body.faviconEmoji }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.customDomain !== undefined && { customDomain: body.customDomain || null }),
        ...(body.published !== undefined && { published: body.published }),
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Site PATCH:", err);
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

    await prisma.site.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Site DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

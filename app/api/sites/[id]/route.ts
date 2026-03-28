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
      theme?: Record<string, unknown>;
      customDomain?: string;
      published?: boolean;
    };

    // Validate name is not empty/whitespace
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ ok: false, error: "Site name cannot be empty" }, { status: 400 });
    }

    // Validate theme is a plain object (not array, not null)
    if (body.theme !== undefined && (typeof body.theme !== "object" || body.theme === null || Array.isArray(body.theme))) {
      return NextResponse.json({ ok: false, error: "theme must be a JSON object" }, { status: 400 });
    }

    // Validate custom domain format
    if (body.customDomain?.trim()) {
      const domain = body.customDomain.trim().toLowerCase();
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
        return NextResponse.json({ ok: false, error: "customDomain must be a valid domain (e.g. example.com)" }, { status: 400 });
      }
    }

    await prisma.site.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.faviconEmoji !== undefined && { faviconEmoji: body.faviconEmoji }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.customDomain !== undefined && { customDomain: body.customDomain?.trim().toLowerCase() || null }),
        ...(body.published !== undefined && { published: body.published }),
      },
    });

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

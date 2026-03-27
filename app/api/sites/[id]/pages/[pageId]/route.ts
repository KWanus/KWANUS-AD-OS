import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Verify ownership via site
    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id } });
    if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json() as {
      title?: string;
      blocks?: any[];
      seoTitle?: string;
      seoDesc?: string;
      published?: boolean;
      order?: number;
    };

    await prisma.sitePage.updateMany({
      where: { id: pageId, siteId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.blocks !== undefined && { blocks: body.blocks }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle || null }),
        ...(body.seoDesc !== undefined && { seoDesc: body.seoDesc || null }),
        ...(body.published !== undefined && { published: body.published }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Page PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id: siteId, pageId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id } });
    if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    // Can't delete the only page
    const count = await prisma.sitePage.count({ where: { siteId } });
    if (count <= 1) {
      return NextResponse.json({ ok: false, error: "Cannot delete the last page" }, { status: 400 });
    }

    await prisma.sitePage.deleteMany({ where: { id: pageId, siteId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Page DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

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

    await prisma.site.updateMany({
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

    // Auto-fill SEO + notify on publish
    if (body.published === true) {
      // Notify
      try {
        const { notifySitePublished } = await import("@/lib/notifications/notify");
        const site = await prisma.site.findFirst({ where: { id, userId: user.id }, select: { name: true, slug: true } });
        if (site) {
          notifySitePublished(user.id, site.name, `/s/${site.slug}`).catch(() => {});
        }
      } catch { /* non-blocking */ }
      try {
        const { generateSeoFromBlocks, shouldAutoFillSeo } = await import("@/lib/sites/autoSeo");
        const site = await prisma.site.findFirst({ where: { id, userId: user.id } });
        const pages = await prisma.sitePage.findMany({ where: { siteId: id } });
        for (const page of pages) {
          if (shouldAutoFillSeo(page)) {
            const blocks = (page.blocks as { type: string; props: Record<string, unknown> }[]) ?? [];
            const seo = generateSeoFromBlocks(site?.name ?? "", blocks as any);
            await prisma.sitePage.update({
              where: { id: page.id },
              data: {
                ...(!page.seoTitle?.trim() && { seoTitle: seo.title }),
                ...(!page.seoDesc?.trim() && { seoDesc: seo.description }),
              },
            });
          }
        }
      } catch {
        // Auto-SEO is non-blocking
      }
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

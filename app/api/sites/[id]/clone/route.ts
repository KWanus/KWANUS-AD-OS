import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

/**
 * POST /api/sites/[id]/clone
 * Duplicate a site with all its pages and blocks.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const source = await prisma.site.findFirst({
      where: { id, userId: user.id },
      include: { pages: { orderBy: { order: "asc" } } },
    });

    if (!source) {
      return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
    }

    // Generate unique slug
    const base = slugify(`${source.name}-copy`);
    let slug = base;
    let attempt = 0;
    while (await prisma.site.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }

    const clone = await prisma.site.create({
      data: {
        userId: user.id,
        name: `${source.name} (Copy)`,
        slug,
        description: source.description,
        published: false, // Always start as draft
        theme: source.theme as object ?? undefined,
        pages: {
          create: source.pages.map(p => ({
            title: p.title,
            slug: p.slug,
            order: p.order,
            blocks: p.blocks as object,
            published: false,
            seoTitle: p.seoTitle,
            seoDesc: p.seoDesc,
          })),
        },
      },
      include: { pages: { select: { id: true, slug: true } } },
    });

    return NextResponse.json({
      ok: true,
      site: { id: clone.id, name: clone.name, slug: clone.slug },
      cloned: { pages: source.pages.length },
    });
  } catch (err) {
    console.error("Site clone error:", err);
    return NextResponse.json({ ok: false, error: "Failed to clone site" }, { status: 500 });
  }
}

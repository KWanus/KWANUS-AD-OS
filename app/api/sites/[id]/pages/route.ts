import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "page";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Verify site ownership
    const site = await prisma.site.findFirst({ where: { id: siteId, userId: user.id } });
    if (!site) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = await req.json() as { title: string };
    if (!body.title?.trim()) {
      return NextResponse.json({ ok: false, error: "Title required" }, { status: 400 });
    }

    const base = slugify(body.title.trim());
    let slug = base;
    let attempt = 0;
    while (await prisma.sitePage.findUnique({ where: { siteId_slug: { siteId, slug } } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }

    const maxOrder = await prisma.sitePage.aggregate({ where: { siteId }, _max: { order: true } });
    const page = await prisma.sitePage.create({
      data: {
        siteId,
        title: body.title.trim(),
        slug,
        order: (maxOrder._max.order ?? 0) + 1,
        blocks: [],
      },
    });

    return NextResponse.json({ ok: true, page });
  } catch (err) {
    console.error("Pages POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

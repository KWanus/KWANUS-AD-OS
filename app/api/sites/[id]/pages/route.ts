import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  createAiPageBlocks,
  type AiPageTemplate,
} from "@/lib/site-builder/copilotActions";

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

    const body = await req.json() as {
      title: string;
      aiTemplate?: AiPageTemplate;
      sourcePageId?: string;
    };
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
    const sourcePage = body.sourcePageId
      ? await prisma.sitePage.findFirst({
          where: { id: body.sourcePageId, siteId },
        })
      : null;
    const generation = typeof site.theme === "object" && site.theme && "generation" in (site.theme as Record<string, unknown>)
      ? ((site.theme as Record<string, unknown>).generation as {
          niche?: string;
          location?: string;
        } | null)
      : null;
    const blocks = sourcePage
      ? ((sourcePage.blocks as unknown as Prisma.InputJsonValue) ?? [])
      : body.aiTemplate
      ? createAiPageBlocks({
          template: body.aiTemplate,
          siteName: site.name,
          niche: generation?.niche,
          location: generation?.location,
        })
      : [];
    const page = await prisma.sitePage.create({
      data: {
        siteId,
        title: body.title.trim(),
        slug,
        order: (maxOrder._max.order ?? 0) + 1,
        blocks: blocks as unknown as Prisma.InputJsonValue,
        seoTitle: sourcePage?.seoTitle ? `${sourcePage.seoTitle} Copy` : null,
        seoDesc: sourcePage?.seoDesc ?? null,
        published: sourcePage ? false : true,
      },
    });

    return NextResponse.json({ ok: true, page });
  } catch (err) {
    console.error("Pages POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

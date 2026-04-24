import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";
import { getTemplateById } from "@/templates/siteTemplates";
import { getStarterBlocksForContext, inferStarterTemplateId } from "@/lib/site-builder/starterTemplates";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        faviconEmoji: true,
        theme: true,
        customDomain: true,
        published: true,
        totalViews: true,
        pages: {
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
            blocks: true,
            seoTitle: true,
            seoDesc: true,
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ ok: true, sites });
  } catch (err) {
    console.error("Sites GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, sites: [], databaseUnavailable: true });
    }
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
      description?: string;
      template?: string;
      campaignId?: string;
      templateId?: string;
      slug?: string;
      businessType?: string;
      niche?: string;
      location?: string;
      executionTier?: "core" | "elite";
    };
    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Site name required" }, { status: 400 });
    }

    // Generate unique slug
    const base = slugify((body.slug || body.name).trim());
    let slug = base;
    let attempt = 0;
    while (await prisma.site.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${base}-${attempt}`;
    }

    let draft: Record<string, unknown> | null = null;
    if (body.campaignId) {
      draft = await prisma.landingDraft.findFirst({ where: { campaignId: body.campaignId } }) as Record<string, unknown> | null;
    }
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
      select: { businessType: true, niche: true, location: true },
    });
    const starterContext = {
      businessType: body.businessType ?? profile?.businessType,
      niche: body.niche ?? profile?.niche,
      location: body.location ?? profile?.location,
      executionTier: body.executionTier ?? "core",
      draft,
    };
    const starterTemplateId = inferStarterTemplateId(body.template ?? "blank", starterContext);

    // Resolve blocks — prefer templateId, then template type, then blank
    let pageCreates;
    const siteTemplate = body.templateId ? getTemplateById(body.templateId) : undefined;

    if (siteTemplate) {
      // Build all pages from the template
      pageCreates = siteTemplate.pages.map((page, i) => ({
        title: page.name,
        slug: page.slug,
        order: i,
        blocks: page.blocks.map((b, j) => ({
          id: `${b.type}-${j}`,
          type: b.type,
          props: b.props,
        })),
      }));
    } else {
      pageCreates = [{
        title: "Home",
        slug: "home",
        order: 0,
        blocks: getStarterBlocksForContext(body.template ?? "blank", body.name.trim(), starterContext),
      }];
    }

    // Create site + pages in a transaction
    const site = await prisma.site.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        theme: {
          primaryColor: "#f5a623",
          font: "inter",
          mode: "dark",
          generation: {
            sourceMode: "manual_start",
            templateId: starterTemplateId,
            pageType: body.template ?? "manual",
            niche: starterContext.niche ?? null,
            location: starterContext.location ?? null,
            businessType: starterContext.businessType ?? null,
            executionTier: starterContext.executionTier,
            generationTrace: {
              template_reason: `Manual starter selected with ${starterTemplateId} using ${starterContext.executionTier} execution tier.`,
            },
          },
        },
        pages: {
          create: pageCreates,
        },
      },
      include: {
        pages: { select: { id: true, slug: true } },
      },
    });

    return NextResponse.json({ ok: true, site });
  } catch (err) {
    console.error("Sites POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

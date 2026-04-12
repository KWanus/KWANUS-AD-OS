import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { deploySiteToProduction, getSitePublicUrl } from "@/lib/integrations/siteDeployer";

/**
 * POST /api/sites/[id]/publish
 * Toggle publish status. When publishing, deploys to real URL.
 */
export async function POST(
  req: NextRequest,
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
      select: { id: true, published: true, slug: true, customDomain: true, name: true },
    });

    if (!site) {
      return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({})) as { published?: boolean };
    const newStatus = body.published !== undefined ? body.published : !site.published;

    // Update site and all its pages
    await prisma.$transaction([
      prisma.site.update({
        where: { id },
        data: { published: newStatus },
      }),
      prisma.sitePage.updateMany({
        where: { siteId: id },
        data: { published: newStatus },
      }),
    ]);

    let url: string | null = null;
    let deployResult = null;

    if (newStatus) {
      // Deploy to real URL — ping search engines, notify user
      deployResult = await deploySiteToProduction({ siteId: id, userId: user.id });
      url = deployResult.ok ? deployResult.url : getSitePublicUrl(site.slug, site.customDomain);
    }

    return NextResponse.json({
      ok: true,
      published: newStatus,
      url,
      liveUrl: url, // explicit real URL
      customDomainInstructions: deployResult?.customDomainInstructions,
    });
  } catch (err) {
    console.error("Site publish error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

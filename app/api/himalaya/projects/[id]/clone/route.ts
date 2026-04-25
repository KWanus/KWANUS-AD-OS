import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    // Find the deployment
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { id, userId: user.id },
    });
    if (!deployment) return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });

    // Clone the site if it exists
    let newSiteId: string | null = null;
    if (deployment.siteId) {
      const site = await prisma.site.findUnique({
        where: { id: deployment.siteId },
        include: { pages: true },
      });
      if (site) {
        const clonedSite = await prisma.site.create({
          data: {
            userId: user.id,
            name: `${site.name} (Copy)`,
            slug: `${site.slug}-copy-${Date.now().toString(36)}`,
            theme: site.theme as any,
            published: false,
            faviconEmoji: site.faviconEmoji,
          },
        });
        // Clone pages
        for (const page of site.pages) {
          await prisma.sitePage.create({
            data: {
              siteId: clonedSite.id,
              title: page.title,
              slug: page.slug,
              blocks: page.blocks as any,
              seoTitle: (page as any).seoTitle,
              seoDesc: (page as any).seoDesc,
              published: false,
            },
          });
        }
        newSiteId = clonedSite.id;
      }
    }

    // Clone the deployment record
    const cloned = await prisma.himalayaDeployment.create({
      data: {
        userId: user.id,
        analysisRunId: deployment.analysisRunId,
        siteId: newSiteId,
        campaignId: null, // campaigns can be cloned separately
        emailFlowId: null,
      },
    });

    return NextResponse.json({ ok: true, projectId: cloned.id });
  } catch (err) {
    console.error("Clone error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

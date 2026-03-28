import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import {
  buildSeoDescription,
  buildSeoTitle,
  buildSiteDescription,
  inferFaviconEmoji,
  needsLaunchBasics,
  normalizeCustomDomain,
} from "@/lib/site-builder/launchBasics";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const [site, profile] = await Promise.all([
      prisma.site.findFirst({
        where: { id, userId: user.id },
        include: {
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              seoTitle: true,
              seoDesc: true,
            },
          },
        },
      }),
      prisma.businessProfile.findUnique({
        where: { userId: user.id },
        select: { niche: true, location: true, mainGoal: true },
      }),
    ]);

    if (!site) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const basicsNeeded = needsLaunchBasics(site, site.pages);
    if (!basicsNeeded) {
      return NextResponse.json({
        ok: true,
        updatedSite: 0,
        updatedPages: 0,
        summary: "Launch basics were already in place.",
      });
    }

    const nextDescription = site.description?.trim() || buildSiteDescription(site, profile);
    const nextFavicon = site.faviconEmoji?.trim() || inferFaviconEmoji(site, profile);
    const nextDomain = normalizeCustomDomain(site.customDomain);

    let updatedSite = 0;
    let updatedPages = 0;

    await prisma.$transaction(async (tx) => {
      if (
        nextDescription !== (site.description ?? "") ||
        nextFavicon !== (site.faviconEmoji ?? "") ||
        nextDomain !== (site.customDomain ?? null)
      ) {
        await tx.site.update({
          where: { id: site.id },
          data: {
            description: nextDescription,
            faviconEmoji: nextFavicon,
            customDomain: nextDomain,
          },
        });
        updatedSite = 1;
      }

      for (const page of site.pages) {
        const nextSeoTitle = page.seoTitle?.trim() || buildSeoTitle(site, page, profile);
        const nextSeoDesc = page.seoDesc?.trim() || buildSeoDescription(site, page, profile);
        if (nextSeoTitle !== (page.seoTitle ?? "") || nextSeoDesc !== (page.seoDesc ?? "")) {
          await tx.sitePage.update({
            where: { id: page.id },
            data: {
              seoTitle: nextSeoTitle,
              seoDesc: nextSeoDesc,
            },
          });
          updatedPages += 1;
        }
      }
    });

    return NextResponse.json({
      ok: true,
      updatedSite,
      updatedPages,
      summary: updatedPages > 0
        ? `Updated launch basics on ${updatedPages} page${updatedPages === 1 ? "" : "s"} and refreshed site branding.`
        : "Refreshed site branding and launch settings.",
    });
  } catch (error) {
    console.error("Site launch basics:", error);
    return NextResponse.json({ ok: false, error: "Failed to apply launch basics" }, { status: 500 });
  }
}

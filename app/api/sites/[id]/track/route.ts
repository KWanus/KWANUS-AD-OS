import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sites/[id]/track
 * Public endpoint — no auth required.
 * Increments the view count for a published site.
 * Called by the client-side PublicSiteShell component.
 *
 * Body: { page?: string, referrer?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment views on the home page of the site
    const body = await req.json().catch(() => ({})) as { pageSlug?: string };
    const slug = body.pageSlug ?? "home";

    await prisma.sitePage.updateMany({
      where: { siteId: id, slug, published: true },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-fatal — tracking should never break the site
    return NextResponse.json({ ok: true });
  }
}

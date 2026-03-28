import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";

/**
 * POST /api/sites/[id]/track
 * Public endpoint — no auth required.
 * Increments the view count for a published site.
 * Called by the client-side PublicSiteShell component.
 *
 * Body: { pageSlug?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Rate limit by IP to prevent bot abuse
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limited = rateLimit(`track:${ip}`, RATE_LIMITS.publicEndpoint);
    if (limited) return limited;

    const body = await req.json().catch(() => ({})) as { pageSlug?: string };
    const slug = body.pageSlug ?? "home";

    // Only increment if the site + page actually exist and are published
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

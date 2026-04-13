import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/campaigns/[id]/organic — retrieve organic posts for a campaign */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { id } = await params;

    // Find organic content event for this campaign
    const event = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId: user.id,
        event: "organic_content_generated",
        metadata: { path: ["campaignId"], equals: id },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!event) return NextResponse.json({ ok: true, posts: [] });

    const meta = event.metadata as Record<string, unknown>;
    const posts = (meta.posts ?? []) as unknown[];

    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    console.error("Organic posts error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

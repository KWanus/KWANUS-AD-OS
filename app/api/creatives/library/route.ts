// ---------------------------------------------------------------------------
// GET /api/creatives/library
// Returns all AI-generated ad images across all campaigns
// For the creative library page
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const variations = await prisma.adVariation.findMany({
      where: {
        campaign: { userId: user.id },
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const creatives = variations
      .filter((v) => {
        const content = v.content as Record<string, unknown>;
        return typeof content.imageBase64 === "string" || typeof content.videoUrl === "string";
      })
      .map((v) => {
        const content = v.content as Record<string, unknown>;
        return {
          id: v.id,
          name: v.name,
          type: typeof content.videoUrl === "string" ? "video" : "image",
          platform: v.platform,
          status: v.status,
          campaignId: v.campaign.id,
          campaignName: v.campaign.name,
          imageBase64: typeof content.imageBase64 === "string" ? content.imageBase64 : null,
          videoUrl: typeof content.videoUrl === "string" ? content.videoUrl : null,
          model: (content.imageModel as string) ?? (content.videoModel as string) ?? null,
          hookText: typeof content.hook === "string" ? content.hook : null,
          createdAt: v.createdAt,
        };
      });

    return NextResponse.json({
      ok: true,
      creatives,
      total: creatives.length,
      images: creatives.filter((c) => c.type === "image").length,
      videos: creatives.filter((c) => c.type === "video").length,
    });
  } catch (err) {
    console.error("Creative library error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

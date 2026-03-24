import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/stats — user dashboard stats
 */
export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ ok: true, stats: null });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: true, stats: null });
    }

    const [campaignCount, variationCount, emailCount, activeCampaigns, winnerVariations] = await Promise.all([
      prisma.campaign.count({ where: { userId: user.id } }),
      prisma.adVariation.count({ where: { campaign: { userId: user.id } } }),
      prisma.emailDraft.count({ where: { campaign: { userId: user.id } } }),
      prisma.campaign.count({ where: { userId: user.id, status: { in: ["active", "testing", "scaling"] } } }),
      prisma.adVariation.count({ where: { campaign: { userId: user.id }, status: "winner" } }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        campaigns: campaignCount,
        variations: variationCount,
        emails: emailCount,
        activeCampaigns,
        winners: winnerVariations,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load stats" }, { status: 500 });
  }
}

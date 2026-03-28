import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

// POST /api/campaigns/[id]/variations — add a new variation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });

    const body = await req.json() as {
      name: string;
      type: string;
      content: object;
      platform?: string;
    };

    const count = await prisma.adVariation.count({ where: { campaignId: id } });

    const variation = await prisma.adVariation.create({
      data: {
        campaignId: id,
        name: body.name,
        type: body.type,
        content: body.content,
        platform: body.platform,
        status: "draft",
        sortOrder: count,
      },
    });

    return NextResponse.json({ ok: true, variation });
  } catch (err) {
    console.error("Variation POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to add variation" }, { status: 500 });
  }
}

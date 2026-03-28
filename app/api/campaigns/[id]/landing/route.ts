import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

// PATCH /api/campaigns/[id]/landing — update any landing draft field
export async function PATCH(
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
      headline?: string;
      subheadline?: string;
      trustBar?: string[];
      bullets?: string[];
      socialProof?: string;
      guarantee?: string;
      faqItems?: { question: string; answer: string }[];
      ctaCopy?: string;
      urgencyLine?: string;
      status?: string;
    };

    const landing = await prisma.landingDraft.upsert({
      where: { campaignId: id },
      update: {
        ...(body.headline !== undefined && { headline: body.headline }),
        ...(body.subheadline !== undefined && { subheadline: body.subheadline }),
        ...(body.trustBar !== undefined && { trustBar: body.trustBar as object }),
        ...(body.bullets !== undefined && { bullets: body.bullets as object }),
        ...(body.socialProof !== undefined && { socialProof: body.socialProof }),
        ...(body.guarantee !== undefined && { guarantee: body.guarantee }),
        ...(body.faqItems !== undefined && { faqItems: body.faqItems as object }),
        ...(body.ctaCopy !== undefined && { ctaCopy: body.ctaCopy }),
        ...(body.urgencyLine !== undefined && { urgencyLine: body.urgencyLine }),
        ...(body.status !== undefined && { status: body.status }),
      },
      create: {
        campaignId: id,
        headline: body.headline,
        subheadline: body.subheadline,
        trustBar: (body.trustBar as object) ?? [],
        bullets: (body.bullets as object) ?? [],
        socialProof: body.socialProof,
        guarantee: body.guarantee,
        faqItems: (body.faqItems as object) ?? [],
        ctaCopy: body.ctaCopy,
        urgencyLine: body.urgencyLine,
        status: body.status ?? "draft",
      },
    });

    return NextResponse.json({ ok: true, landing });
  } catch (err) {
    console.error("Landing PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update landing draft" }, { status: 500 });
  }
}

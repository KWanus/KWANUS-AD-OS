import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

// PATCH /api/campaigns/[id]/checklist/[cid] — toggle done or update text
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id, cid } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    const body = await req.json() as { done?: boolean; text?: string };

    const item = await prisma.checklistItem.update({
      where: { id: cid },
      data: {
        ...(body.done !== undefined && { done: body.done }),
        ...(body.text !== undefined && { text: body.text }),
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (err) {
    console.error("Checklist PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update checklist item" }, { status: 500 });
  }
}

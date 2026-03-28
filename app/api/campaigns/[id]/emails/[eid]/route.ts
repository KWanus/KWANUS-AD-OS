import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

// PATCH /api/campaigns/[id]/emails/[eid] — update email draft
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id, eid } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
    if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    const body = await req.json() as {
      subject?: string;
      preview?: string;
      body?: string;
      status?: string;
    };

    const email = await prisma.emailDraft.update({
      where: { id: eid },
      data: {
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.preview !== undefined && { preview: body.preview }),
        ...(body.body !== undefined && { body: body.body }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    console.error("Email PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update email" }, { status: 500 });
  }
}

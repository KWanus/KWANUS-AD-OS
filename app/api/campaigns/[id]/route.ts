import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

// GET /api/campaigns/[id] — full campaign with all assets
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        adVariations: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
        landingDraft: true,
        emailDrafts: { orderBy: [{ sequence: "asc" }, { position: "asc" }] },
        checklistItems: { orderBy: [{ day: "asc" }, { position: "asc" }] },
        analysisRun: {
          select: {
            inputUrl: true,
            title: true,
            verdict: true,
            score: true,
            confidence: true,
            summary: true,
            mode: true,
            decisionPacket: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, campaign });
  } catch (err) {
    console.error("Campaign GET error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, campaign: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to load campaign" }, { status: 500 });
  }
}

// PATCH /api/campaigns/[id] — update name, status, notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as { name?: string; status?: string; notes?: string };

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({ ok: true, campaign });
  } catch (err) {
    console.error("Campaign PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Campaign DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete campaign" }, { status: 500 });
  }
}

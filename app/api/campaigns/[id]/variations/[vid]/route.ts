import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/campaigns/[id]/variations/[vid] — update status, name, notes, content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  try {
    const { vid } = await params;
    const body = await req.json() as {
      status?: string;
      name?: string;
      notes?: string;
      content?: object;
      platform?: string;
      metrics?: object;
    };

    const variation = await prisma.adVariation.update({
      where: { id: vid },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.metrics !== undefined && { metrics: body.metrics }),
      },
    });

    return NextResponse.json({ ok: true, variation });
  } catch (err) {
    console.error("Variation PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update variation" }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id]/variations/[vid]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  try {
    const { vid } = await params;
    await prisma.adVariation.delete({ where: { id: vid } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Variation DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to delete variation" }, { status: 500 });
  }
}

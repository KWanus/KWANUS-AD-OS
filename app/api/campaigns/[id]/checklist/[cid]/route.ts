import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/campaigns/[id]/checklist/[cid] — toggle done or update text
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const { cid } = await params;
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

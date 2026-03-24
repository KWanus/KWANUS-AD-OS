import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      firstName?: string;
      lastName?: string;
      tags?: string[];
      properties?: object;
      status?: string;
    };
    const contact = await prisma.emailContact.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.properties !== undefined && { properties: body.properties }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
    return NextResponse.json({ ok: true, contact });
  } catch (err) {
    console.error("Contact PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.emailContact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flow = await prisma.emailFlow.findUnique({ where: { id } });
    if (!flow) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, flow });
  } catch (err) {
    console.error("EmailFlow GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, flow: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as {
      name?: string;
      trigger?: string;
      triggerConfig?: object;
      nodes?: object[];
      edges?: object[];
      status?: string;
      tags?: string[];
    };
    const flow = await prisma.emailFlow.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.trigger !== undefined && { trigger: body.trigger }),
        ...(body.triggerConfig !== undefined && { triggerConfig: body.triggerConfig }),
        ...(body.nodes !== undefined && { nodes: body.nodes }),
        ...(body.edges !== undefined && { edges: body.edges }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    });
    return NextResponse.json({ ok: true, flow });
  } catch (err) {
    console.error("EmailFlow PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.emailFlow.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("EmailFlow DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

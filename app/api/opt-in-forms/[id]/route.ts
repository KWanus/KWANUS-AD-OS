import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Public — needed for the embedded form page
  const { id } = await params;
  try {
    const form = await prisma.optInForm.findUnique({ where: { id } });
    if (!form || !form.active) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    // Increment views
    await prisma.optInForm.update({ where: { id }, data: { views: { increment: 1 } } });
    return NextResponse.json({
      ok: true,
      form: {
        id: form.id,
        headline: form.headline,
        subheadline: form.subheadline,
        buttonText: form.buttonText,
        redirectUrl: form.redirectUrl,
      },
    });
  } catch (err) {
    console.error("OptInForm GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name?: string;
      headline?: string;
      subheadline?: string;
      buttonText?: string;
      tags?: string[];
      redirectUrl?: string;
      active?: boolean;
    };

    await prisma.optInForm.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.headline !== undefined && { headline: body.headline || null }),
        ...(body.subheadline !== undefined && { subheadline: body.subheadline || null }),
        ...(body.buttonText !== undefined && { buttonText: body.buttonText || "Subscribe" }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.redirectUrl !== undefined && { redirectUrl: body.redirectUrl || null }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OptInForm PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await prisma.optInForm.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OptInForm DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

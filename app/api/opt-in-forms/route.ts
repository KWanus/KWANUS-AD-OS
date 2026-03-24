import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const forms = await prisma.optInForm.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ ok: true, forms });
  } catch (err) {
    console.error("OptInForms GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name: string;
      headline?: string;
      subheadline?: string;
      buttonText?: string;
      tags?: string[];
      redirectUrl?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });
    }

    const form = await prisma.optInForm.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        headline: body.headline?.trim() || null,
        subheadline: body.subheadline?.trim() || null,
        buttonText: body.buttonText?.trim() || "Subscribe",
        tags: body.tags ?? [],
        redirectUrl: body.redirectUrl?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, form });
  } catch (err) {
    console.error("OptInForms POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, forms });
  } catch (err) {
    console.error("Forms GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      name: string;
      headline?: string;
      subheadline?: string;
      buttonText?: string;
      tags?: string[];
      redirectUrl?: string;
    };

    if (!body.name) {
      return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
    }

    const form = await prisma.optInForm.create({
      data: {
        userId: user.id,
        name: body.name,
        headline: body.headline ?? "Join our list",
        subheadline: body.subheadline ?? "",
        buttonText: body.buttonText ?? "Subscribe",
        tags: body.tags ?? [],
        redirectUrl: body.redirectUrl ?? "",
      },
    });

    return NextResponse.json({ ok: true, form });
  } catch (err) {
    console.error("Forms POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

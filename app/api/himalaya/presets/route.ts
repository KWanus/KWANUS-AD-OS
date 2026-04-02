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

    const presets = await prisma.himalayaPreset.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({ ok: true, presets });
  } catch (err) {
    console.error("Presets GET:", err);
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
      name?: string;
      config?: Record<string, unknown>;
      isDefault?: boolean;
    };

    if (!body.name || !body.config) {
      return NextResponse.json({ ok: false, error: "name and config are required" }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.himalayaPreset.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.himalayaPreset.create({
      data: {
        userId: user.id,
        name: body.name,
        config: body.config as object,
        isDefault: body.isDefault ?? false,
      },
    });

    return NextResponse.json({ ok: true, preset });
  } catch (err) {
    console.error("Presets POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

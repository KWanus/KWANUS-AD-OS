import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/user/credits/spend
 * Deduct credits and log the transaction.
 * Used by internal services (skills, AI generation) to properly track usage.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      amount: number;
      action: string;
      detail?: string;
    };

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be positive" }, { status: 400 });
    }

    if (!body.action) {
      return NextResponse.json({ ok: false, error: "Action is required" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    if (!currentUser || currentUser.credits < body.amount) {
      return NextResponse.json({
        ok: false,
        error: "Insufficient credits",
        required: body.amount,
        available: currentUser?.credits ?? 0,
      }, { status: 402 });
    }

    const newBalance = currentUser.credits - body.amount;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { credits: newBalance },
      }),
      prisma.creditLog.create({
        data: {
          userId: user.id,
          amount: -body.amount,
          balance: newBalance,
          action: body.action,
          detail: body.detail ?? null,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      spent: body.amount,
      remaining: newBalance,
    });
  } catch (err) {
    console.error("Credit spend error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/user/profile
 * Returns the current user's profile info, credits, and plan.
 * Lightweight endpoint for auth checks and profile display.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        plan: true,
        planExpiresAt: true,
        workspaceName: true,
        businessType: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        ...fullUser,
        isPro: fullUser.plan === "pro" || fullUser.plan === "elite",
        hasCredits: fullUser.credits > 0,
      },
    });
  } catch (err) {
    console.error("User profile error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

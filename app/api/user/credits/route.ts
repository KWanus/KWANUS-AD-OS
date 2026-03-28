import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const user = await getOrCreateUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        return NextResponse.json({
            ok: true,
            credits: user.credits,
            plan: user.plan,
            planExpiresAt: user.planExpiresAt,
        });
    } catch (err) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}

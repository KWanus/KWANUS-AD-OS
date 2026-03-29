import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getOrCreateUser();
        if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        return NextResponse.json({
            ok: true,
            credits: user.credits,
            plan: user.plan,
            planExpiresAt: user.planExpiresAt,
        });
    } catch (err) {
        console.error("Credits GET:", err);
        return NextResponse.json({ ok: false, error: "Failed to fetch credits" }, { status: 500 });
    }
}

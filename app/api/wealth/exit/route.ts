import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { calculateExitReadiness } from "@/lib/wealth/exitReadiness";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const valuation = await calculateExitReadiness(user.id);
    return NextResponse.json({ ok: true, valuation });
  } catch (err) {
    console.error("Exit readiness error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

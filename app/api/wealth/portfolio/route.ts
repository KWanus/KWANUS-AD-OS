import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getPortfolio } from "@/lib/wealth/portfolioManager";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const portfolio = await getPortfolio(user.id);
    return NextResponse.json({ ok: true, portfolio });
  } catch (err) {
    console.error("Portfolio error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

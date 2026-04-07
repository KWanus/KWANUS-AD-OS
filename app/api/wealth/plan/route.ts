import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateWealthPlan } from "@/lib/wealth/wealthEngine";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plan = await generateWealthPlan(user.id);
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("Wealth plan error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

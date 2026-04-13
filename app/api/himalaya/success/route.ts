import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getSuccessDashboard } from "@/lib/himalaya/engagementEngine";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const dashboard = await getSuccessDashboard(user.id);
    return NextResponse.json({ ok: true, ...dashboard });
  } catch (err) {
    console.error("Success dashboard error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

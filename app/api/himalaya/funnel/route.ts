import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { detectFunnelLeaks } from "@/lib/himalaya/intelligenceSystems";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const leaks = await detectFunnelLeaks(user.id);
    return NextResponse.json({ ok: true, ...leaks });
  } catch (err) {
    console.error("Funnel error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

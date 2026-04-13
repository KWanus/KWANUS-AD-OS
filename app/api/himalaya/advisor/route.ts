import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getStrategicAdvice } from "@/lib/himalaya/intelligenceSystems";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const advice = await getStrategicAdvice(user.id);
    return NextResponse.json({ ok: true, ...advice });
  } catch (err) {
    console.error("Advisor error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

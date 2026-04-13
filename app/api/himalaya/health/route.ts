import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { runHealthCheck } from "@/lib/himalaya/operationsEngine";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const health = await runHealthCheck(user.id);
    return NextResponse.json({ ok: true, ...health });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json({ ok: false, overall: "critical", checks: [], lastChecked: new Date().toISOString() });
  }
}

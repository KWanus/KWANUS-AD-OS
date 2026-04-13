import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getActivityLog } from "@/lib/himalaya/operationsEngine";
import { getRecentErrors } from "@/lib/himalaya/operationsEngine";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const [activity, errors] = await Promise.all([
      getActivityLog(user.id, 30),
      getRecentErrors(user.id),
    ]);

    return NextResponse.json({ ok: true, activity, errors: errors.errors, systemHealthy: errors.systemHealthy });
  } catch (err) {
    console.error("Activity error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

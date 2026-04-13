import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { scoreBusinessMaturity } from "@/lib/himalaya/intelligenceSystems";
import { analyzeWinsAndLosses } from "@/lib/himalaya/intelligenceSystems";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const [maturity, insights] = await Promise.all([
      scoreBusinessMaturity(user.id),
      analyzeWinsAndLosses(user.id),
    ]);
    return NextResponse.json({ ok: true, maturity, insights });
  } catch (err) {
    console.error("Maturity error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

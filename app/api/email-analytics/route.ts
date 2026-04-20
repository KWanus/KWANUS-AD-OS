import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { analyzeContact, analyzeAllContacts, getAudienceInsights } from "@/lib/email/predictiveAnalytics";

/** GET — get audience insights or single contact analysis */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const email = req.nextUrl.searchParams.get("email");

    if (email) {
      const analysis = await analyzeContact(user.id, email);
      return NextResponse.json({ ok: true, analysis });
    }

    const insights = await getAudienceInsights(user.id);
    return NextResponse.json({ ok: true, insights });
  } catch (err) {
    console.error("Email analytics error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — trigger batch analysis for all contacts */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const result = await analyzeAllContacts(user.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Batch analysis error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

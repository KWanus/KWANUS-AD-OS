import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { scoreAllLeads, getHotLeads } from "@/lib/crm/leadScoring";

/** POST — Score all leads for a user */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const scores = await scoreAllLeads(user.id);
    return NextResponse.json({ ok: true, scores });
  } catch (err) {
    console.error("Lead scoring error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** GET — Get hot leads */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "10", 10);
    const hotLeads = await getHotLeads(user.id, limit);

    return NextResponse.json({ ok: true, hotLeads });
  } catch (err) {
    console.error("Hot leads error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

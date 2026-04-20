import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { evaluateSegment, countSegment, previewSegment, getSmartSegment, listSmartSegments } from "@/lib/email/advancedSegmentation";
import type { SmartSegmentName } from "@/lib/email/advancedSegmentation";

/** GET — list smart segments or preview a segment */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const smart = req.nextUrl.searchParams.get("smart");

    if (smart) {
      const result = await getSmartSegment(user.id, smart as SmartSegmentName);
      return NextResponse.json({ ok: true, segment: smart, ...result });
    }

    const segments = listSmartSegments();
    return NextResponse.json({ ok: true, segments });
  } catch (err) {
    console.error("Segment error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — evaluate custom segment rules */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { rules, action, limit } = await req.json();

    if (action === "count") {
      const count = await countSegment(user.id, rules);
      return NextResponse.json({ ok: true, count });
    }

    if (action === "preview") {
      const result = await previewSegment(user.id, rules, limit ?? 20);
      return NextResponse.json({ ok: true, ...result });
    }

    const contactIds = await evaluateSegment(user.id, rules);
    return NextResponse.json({ ok: true, contactIds, count: contactIds.length });
  } catch (err) {
    console.error("Segment eval error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

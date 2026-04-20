import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getAttributionReport, getFlowRevenue, getEmailROI, getRevenueByChannel, getRevenueTimeline } from "@/lib/email/revenueAttribution";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: true, error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action");

    if (action === "flow") {
      const flowId = req.nextUrl.searchParams.get("flowId");
      if (!flowId) return NextResponse.json({ ok: false, error: "flowId required" }, { status: 400 });
      const result = await getFlowRevenue(flowId);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "roi") {
      const result = await getEmailROI(user.id);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "channels") {
      const result = await getRevenueByChannel(user.id);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "timeline") {
      const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
      const result = await getRevenueTimeline(user.id, days);
      return NextResponse.json({ ok: true, timeline: result });
    }

    // Default: full report
    const report = await getAttributionReport(user.id);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("Revenue error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

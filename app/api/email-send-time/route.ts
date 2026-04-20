import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getOptimalSendTime, getCohortSendTimes, getSmartSchedulePreview, getEngagementHeatmap, getBestWorstTimes, analyzeSendTimePerformance } from "@/lib/email/sendTimeOptimization";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action");

    if (action === "optimal") {
      const email = req.nextUrl.searchParams.get("email");
      if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
      const result = await getOptimalSendTime(user.id, email);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "cohort") {
      const result = await getCohortSendTimes(user.id);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "heatmap") {
      const heatmap = await getEngagementHeatmap(user.id);
      return NextResponse.json({ ok: true, heatmap });
    }

    if (action === "best_worst") {
      const result = await getBestWorstTimes(user.id);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "performance") {
      const result = await analyzeSendTimePerformance(user.id);
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "preview") {
      const preview = await getSmartSchedulePreview(user.id);
      return NextResponse.json({ ok: true, ...preview });
    }

    // Default: cohort analysis
    const result = await getCohortSendTimes(user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Send time error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

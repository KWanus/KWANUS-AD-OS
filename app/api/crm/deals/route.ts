import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createDeal, listDeals, updateDealStage, getPipelineSummary, logActivity, getClientTimeline } from "@/lib/crm/dealTracker";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action");

    if (action === "pipeline") {
      const summary = await getPipelineSummary(user.id);
      return NextResponse.json({ ok: true, ...summary });
    }

    if (action === "timeline") {
      const clientId = req.nextUrl.searchParams.get("clientId");
      if (!clientId) return NextResponse.json({ ok: false, error: "clientId required" }, { status: 400 });
      const timeline = await getClientTimeline(user.id, clientId);
      return NextResponse.json({ ok: true, timeline });
    }

    const deals = await listDeals(user.id);
    return NextResponse.json({ ok: true, deals });
  } catch (err) {
    console.error("CRM deals error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.action === "create") {
      const deal = await createDeal(user.id, body);
      return NextResponse.json({ ok: true, deal });
    }

    if (body.action === "update_stage") {
      await updateDealStage(body.dealId, body.stage);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "log_activity") {
      await logActivity(user.id, body);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("CRM deals error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createABTest, listABTests, getTestResults, startABTest, selectWinner, sendToRemainder, recordEvent } from "@/lib/email/abTesting";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const testId = req.nextUrl.searchParams.get("id");
    if (testId) {
      const results = await getTestResults(testId);
      return NextResponse.json({ ok: true, ...results });
    }

    const tests = await listABTests(user.id);
    return NextResponse.json({ ok: true, tests });
  } catch (err) {
    console.error("AB test error:", err);
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
    const { action } = body;

    if (action === "create") {
      const test = await createABTest(user.id, body.config);
      return NextResponse.json({ ok: true, test });
    }
    if (action === "start") {
      const result = await startABTest(body.testId);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "select_winner") {
      await selectWinner(body.testId, body.variantId);
      return NextResponse.json({ ok: true });
    }
    if (action === "send_remainder") {
      const result = await sendToRemainder(body.testId);
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "record") {
      await recordEvent(body.testId, body.variantId, body.event, body.revenue);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("AB test error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

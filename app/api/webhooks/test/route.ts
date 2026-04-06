// ---------------------------------------------------------------------------
// POST /api/webhooks/test — proxy webhook test to user's URL
// Prevents CORS issues by sending from server side
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { url: string; payload: unknown };
    if (!body.url) return NextResponse.json({ ok: false, error: "URL required" }, { status: 400 });

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000);

    const res = await fetch(body.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-source": "himalaya-test",
      },
      body: JSON.stringify(body.payload),
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      body: text.slice(0, 1000),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Request failed",
    });
  }
}

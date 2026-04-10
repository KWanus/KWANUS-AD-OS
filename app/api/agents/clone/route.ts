import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cloneBusiness } from "@/lib/agents/businessCloner";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { url: string };
    if (!body.url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });

    const analysis = await cloneBusiness(body.url);
    if (!analysis) return NextResponse.json({ ok: false, error: "Could not analyze that URL" }, { status: 400 });

    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    console.error("Clone error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/compliance/delete-data — GDPR data deletion request
// Removes all contact data for an email address
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { processDataDeletion } from "@/lib/compliance/gdprManager";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { email: string };
    if (!body.email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });

    const result = await processDataDeletion({ email: body.email, userId: user.id });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Data deletion error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

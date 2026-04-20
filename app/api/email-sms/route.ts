import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { sendUnified, getContactChannels, getSmsUsage } from "@/lib/email/smsEngine";
import type { MessageChannel } from "@/lib/email/smsEngine";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const action = req.nextUrl.searchParams.get("action");

    if (action === "channels") {
      const email = req.nextUrl.searchParams.get("email");
      if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
      const channels = await getContactChannels(user.id, email);
      return NextResponse.json({ ok: true, channels });
    }

    if (action === "usage") {
      const usage = await getSmsUsage(user.id);
      return NextResponse.json({ ok: true, usage });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("SMS error:", err);
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
    const result = await sendUnified(user.id, {
      channels: (body.channels ?? ["email"]) as MessageChannel[],
      to: body.to,
      subject: body.subject,
      body: body.body,
      htmlBody: body.htmlBody,
      url: body.url,
      priority: body.priority ?? "normal",
    });

    return NextResponse.json({ ok: true, results: result });
  } catch (err) {
    console.error("Send unified error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

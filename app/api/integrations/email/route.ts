import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailAuthUrl, disconnectGmail } from "@/lib/integrations/email/gmailOAuth";

/** GET — Get email integration status */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const integration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
      select: {
        provider: true,
        email: true,
        connected: true,
        dailyLimit: true,
        sentToday: true,
        lastResetAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      integration: integration ?? null,
    });
  } catch (err) {
    console.error("Email integration GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — Connect email integration or disconnect */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { action: "connect" | "disconnect"; provider: "gmail" | "outlook" };
    const { action, provider } = body;

    if (action === "disconnect") {
      await disconnectGmail(user.id);
      return NextResponse.json({ ok: true });
    }

    if (action === "connect" && provider === "gmail") {
      const authUrl = getGmailAuthUrl(user.id);
      return NextResponse.json({ ok: true, authUrl });
    }

    return NextResponse.json({ ok: false, error: "Invalid action or provider" }, { status: 400 });
  } catch (err) {
    console.error("Email integration POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

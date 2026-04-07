// ---------------------------------------------------------------------------
// GET /api/oauth/status — check which platforms are connected
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getConnectedProviders, type OAuthProvider } from "@/lib/integrations/oauth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const connected = await getConnectedProviders(user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

    const platforms: Record<OAuthProvider, { connected: boolean; connectUrl: string }> = {
      meta: {
        connected: connected.includes("meta"),
        connectUrl: `${appUrl}/api/oauth/connect?provider=meta`,
      },
      google: {
        connected: connected.includes("google"),
        connectUrl: `${appUrl}/api/oauth/connect?provider=google`,
      },
      tiktok: {
        connected: connected.includes("tiktok"),
        connectUrl: `${appUrl}/api/oauth/connect?provider=tiktok`,
      },
    };

    return NextResponse.json({ ok: true, platforms });
  } catch (err) {
    console.error("OAuth status error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

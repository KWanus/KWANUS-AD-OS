// ---------------------------------------------------------------------------
// GET /api/oauth/callback — handles OAuth redirect from platforms
// Exchanges code for tokens, stores encrypted, redirects to settings
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, saveTokens, type OAuthProvider } from "@/lib/integrations/oauth";
import { createNotification } from "@/lib/notifications/notify";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const stateParam = req.nextUrl.searchParams.get("state");

    if (!code || !stateParam) {
      return NextResponse.redirect(new URL("/settings?oauth=error&reason=no_code", req.url));
    }

    // Decode state
    let state: { provider: OAuthProvider; userId: string; ts: number };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    } catch {
      return NextResponse.redirect(new URL("/settings?oauth=error&reason=invalid_state", req.url));
    }

    // Validate state is recent (within 10 minutes)
    if (Date.now() - state.ts > 10 * 60 * 1000) {
      return NextResponse.redirect(new URL("/settings?oauth=error&reason=expired", req.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(state.provider, code);
    if (!tokens) {
      return NextResponse.redirect(new URL(`/settings?oauth=error&reason=token_exchange_failed&provider=${state.provider}`, req.url));
    }

    // Save tokens encrypted
    await saveTokens(state.userId, tokens);

    // Notify user
    createNotification({
      userId: state.userId,
      type: "system",
      title: `${state.provider.charAt(0).toUpperCase() + state.provider.slice(1)} connected`,
      body: "Ad platform connected successfully. You can now pull metrics and push campaigns.",
      href: "/settings",
    }).catch(() => {});

    return NextResponse.redirect(new URL(`/settings?oauth=success&provider=${state.provider}`, req.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/settings?oauth=error&reason=unknown", req.url));
  }
}

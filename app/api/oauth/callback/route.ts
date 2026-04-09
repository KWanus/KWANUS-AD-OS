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

    // Extract ad account IDs from the platform
    try {
      const { prisma } = await import("@/lib/prisma");

      if (state.provider === "meta") {
        // Fetch Meta ad accounts
        const acctRes = await fetch(`https://graph.facebook.com/v25.0/me/adaccounts?fields=account_id,name&access_token=${tokens.accessToken}`);
        if (acctRes.ok) {
          const acctData = await acctRes.json();
          const firstAccount = acctData?.data?.[0];
          if (firstAccount?.account_id) {
            await prisma.user.update({
              where: { id: state.userId },
              data: { metaPixelId: firstAccount.account_id.replace("act_", "") },
            });
          }
        }
      }

      if (state.provider === "google") {
        // Google Ads customer ID comes from the ads API
        // For now, prompt user to enter it in settings
        // Full extraction requires Google Ads API developer token
      }

      if (state.provider === "tiktok") {
        // Fetch TikTok advertiser accounts
        const acctRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/", {
          headers: { "Access-Token": tokens.accessToken },
        });
        if (acctRes.ok) {
          const acctData = await acctRes.json();
          const firstAdvertiser = acctData?.data?.list?.[0];
          if (firstAdvertiser?.advertiser_id) {
            await prisma.user.update({
              where: { id: state.userId },
              data: { tiktokPixelId: String(firstAdvertiser.advertiser_id) },
            });
          }
        }
      }
    } catch {
      // Ad account extraction is non-blocking — user can still set manually
    }

    // Notify user
    createNotification({
      userId: state.userId,
      type: "system",
      title: `${state.provider.charAt(0).toUpperCase() + state.provider.slice(1)} connected`,
      body: "Ad platform connected. Account IDs extracted automatically. You can now push campaigns and pull metrics.",
      href: "/settings",
    }).catch(() => {});

    return NextResponse.redirect(new URL(`/settings?oauth=success&provider=${state.provider}`, req.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/settings?oauth=error&reason=unknown", req.url));
  }
}

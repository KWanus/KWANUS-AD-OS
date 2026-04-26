// ---------------------------------------------------------------------------
// Meta OAuth Callback — handle OAuth flow for Facebook/Instagram Ads
// GET /api/oauth/meta/callback?code=xxx&state=xxx
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { encryptToken } from "@/lib/oauth/encryption";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const code = req.nextUrl.searchParams.get("code");
    const error = req.nextUrl.searchParams.get("error");
    const errorReason = req.nextUrl.searchParams.get("error_reason");

    if (error || !code) {
      console.error("[Meta OAuth] Error:", error, errorReason);
      return NextResponse.redirect(
        new URL(`/ads?error=oauth_failed&reason=${errorReason || error}`, req.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://graph.facebook.com/v21.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json() as { error?: { message?: string } };
      console.error("[Meta OAuth] Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL(`/ads?error=token_exchange_failed&details=${errorData.error?.message || "unknown"}`, req.url)
      );
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      token_type: string;
      expires_in?: number;
    };

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name&access_token=${tokenData.access_token}`
    );

    if (!accountsResponse.ok) {
      console.error("[Meta OAuth] Failed to fetch ad accounts");
      return NextResponse.redirect(
        new URL("/ads?error=account_fetch_failed", req.url)
      );
    }

    const accountsData = await accountsResponse.json() as {
      data?: Array<{
        id: string;
        name: string;
        account_id: string;
        account_status: number;
        currency: string;
        timezone_name: string;
      }>;
    };

    const adAccounts = accountsData.data || [];

    if (adAccounts.length === 0) {
      return NextResponse.redirect(
        new URL("/ads?error=no_ad_accounts", req.url)
      );
    }

    // Encrypt and store the access token
    const encryptedToken = encryptToken(tokenData.access_token);
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days default

    // Store primary ad account connection
    const primaryAccount = adAccounts[0];

    await prisma.adPlatformConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "meta",
        },
      },
      create: {
        userId,
        platform: "meta",
        accessToken: encryptedToken,
        refreshToken: null,
        expiresAt,
        accountId: primaryAccount.account_id,
        accountName: primaryAccount.name,
        metadata: {
          adAccounts: adAccounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            account_id: acc.account_id,
            account_status: acc.account_status,
            currency: acc.currency,
            timezone_name: acc.timezone_name,
          })),
        },
      },
      update: {
        accessToken: encryptedToken,
        expiresAt,
        accountId: primaryAccount.account_id,
        accountName: primaryAccount.name,
        metadata: {
          adAccounts: adAccounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            account_id: acc.account_id,
            account_status: acc.account_status,
            currency: acc.currency,
            timezone_name: acc.timezone_name,
          })),
        },
        connectedAt: new Date(),
      },
    });

    console.log(`[Meta OAuth] Successfully connected ${adAccounts.length} ad account(s) for user ${userId}`);

    return NextResponse.redirect(
      new URL("/ads?success=meta_connected", req.url)
    );
  } catch (err) {
    console.error("[Meta OAuth] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/ads?error=unexpected_error", req.url)
    );
  }
}

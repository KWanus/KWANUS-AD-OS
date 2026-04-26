// ---------------------------------------------------------------------------
// TikTok OAuth Callback — handle OAuth flow for TikTok Ads
// GET /api/oauth/tiktok/callback?auth_code=xxx
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

    const authCode = req.nextUrl.searchParams.get("auth_code");
    const error = req.nextUrl.searchParams.get("error");

    if (error || !authCode) {
      console.error("[TikTok OAuth] Error:", error);
      return NextResponse.redirect(
        new URL(`/ads?error=oauth_failed&reason=${error}`, req.url)
      );
    }

    // Exchange auth code for access token
    const tokenResponse = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: process.env.TIKTOK_APP_ID,
        secret: process.env.TIKTOK_APP_SECRET,
        auth_code: authCode,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("[TikTok OAuth] Token exchange failed");
      return NextResponse.redirect(
        new URL("/ads?error=token_exchange_failed", req.url)
      );
    }

    const tokenData = await tokenResponse.json() as {
      code?: number;
      message?: string;
      data?: {
        access_token: string;
        advertiser_ids: string[];
      };
    };

    if (tokenData.code !== 0 || !tokenData.data) {
      console.error("[TikTok OAuth] Token exchange error:", tokenData.message);
      return NextResponse.redirect(
        new URL(`/ads?error=token_exchange_failed&details=${tokenData.message}`, req.url)
      );
    }

    const { access_token, advertiser_ids } = tokenData.data;

    if (advertiser_ids.length === 0) {
      return NextResponse.redirect(
        new URL("/ads?error=no_tiktok_advertisers", req.url)
      );
    }

    // Encrypt and store the access token
    const encryptedToken = encryptToken(access_token);
    const primaryAdvertiserId = advertiser_ids[0];

    await prisma.adPlatformConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "tiktok",
        },
      },
      create: {
        userId,
        platform: "tiktok",
        accessToken: encryptedToken,
        refreshToken: null,
        expiresAt: null, // TikTok tokens don't expire by default
        accountId: primaryAdvertiserId,
        accountName: `TikTok Ads (${primaryAdvertiserId})`,
        metadata: {
          advertiserIds: advertiser_ids,
        },
      },
      update: {
        accessToken: encryptedToken,
        accountId: primaryAdvertiserId,
        accountName: `TikTok Ads (${primaryAdvertiserId})`,
        metadata: {
          advertiserIds: advertiser_ids,
        },
        connectedAt: new Date(),
      },
    });

    console.log(`[TikTok OAuth] Successfully connected ${advertiser_ids.length} advertiser(s) for user ${userId}`);

    return NextResponse.redirect(
      new URL("/ads?success=tiktok_connected", req.url)
    );
  } catch (err) {
    console.error("[TikTok OAuth] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/ads?error=unexpected_error", req.url)
    );
  }
}

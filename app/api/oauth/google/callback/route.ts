// ---------------------------------------------------------------------------
// Google OAuth Callback — handle OAuth flow for Google Ads
// GET /api/oauth/google/callback?code=xxx&state=xxx
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

    if (error || !code) {
      console.error("[Google OAuth] Error:", error);
      return NextResponse.redirect(
        new URL(`/ads?error=oauth_failed&reason=${error}`, req.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json() as { error?: string; error_description?: string };
      console.error("[Google OAuth] Token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL(`/ads?error=token_exchange_failed&details=${errorData.error_description || "unknown"}`, req.url)
      );
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
    };

    // Get user's Google Ads customer ID
    const customerResponse = await fetch(
      "https://googleads.googleapis.com/v18/customers:listAccessibleCustomers",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        },
      }
    );

    if (!customerResponse.ok) {
      console.error("[Google OAuth] Failed to fetch customers");
      return NextResponse.redirect(
        new URL("/ads?error=customer_fetch_failed", req.url)
      );
    }

    const customerData = await customerResponse.json() as {
      resourceNames?: string[];
    };

    const customers = customerData.resourceNames || [];

    if (customers.length === 0) {
      return NextResponse.redirect(
        new URL("/ads?error=no_google_ads_accounts", req.url)
      );
    }

    // Extract customer ID from resource name (customers/1234567890)
    const primaryCustomerId = customers[0].split("/")[1];

    // Encrypt and store the access token
    const encryptedToken = encryptToken(tokenData.access_token);
    const encryptedRefreshToken = tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null;
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await prisma.adPlatformConnection.upsert({
      where: {
        userId_platform: {
          userId,
          platform: "google",
        },
      },
      create: {
        userId,
        platform: "google",
        accessToken: encryptedToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        accountId: primaryCustomerId,
        accountName: `Google Ads (${primaryCustomerId})`,
        metadata: {
          customerIds: customers.map(c => c.split("/")[1]),
        },
      },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        accountId: primaryCustomerId,
        accountName: `Google Ads (${primaryCustomerId})`,
        metadata: {
          customerIds: customers.map(c => c.split("/")[1]),
        },
        connectedAt: new Date(),
      },
    });

    console.log(`[Google OAuth] Successfully connected ${customers.length} customer account(s) for user ${userId}`);

    return NextResponse.redirect(
      new URL("/ads?success=google_connected", req.url)
    );
  } catch (err) {
    console.error("[Google OAuth] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/ads?error=unexpected_error", req.url)
    );
  }
}

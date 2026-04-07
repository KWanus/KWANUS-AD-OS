// ---------------------------------------------------------------------------
// GET /api/oauth/connect?provider=meta|google|tiktok
// Generates OAuth URL and redirects user to platform authorization
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateAuthUrl, type OAuthProvider } from "@/lib/integrations/oauth";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.redirect(new URL("/sign-in", req.url));
    const user = await getOrCreateUser();
    if (!user) return NextResponse.redirect(new URL("/sign-in", req.url));

    const provider = req.nextUrl.searchParams.get("provider") as OAuthProvider | null;
    if (!provider || !["meta", "google", "tiktok"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const authUrl = generateAuthUrl(provider, user.id);
    if (!authUrl) {
      return NextResponse.json({
        error: `${provider} OAuth not configured. Set ${provider.toUpperCase()}_APP_ID and ${provider.toUpperCase()}_APP_SECRET in environment variables.`,
      }, { status: 400 });
    }

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("OAuth connect error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

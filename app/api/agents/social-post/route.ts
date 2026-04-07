import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getTokens } from "@/lib/integrations/oauth";
import { publishPost, type PostRequest } from "@/lib/agents/socialPostingAgent";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as PostRequest & { platformConfig?: Record<string, string> };

    // Get OAuth token for the platform
    const provider = body.platform === "twitter" ? "meta" : // Map to OAuth provider
      body.platform === "instagram" ? "meta" :
      body.platform === "facebook" ? "meta" :
      body.platform === "linkedin" ? "google" : // LinkedIn would need its own OAuth
      body.platform === "tiktok" ? "tiktok" : "meta";

    const tokens = await getTokens(user.id, provider);
    if (!tokens) {
      return NextResponse.json({
        ok: false,
        error: `${body.platform} not connected. Go to Settings → connect your ${body.platform} account.`,
      }, { status: 400 });
    }

    const result = await publishPost({
      ...body,
      accessToken: tokens.accessToken,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Social post error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

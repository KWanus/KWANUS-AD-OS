import { NextRequest, NextResponse } from "next/server";

/** GET — Handle Gmail OAuth callback */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=${error}`, req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/settings?error=missing_params", req.url));
    }

    const { handleGmailCallback } = await import("@/lib/integrations/email/gmailOAuth");
    const success = await handleGmailCallback(code, state);

    if (success) {
      return NextResponse.redirect(new URL("/settings?gmail=connected", req.url));
    } else {
      return NextResponse.redirect(new URL("/settings?error=connection_failed", req.url));
    }
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return NextResponse.redirect(new URL("/settings?error=server_error", req.url));
  }
}

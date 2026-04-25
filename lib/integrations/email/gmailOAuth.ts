// ---------------------------------------------------------------------------
// Gmail OAuth Integration — Connect user's Gmail for outreach
//
// This allows users to:
// 1. Send cold emails through their own Gmail account
// 2. Track opens, clicks, and replies
// 3. Auto-sync conversations to CRM
// 4. Comply with sending limits (500/day for free, 2,000/day for Workspace)
//
// Uses Google OAuth 2.0 with offline access for refresh tokens.
// ---------------------------------------------------------------------------

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",        // Send emails
  "https://www.googleapis.com/auth/gmail.readonly",    // Read emails (for tracking replies)
  "https://www.googleapis.com/auth/gmail.modify",      // Modify labels (for tracking)
];

/** Initialize OAuth2 client */
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/gmail/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Gmail OAuth not configured. Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to .env");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Generate Gmail authorization URL */
export function getGmailAuthUrl(userId: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: userId, // Pass userId to identify the user in callback
    prompt: "consent", // Force consent screen to always get refresh token
  });
}

/** Exchange authorization code for tokens and store them */
export async function handleGmailCallback(code: string, userId: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Gmail OAuth: Missing tokens");
      return false;
    }

    // Get user email from Gmail API
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profile.data.emailAddress;

    // Store tokens in database
    await prisma.emailIntegration.upsert({
      where: { userId },
      update: {
        provider: "gmail",
        email: emailAddress ?? "",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        connected: true,
      },
      create: {
        userId,
        provider: "gmail",
        email: emailAddress ?? "",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        connected: true,
      },
    });

    return true;
  } catch (err) {
    console.error("Gmail OAuth callback error:", err);
    return false;
  }
}

/** Get authenticated Gmail client for a user */
export async function getGmailClient(userId: string) {
  const integration = await prisma.emailIntegration.findUnique({
    where: { userId },
  });

  if (!integration || integration.provider !== "gmail" || !integration.connected) {
    throw new Error("Gmail not connected. Connect your Gmail account first.");
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  // Auto-refresh if expired
  if (integration.expiresAt && integration.expiresAt < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.emailIntegration.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token ?? integration.accessToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : integration.expiresAt,
      },
    });
    oauth2Client.setCredentials(credentials);
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/** Send email via Gmail */
export async function sendGmailEmail(params: {
  userId: string;
  to: string;
  subject: string;
  body: string;
  trackingId?: string;
}): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = await getGmailClient(params.userId);

    // Build email (RFC 2822 format)
    const email = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      params.body,
    ].join("\r\n");

    // Add tracking pixel if trackingId provided
    let finalBody = params.body;
    if (params.trackingId) {
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/email/open/${params.trackingId}" width="1" height="1" />`;
      finalBody = params.body + trackingPixel;
    }

    const finalEmail = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      finalBody,
    ].join("\r\n");

    // Encode as base64url
    const encodedEmail = Buffer.from(finalEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return { ok: true, messageId: result.data.id ?? undefined };
  } catch (err) {
    console.error("Send Gmail error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Check for new replies (for tracking) */
export async function checkGmailReplies(userId: string, sinceTimestamp: number): Promise<{
  ok: boolean;
  replies: Array<{ messageId: string; threadId: string; from: string; snippet: string; timestamp: number }>;
}> {
  try {
    const gmail = await getGmailClient(userId);

    // Query for recent messages
    const response = await gmail.users.messages.list({
      userId: "me",
      q: `after:${Math.floor(sinceTimestamp / 1000)} is:inbox`,
      maxResults: 50,
    });

    const messages = response.data.messages ?? [];
    const replies = [];

    for (const msg of messages) {
      const details = await gmail.users.messages.get({
        userId: "me",
        id: msg.id ?? "",
      });

      const headers = details.data.payload?.headers ?? [];
      const fromHeader = headers.find(h => h.name?.toLowerCase() === "from");
      const from = fromHeader?.value ?? "unknown";

      replies.push({
        messageId: msg.id ?? "",
        threadId: msg.threadId ?? "",
        from,
        snippet: details.data.snippet ?? "",
        timestamp: parseInt(details.data.internalDate ?? "0", 10),
      });
    }

    return { ok: true, replies };
  } catch (err) {
    console.error("Check Gmail replies error:", err);
    return { ok: false, replies: [] };
  }
}

/** Disconnect Gmail */
export async function disconnectGmail(userId: string): Promise<void> {
  await prisma.emailIntegration.update({
    where: { userId },
    data: { connected: false },
  });
}

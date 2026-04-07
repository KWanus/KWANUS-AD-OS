// ---------------------------------------------------------------------------
// OAuth Manager — handles OAuth flows for Meta, Google, TikTok
// Generates auth URLs, exchanges codes for tokens, refreshes tokens
// Tokens stored encrypted in user settings
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ── Types ────────────────────────────────────────────────────────────────

export type OAuthProvider = "meta" | "google" | "tiktok";

export type OAuthConfig = {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
};

export type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  scope: string;
  provider: OAuthProvider;
};

// ── Provider Configs ─────────────────────────────────────────────────────

function getProviderConfig(provider: OAuthProvider): OAuthConfig | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
  const redirectUri = `${appUrl}/api/oauth/callback`;

  switch (provider) {
    case "meta":
      return {
        provider: "meta",
        clientId: process.env.META_APP_ID ?? "",
        clientSecret: process.env.META_APP_SECRET ?? "",
        redirectUri,
        scopes: ["ads_management", "ads_read", "pages_read_engagement", "business_management"],
        authUrl: "https://www.facebook.com/v25.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v25.0/oauth/access_token",
      };

    case "google":
      return {
        provider: "google",
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirectUri,
        scopes: ["https://www.googleapis.com/auth/adwords"],
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
      };

    case "tiktok":
      return {
        provider: "tiktok",
        clientId: process.env.TIKTOK_APP_ID ?? "",
        clientSecret: process.env.TIKTOK_APP_SECRET ?? "",
        redirectUri,
        scopes: ["ad.management", "ad.read"],
        authUrl: "https://business-api.tiktok.com/portal/auth",
        tokenUrl: "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
      };

    default:
      return null;
  }
}

// ── Auth URL Generation ─────────────────────────────────────────────────

export function generateAuthUrl(provider: OAuthProvider, userId: string): string | null {
  const config = getProviderConfig(provider);
  if (!config || !config.clientId) return null;

  // State param: encode provider + userId for callback
  const state = Buffer.from(JSON.stringify({ provider, userId, ts: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(","),
    response_type: "code",
    state,
  });

  if (provider === "google") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
    params.set("scope", config.scopes.join(" "));
  }

  return `${config.authUrl}?${params.toString()}`;
}

// ── Token Exchange ──────────────────────────────────────────────────────

export async function exchangeCodeForTokens(
  provider: OAuthProvider,
  code: string
): Promise<OAuthTokens | null> {
  const config = getProviderConfig(provider);
  if (!config) return null;

  try {
    let body: Record<string, string>;
    let headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };

    if (provider === "tiktok") {
      headers = { "Content-Type": "application/json" };
      body = {
        app_id: config.clientId,
        secret: config.clientSecret,
        auth_code: code,
      };

      const res = await fetch(config.tokenUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const tokenData = data?.data;
      if (!tokenData?.access_token) return null;

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.access_token, // TikTok uses long-lived tokens
        expiresAt: Date.now() + (tokenData.expires_in ?? 86400) * 1000,
        scope: config.scopes.join(","),
        provider,
      };
    }

    // Meta + Google use standard OAuth2
    body = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    };

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers,
      body: new URLSearchParams(body),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.access_token) return null;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? "",
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      scope: data.scope ?? config.scopes.join(","),
      provider,
    };
  } catch {
    return null;
  }
}

// ── Token Refresh ───────────────────────────────────────────────────────

export async function refreshAccessToken(tokens: OAuthTokens): Promise<OAuthTokens | null> {
  const config = getProviderConfig(tokens.provider);
  if (!config || !tokens.refreshToken) return null;

  if (tokens.provider === "tiktok") return tokens; // TikTok tokens are long-lived

  try {
    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? tokens.refreshToken,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      scope: data.scope ?? tokens.scope,
      provider: tokens.provider,
    };
  } catch {
    return null;
  }
}

// ── Token Storage ───────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY ?? "himalaya-default-key-change-in-production!!";

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function saveTokens(userId: string, tokens: OAuthTokens): Promise<void> {
  const encrypted = encrypt(JSON.stringify(tokens));

  await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "oauth_tokens",
      metadata: {
        provider: tokens.provider,
        encrypted,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
      },
    },
  });
}

export async function getTokens(userId: string, provider: OAuthProvider): Promise<OAuthTokens | null> {
  const event = await prisma.himalayaFunnelEvent.findFirst({
    where: {
      userId,
      event: "oauth_tokens",
      metadata: { path: ["provider"], equals: provider },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!event) return null;

  const meta = event.metadata as Record<string, string>;
  try {
    const tokens = JSON.parse(decrypt(meta.encrypted)) as OAuthTokens;

    // Auto-refresh if expired
    if (tokens.expiresAt < Date.now() - 60000) {
      const refreshed = await refreshAccessToken(tokens);
      if (refreshed) {
        await saveTokens(userId, refreshed);
        return refreshed;
      }
      return null;
    }

    return tokens;
  } catch {
    return null;
  }
}

/** Check which providers a user has connected */
export async function getConnectedProviders(userId: string): Promise<OAuthProvider[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "oauth_tokens" },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });

  const providers = new Set<OAuthProvider>();
  for (const e of events) {
    const meta = e.metadata as Record<string, string>;
    if (meta.provider) providers.add(meta.provider as OAuthProvider);
  }
  return Array.from(providers);
}

import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export type ApiKey = {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string; // first 8 chars shown to user (hk_xxxxxxxx...)
  hashedKey: string;
  tier: "free" | "pro" | "enterprise";
  callsThisMonth: number;
  monthlyLimit: number;
  lastUsedAt: string | null;
  active: boolean;
  createdAt: string;
};

const TIER_LIMITS: Record<string, number> = {
  free: 1000,
  pro: 100000,
  enterprise: 999999,
};

/** Generate a new API key */
export async function createApiKey(userId: string, name: string, tier: "free" | "pro" | "enterprise" = "free"): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const rawKey = `hk_${randomBytes(32).toString("hex")}`;
  const hashedKey = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 11); // "hk_" + 8 chars

  const event = await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "api_key",
      metadata: {
        name,
        keyPrefix,
        hashedKey,
        tier,
        callsThisMonth: 0,
        monthlyLimit: TIER_LIMITS[tier] ?? 1000,
        monthResetAt: getMonthResetDate(),
        lastUsedAt: null,
        active: true,
      },
    },
  });

  return {
    rawKey,
    apiKey: eventToApiKey(event),
  };
}

/** Validate an API key and check rate limits */
export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  userId?: string;
  keyId?: string;
  tier?: string;
  error?: string;
  remaining?: number;
}> {
  const hashedKey = hashKey(rawKey);

  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { event: "api_key" },
    take: 500,
  });

  const match = events.find(e => {
    const meta = e.metadata as Record<string, unknown>;
    return meta.hashedKey === hashedKey && meta.active === true;
  });

  if (!match) return { valid: false, error: "Invalid API key" };

  const meta = match.metadata as Record<string, unknown>;

  // Check if month needs reset
  const resetAt = meta.monthResetAt as string;
  let callsThisMonth = (meta.callsThisMonth as number) ?? 0;
  if (resetAt && new Date(resetAt) < new Date()) {
    callsThisMonth = 0;
    await prisma.himalayaFunnelEvent.update({
      where: { id: match.id },
      data: { metadata: { ...meta, callsThisMonth: 0, monthResetAt: getMonthResetDate() } },
    });
  }

  const monthlyLimit = (meta.monthlyLimit as number) ?? 1000;
  if (callsThisMonth >= monthlyLimit) {
    return { valid: false, error: "Monthly API call limit exceeded", remaining: 0 };
  }

  // Increment usage
  await prisma.himalayaFunnelEvent.update({
    where: { id: match.id },
    data: {
      metadata: {
        ...meta,
        callsThisMonth: callsThisMonth + 1,
        lastUsedAt: new Date().toISOString(),
      },
    },
  });

  return {
    valid: true,
    userId: match.userId ?? undefined,
    keyId: match.id,
    tier: meta.tier as string,
    remaining: monthlyLimit - callsThisMonth - 1,
  };
}

/** List all API keys for a user */
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "api_key" },
    orderBy: { createdAt: "desc" },
  });
  return events.map(eventToApiKey);
}

/** Revoke an API key */
export async function revokeApiKey(keyId: string): Promise<void> {
  const event = await prisma.himalayaFunnelEvent.findUnique({ where: { id: keyId } });
  if (!event) return;
  const meta = event.metadata as Record<string, unknown>;
  await prisma.himalayaFunnelEvent.update({
    where: { id: keyId },
    data: { metadata: { ...meta, active: false } },
  });
}

/** Get API usage stats for a user */
export async function getApiUsage(userId: string): Promise<{
  totalKeys: number;
  activeKeys: number;
  totalCallsThisMonth: number;
  totalLimit: number;
}> {
  const keys = await listApiKeys(userId);
  const active = keys.filter(k => k.active);
  return {
    totalKeys: keys.length,
    activeKeys: active.length,
    totalCallsThisMonth: active.reduce((s, k) => s + k.callsThisMonth, 0),
    totalLimit: active.reduce((s, k) => s + k.monthlyLimit, 0),
  };
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

function getMonthResetDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
}

function eventToApiKey(event: { id: string; userId: string | null; metadata: unknown; createdAt: Date }): ApiKey {
  const meta = event.metadata as Record<string, unknown>;
  return {
    id: event.id,
    userId: event.userId ?? "",
    name: (meta.name as string) ?? "Unnamed",
    keyPrefix: (meta.keyPrefix as string) ?? "",
    hashedKey: (meta.hashedKey as string) ?? "",
    tier: (meta.tier as ApiKey["tier"]) ?? "free",
    callsThisMonth: (meta.callsThisMonth as number) ?? 0,
    monthlyLimit: (meta.monthlyLimit as number) ?? 1000,
    lastUsedAt: (meta.lastUsedAt as string) ?? null,
    active: (meta.active as boolean) ?? true,
    createdAt: event.createdAt.toISOString(),
  };
}

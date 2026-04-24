/**
 * Simple in-memory rate limiter for serverless.
 * Uses a Map with TTL cleanup. Resets on cold starts (acceptable for serverless).
 * For production at scale, swap with Redis/Upstash.
 */

const store = new Map<string, { count: number; resetAt: number }>();

// Clean expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 60_000);

export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  store.set(key, entry);

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Extract IP from request for rate limit key */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

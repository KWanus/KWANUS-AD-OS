/**
 * In-memory sliding-window rate limiter.
 * Key is typically `${userId}:${endpoint}`.
 *
 * For production at scale, swap the `store` with Upstash Redis
 * to share limits across serverless instances.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Purge expired windows every 5 minutes to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, w] of store.entries()) {
      if (w.resetAt <= now) store.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowSeconds * 1_000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.limit - 1, resetAt };
  }

  if (existing.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
}

/** Standard rate-limit presets used across the app */
export const RATE_LIMITS = {
  /** AI generation endpoints: 20 req/min per user */
  AI_GENERATION: { limit: 20, windowSeconds: 60 } satisfies RateLimitOptions,
  /** Heavy analysis endpoints: 10 req/min per user */
  AI_ANALYSIS:   { limit: 10, windowSeconds: 60 } satisfies RateLimitOptions,
} as const;

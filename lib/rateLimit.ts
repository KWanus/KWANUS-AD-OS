import { NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter using sliding window.
 * For production at scale, replace with Redis-based implementation.
 */

type WindowEntry = { count: number; resetAt: number };

const windows = new Map<string, WindowEntry>();

// Clean up stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (now > entry.resetAt) windows.delete(key);
  }
}, 60_000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/**
 * Check if a request should be rate limited.
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 *
 * Usage:
 *   const limited = rateLimit(`skill:${userId}`, { maxRequests: 10, windowSeconds: 60 });
 *   if (limited) return limited;
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig
): NextResponse | null {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return null;
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  /** AI generation endpoints - expensive, limit to 10/min per user */
  aiGeneration: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Standard API reads - 60/min per user */
  standard: { maxRequests: 60, windowSeconds: 60 } as RateLimitConfig,
  /** Public endpoints (forms, tracking) - 30/min per IP */
  publicEndpoint: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
  /** Webhook endpoints - 100/min per source */
  webhook: { maxRequests: 100, windowSeconds: 60 } as RateLimitConfig,
} as const;

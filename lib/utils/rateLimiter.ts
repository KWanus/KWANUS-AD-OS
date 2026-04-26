/**
 * Rate limiter for AI API providers
 * Prevents account bans by enforcing delays between requests
 */

const GROQ_RPM_LIMIT = 25; // Conservative: 25 RPM (free tier is 30, we stay under)
const MINUTE_MS = 60 * 1000;
const MIN_DELAY_MS = MINUTE_MS / GROQ_RPM_LIMIT; // ~2.4 seconds per request

// Track last call time per provider
const lastCallTimes: Record<string, number> = {
  groq: 0,
  anthropic: 0,
  openai: 0,
};

/**
 * Enforces rate limiting for AI providers
 * @param provider - The AI provider to rate limit
 * @returns Promise that resolves when it's safe to make the next request
 */
export async function rateLimit(provider: "groq" | "anthropic" | "openai"): Promise<void> {
  // Only enforce rate limiting for Groq (free tier has strict limits)
  if (provider !== "groq") return;

  const now = Date.now();
  const lastCall = lastCallTimes[provider] || 0;
  const timeSinceLastCall = now - lastCall;

  if (timeSinceLastCall < MIN_DELAY_MS) {
    const delayNeeded = MIN_DELAY_MS - timeSinceLastCall;
    console.log(`[RateLimit] ${provider}: waiting ${Math.round(delayNeeded)}ms to avoid rate limit (${GROQ_RPM_LIMIT} RPM max)`);
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }

  lastCallTimes[provider] = Date.now();
}

/**
 * Exponential backoff for retry logic
 * @param retryCount - Number of retries attempted
 * @param baseDelayMs - Base delay in milliseconds (default: 1000ms)
 * @returns Delay in milliseconds
 */
export function exponentialBackoff(retryCount: number, baseDelayMs = 1000): number {
  return Math.min(baseDelayMs * Math.pow(2, retryCount), 60000); // Max 60 seconds
}

/**
 * Get rate limit status for a provider
 * @param provider - The AI provider
 * @returns Time until next request is allowed (0 if ready now)
 */
export function getRateLimitStatus(provider: "groq" | "anthropic" | "openai"): number {
  const now = Date.now();
  const lastCall = lastCallTimes[provider] || 0;
  const timeSinceLastCall = now - lastCall;
  const timeUntilReady = MIN_DELAY_MS - timeSinceLastCall;

  return Math.max(0, timeUntilReady);
}

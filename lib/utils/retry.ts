// ---------------------------------------------------------------------------
// Retry utility — exponential backoff for any async operation
// Used across: email sending, image generation, API calls, webhooks
// ---------------------------------------------------------------------------

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const baseDelay = opts.baseDelayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[Retry] ${opts.label ?? "operation"} failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

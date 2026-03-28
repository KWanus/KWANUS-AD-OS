/**
 * Central configuration & environment validation.
 * Import helpers from here instead of reading process.env directly.
 * Provides clear, actionable errors when required vars are missing.
 */

const PLACEHOLDER_PATTERNS = [
  "REPLACE_ME", "YOUR_KEY_HERE", "PLACEHOLDER", "CHANGEME",
  "XXXXX", "TODO", "SK-XXXX", "RE_XXXX", "WHSEC_XXXX",
];

function isPlaceholder(val: string): boolean {
  const upper = val.toUpperCase();
  return PLACEHOLDER_PATTERNS.some((p) => upper.includes(p));
}

function readEnv(key: string): string {
  return process.env[key] ?? "";
}

// ─── Computed config object ────────────────────────────────────────────────

export const config = {
  databaseUrl:           readEnv("DATABASE_URL"),
  clerkSecretKey:        readEnv("CLERK_SECRET_KEY"),
  anthropicApiKey:       readEnv("ANTHROPIC_API_KEY"),
  openAiApiKey:          readEnv("OPENAI_API_KEY"),
  stripeSecretKey:       readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret:   readEnv("STRIPE_WEBHOOK_SECRET"),
  resendApiKey:          readEnv("RESEND_API_KEY"),
  cronSecret:            readEnv("CRON_SECRET"),
} as const;

// ─── Feature-gate helpers ─────────────────────────────────────────────────

export function isAnthropicConfigured(): boolean {
  const k = config.anthropicApiKey;
  return k.length > 0 && !isPlaceholder(k);
}

export function isOpenAiConfigured(): boolean {
  const k = config.openAiApiKey;
  return k.length > 0 && !isPlaceholder(k);
}

export function isStripeConfigured(): boolean {
  const k = config.stripeSecretKey;
  return k.length > 0 && !isPlaceholder(k);
}

export function isEmailConfigured(): boolean {
  const k = config.resendApiKey;
  return k.length > 0 && !isPlaceholder(k);
}

// ─── Startup validation ────────────────────────────────────────────────────

export interface ConfigValidationResult {
  ok: boolean;
  missing: string[];
  placeholders: string[];
  warnings: string[];
}

export function validateConfig(): ConfigValidationResult {
  const required: [string, string][] = [
    ["DATABASE_URL",    config.databaseUrl],
    ["CLERK_SECRET_KEY", config.clerkSecretKey],
  ];

  const recommended: [string, string, string][] = [
    ["ANTHROPIC_API_KEY",    config.anthropicApiKey,    "AI generation features will be disabled"],
    ["STRIPE_SECRET_KEY",    config.stripeSecretKey,    "Payments will be disabled"],
    ["RESEND_API_KEY",       config.resendApiKey,       "Email delivery will be disabled"],
  ];

  const missing: string[] = [];
  const placeholders: string[] = [];
  const warnings: string[] = [];

  for (const [key, val] of required) {
    if (!val) missing.push(key);
    else if (isPlaceholder(val)) placeholders.push(key);
  }

  for (const [key, val, hint] of recommended) {
    if (!val || isPlaceholder(val)) warnings.push(`${key} not set — ${hint}`);
  }

  return { ok: missing.length === 0 && placeholders.length === 0, missing, placeholders, warnings };
}

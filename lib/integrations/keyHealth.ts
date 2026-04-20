// ---------------------------------------------------------------------------
// Key Health — tests all API keys and reports what's working
// Run this to see what needs fixing before users can get real value
// ---------------------------------------------------------------------------

export type KeyHealth = {
  name: string;
  status: "working" | "dead" | "not_set";
  error?: string;
  fixUrl: string;
  fixTime: string;
  cost: string;
  impact: string; // what breaks without it
};

export async function checkAllKeys(): Promise<KeyHealth[]> {
  const results: KeyHealth[] = [];

  // ── Groq (FREE AI — most important) ──
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    results.push({ name: "Groq AI", status: "not_set", fixUrl: "https://console.groq.com/keys", fixTime: "30 seconds", cost: "Free", impact: "ALL AI content generation is template-only without this" });
  } else {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5 }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) results.push({ name: "Groq AI", status: "working", fixUrl: "", fixTime: "", cost: "Free", impact: "" });
      else results.push({ name: "Groq AI", status: "dead", error: `HTTP ${res.status}`, fixUrl: "https://console.groq.com/keys", fixTime: "30 seconds", cost: "Free", impact: "AI generates template content instead of personalized" });
    } catch (err) {
      results.push({ name: "Groq AI", status: "dead", error: err instanceof Error ? err.message : "Failed", fixUrl: "https://console.groq.com/keys", fixTime: "30 seconds", cost: "Free", impact: "AI generates template content instead of personalized" });
    }
  }

  // ── Anthropic ──
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 5, messages: [{ role: "user", content: "Say OK" }] }),
        signal: AbortSignal.timeout(10000),
      });
      results.push({ name: "Anthropic", status: res.ok ? "working" : "dead", error: res.ok ? undefined : `HTTP ${res.status}`, fixUrl: "https://console.anthropic.com/settings/keys", fixTime: "1 minute", cost: "Pay per use", impact: "Falls back to Groq/OpenAI" });
    } catch { results.push({ name: "Anthropic", status: "dead", fixUrl: "https://console.anthropic.com/settings/keys", fixTime: "1 minute", cost: "Pay per use", impact: "Falls back to Groq" }); }
  }

  // ── Resend ──
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    results.push({ name: "Resend Email", status: "not_set", fixUrl: "https://resend.com/api-keys", fixTime: "1 minute", cost: "Free", impact: "Emails don't send. Falls back to Gmail SMTP." });
  } else {
    try {
      const res = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${resendKey}` }, signal: AbortSignal.timeout(5000) });
      results.push({ name: "Resend Email", status: res.ok ? "working" : "dead", error: res.ok ? undefined : `HTTP ${res.status}`, fixUrl: "https://resend.com/api-keys", fixTime: "1 minute", cost: "Free", impact: "Emails don't send" });
    } catch { results.push({ name: "Resend Email", status: "dead", fixUrl: "https://resend.com/api-keys", fixTime: "1 minute", cost: "Free", impact: "Emails don't send" }); }
  }

  // ── Gmail SMTP ──
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) {
    results.push({ name: "Gmail SMTP", status: "not_set", fixUrl: "https://myaccount.google.com/apppasswords", fixTime: "2 minutes", cost: "Free", impact: "Backup email sender not available" });
  } else {
    results.push({ name: "Gmail SMTP", status: "working", fixUrl: "", fixTime: "", cost: "Free", impact: "" });
  }

  // ── fal.ai ──
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    results.push({ name: "fal.ai Images", status: "not_set", fixUrl: "https://fal.ai/dashboard/keys", fixTime: "1 minute", cost: "$5", impact: "Ad images are SVG text-only, not AI photos" });
  } else {
    try {
      const res = await fetch("https://queue.fal.run/fal-ai/fast-sdxl", {
        method: "POST",
        headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "test", num_images: 1, image_size: "square_hd" }),
        signal: AbortSignal.timeout(10000),
      });
      const ok = res.ok;
      results.push({ name: "fal.ai Images", status: ok ? "working" : "dead", error: ok ? undefined : "Balance exhausted or invalid", fixUrl: "https://fal.ai/dashboard/billing", fixTime: "1 minute", cost: "$5 to refill", impact: "Ad images are SVG text-only" });
    } catch { results.push({ name: "fal.ai Images", status: "dead", fixUrl: "https://fal.ai/dashboard/billing", fixTime: "1 minute", cost: "$5", impact: "Ad images are SVG text-only" }); }
  }

  // ── Stripe ──
  results.push({
    name: "Stripe Payments",
    status: process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET ? "working" : "not_set",
    fixUrl: "https://dashboard.stripe.com/apikeys",
    fixTime: "5 minutes",
    cost: "2.9% per charge",
    impact: "Users can't accept payments",
  });

  return results;
}

/** Quick summary: how many keys work vs dead vs not set */
export async function getKeyHealthSummary(): Promise<{
  working: number;
  dead: number;
  notSet: number;
  critical: string[];
  canBuildBusinesses: boolean;
  canSendEmails: boolean;
  canGenerateImages: boolean;
}> {
  const keys = await checkAllKeys();
  const working = keys.filter(k => k.status === "working").length;
  const dead = keys.filter(k => k.status === "dead").length;
  const notSet = keys.filter(k => k.status === "not_set").length;
  const critical = keys.filter(k => k.status !== "working" && k.impact).map(k => `${k.name}: ${k.impact}`);

  const groq = keys.find(k => k.name === "Groq AI");
  const anthropic = keys.find(k => k.name === "Anthropic");
  const resend = keys.find(k => k.name === "Resend Email");
  const gmail = keys.find(k => k.name === "Gmail SMTP");
  const fal = keys.find(k => k.name === "fal.ai Images");

  return {
    working, dead, notSet, critical,
    canBuildBusinesses: (groq?.status === "working" || anthropic?.status === "working") ?? false,
    canSendEmails: (resend?.status === "working" || gmail?.status === "working") ?? false,
    canGenerateImages: (fal?.status === "working") || false,
  };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAnthropicConfigured, isStripeConfigured, isEmailConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: "error", latency: Date.now() - dbStart, error: err instanceof Error ? err.message : "Unknown" };
  }

  // Anthropic API check (key presence only — don't make a real call)
  checks.anthropic = isAnthropicConfigured()
    ? { status: "ok" }
    : { status: "error", error: "ANTHROPIC_API_KEY not set or is a placeholder" };

  // Clerk check (key presence)
  checks.clerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? { status: "ok" }
    : { status: "error", error: "Clerk keys not set" };

  // Stripe check (key presence)
  checks.stripe = isStripeConfigured()
    ? { status: "ok" }
    : { status: "error", error: "STRIPE_SECRET_KEY not set or is a placeholder" };

  // Resend check (key presence — optional)
  checks.resend = isEmailConfigured()
    ? { status: "ok" }
    : { status: "error", error: "RESEND_API_KEY not configured (optional)" };

  const allOk = checks.database.status === "ok" && checks.anthropic.status === "ok" && checks.clerk.status === "ok";
  const overallStatus = allOk ? "healthy" : "degraded";

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks,
  }, {
    status: allOk ? 200 : 503,
  });
}

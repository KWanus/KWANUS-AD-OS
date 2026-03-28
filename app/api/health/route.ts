import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error", latency: Date.now() - dbStart };
  }

  // Service checks (key presence only — don't leak env var names)
  checks.anthropic = process.env.ANTHROPIC_API_KEY ? { status: "ok" } : { status: "error" };
  checks.clerk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? { status: "ok" } : { status: "error" };
  checks.stripe = process.env.STRIPE_SECRET_KEY ? { status: "ok" } : { status: "error" };
  checks.resend = (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_REPLACE_ME")
    ? { status: "ok" } : { status: "error" };

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

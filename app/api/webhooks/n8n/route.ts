/**
 * N8N Webhook Hub
 * Handles all n8n workflow triggers for the Agency OS.
 *
 * POST /api/webhooks/n8n?workflow=lead-intake
 * POST /api/webhooks/n8n?workflow=business-processing
 * POST /api/webhooks/n8n?workflow=outreach
 *
 * Authenticate with header: x-webhook-secret = WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSiteFromScan } from "@/lib/sites/scanMode";
import { config } from "@/lib/config";

function validateSecret(req: NextRequest): boolean {
  const secret = config.webhookSecret;
  if (!secret || secret === "REPLACE_ME") {
    // Fail closed — if secret is not configured, reject all requests
    console.error("[n8n webhook] WEBHOOK_SECRET not configured — rejecting request");
    return false;
  }
  return req.headers.get("x-webhook-secret") === secret;
}

// ── Workflow: lead-intake ─────────────────────────────────────────────────────
// Trigger: n8n finds businesses via Google Maps/SerpAPI, sends them here
async function handleLeadIntake(body: unknown): Promise<NextResponse> {
  const data = body as {
    userId: string;
    niche: string;
    location: string;
    businesses: {
      name: string;
      website?: string;
      phone?: string;
      email?: string;
      address?: string;
      rating?: number;
      reviewCount?: number;
      googlePlaceId?: string;
    }[];
  };

  if (!data.userId || !data.niche || !data.location || !data.businesses?.length) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  // Cap intake to prevent runaway inserts
  const MAX_BUSINESSES = 100;
  const businesses = data.businesses.slice(0, MAX_BUSINESSES);

  // Batch-check for existing leads — single query instead of N+1
  const names = businesses.map((b) => b.name).filter(Boolean);
  const existingLeads = await prisma.lead.findMany({
    where: { userId: data.userId, location: data.location, name: { in: names } },
    select: { name: true },
  });
  const existingNames = new Set(existingLeads.map((l) => l.name));

  const businessIds: string[] = [];

  for (const biz of businesses) {
    if (!biz.name || existingNames.has(biz.name)) continue;

    const lead = await prisma.lead.create({
      data: {
        userId: data.userId,
        name: biz.name,
        niche: data.niche,
        location: data.location,
        website: biz.website ?? null,
        phone: biz.phone ?? null,
        email: biz.email ?? null,
        address: biz.address ?? null,
        rating: biz.rating ?? null,
        reviewCount: biz.reviewCount ?? null,
        googlePlaceId: biz.googlePlaceId ?? null,
        status: "new",
      },
    });
    businessIds.push(lead.id);
  }

  return NextResponse.json({
    success: true,
    niche: data.niche,
    location: data.location,
    count: businessIds.length,
    business_ids: businessIds,
  });
}

// ── Workflow: business-processing ─────────────────────────────────────────────
// Trigger: n8n sends list of business IDs to analyze + generate
async function handleBusinessProcessing(body: unknown): Promise<NextResponse> {
  const data = body as { business_ids: string[]; skip_analyze?: boolean };

  if (!data.business_ids?.length) {
    return NextResponse.json({ success: false, error: "No business_ids provided" }, { status: 400 });
  }

  // Cap to prevent runaway processing
  const MAX_IDS = 50;
  const ids = data.business_ids.slice(0, MAX_IDS);
  const baseUrl = config.appUrl || "http://localhost:3000";
  let processed = 0;
  let failed = 0;

  // Process with concurrency limit to avoid overwhelming the server
  const CONCURRENCY = 5;
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (id) => {
        try {
          if (!data.skip_analyze) {
            const analyzeRes = await fetch(`${baseUrl}/api/leads/${id}/analyze`, { method: "POST" });
            if (!analyzeRes.ok) return "failed";
          }
          const generateRes = await fetch(`${baseUrl}/api/leads/${id}/generate`, { method: "POST" });
          return generateRes.ok ? "ok" : "failed";
        } catch {
          return "failed";
        }
      })
    );
    for (const r of results) {
      if (r === "ok") processed++;
      else failed++;
    }
  }

  return NextResponse.json({ success: true, processed, failed });
}

// ── Workflow: outreach ────────────────────────────────────────────────────────
// Trigger: n8n ready to send outreach for a business
async function handleOutreach(body: unknown): Promise<NextResponse> {
  const data = body as { business_id: string; to_email: string };

  if (!data.business_id || !data.to_email) {
    return NextResponse.json({ success: false, error: "Missing business_id or to_email" }, { status: 400 });
  }

  const baseUrl = config.appUrl || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/leads/${data.business_id}/outreach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toEmail: data.to_email }),
  });
  const result = await res.json() as { ok: boolean };

  return NextResponse.json({
    success: result.ok,
    business_id: data.business_id,
    email_sent: result.ok,
    sms_sent: false,
  });
}

// ── Workflow: site-scan ──────────────────────────────────────────────────────
// Trigger: n8n sends a reference site to clone or improve inside the Sites tab
async function handleSiteScan(body: unknown): Promise<NextResponse> {
  const data = body as {
    userId: string;
    url: string;
    siteName?: string;
    niche?: string;
    notes?: string;
    mode?: "clone" | "improve";
    triggerN8n?: boolean;
  };

  if (!data.userId || !data.url) {
    return NextResponse.json({ success: false, error: "Missing userId or url" }, { status: 400 });
  }

  const result = await createSiteFromScan({
    userId: data.userId,
    url: data.url,
    siteName: data.siteName,
    niche: data.niche,
    notes: data.notes,
    mode: data.mode === "clone" ? "clone" : "improve",
    triggerN8n: data.triggerN8n ?? false,
  });

  return NextResponse.json({
    success: true,
    site: result.site,
    source: result.source,
    summary: result.summary,
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!validateSecret(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const workflow = req.nextUrl.searchParams.get("workflow");
  const body = await req.json();
  const startTime = Date.now();

  // Log the incoming webhook
  let logId: string | null = null;
  try {
    const log = await prisma.webhookLog.create({
      data: {
        source: "n8n",
        workflow: workflow ?? "unknown",
        status: "received",
        payload: body as object,
      },
    });
    logId = log.id;
  } catch {
    // Non-fatal — continue processing even if log fails
  }

  let response: NextResponse;

  switch (workflow) {
    case "lead-intake":
      response = await handleLeadIntake(body);
      break;
    case "business-processing":
      response = await handleBusinessProcessing(body);
      break;
    case "outreach":
      response = await handleOutreach(body);
      break;
    case "site-scan":
      response = await handleSiteScan(body);
      break;
    default:
      response = NextResponse.json({ success: false, error: `Unknown workflow: ${workflow ?? "none"}` }, { status: 400 });
  }

  // Update the webhook log with result
  if (logId) {
    try {
      const responseBody = await response.clone().json().catch(() => null);
      await prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: response.ok ? "processed" : "failed",
          response: responseBody as object ?? undefined,
          error: response.ok ? undefined : (responseBody as Record<string, unknown>)?.error as string ?? undefined,
          durationMs: Date.now() - startTime,
        },
      });
    } catch {
      // Non-fatal
    }
  }

  return response;
}

// Health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    workflows: ["lead-intake", "business-processing", "outreach", "site-scan"],
    usage: "POST /api/webhooks/n8n?workflow=<name> with x-webhook-secret header",
  });
}

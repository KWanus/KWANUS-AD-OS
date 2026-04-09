// ---------------------------------------------------------------------------
// POST /api/orchestrator/execute
// Takes an approved plan → deploys everything → activates all automations
// This is the "make it happen" button
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      path: string;
      config: Record<string, unknown>;
      affiliateLink?: string;
    };

    // Call the unified path deploy
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";

    // Deploy using the path-specific endpoint
    let deployUrl = `${baseUrl}/api/paths/deploy`;
    let deployBody: Record<string, unknown> = { path: body.path, config: body.config };

    // Affiliate has its own deploy
    if (body.path === "affiliate" && body.affiliateLink && body.config.product) {
      deployUrl = `${baseUrl}/api/paths/affiliate/deploy`;
      deployBody = { product: body.config.product, affiliateLink: body.affiliateLink };
    }

    const deployRes = await fetch(deployUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify(deployBody),
    });

    const deployData = await deployRes.json() as {
      ok: boolean;
      deployed?: Record<string, { id: string; url: string; publicUrl?: string }>;
      error?: string;
    };

    if (!deployData.ok) {
      return NextResponse.json({ ok: false, error: deployData.error ?? "Deploy failed" }, { status: 500 });
    }

    // Save the orchestration record
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: user.id,
        event: "orchestrator_executed",
        metadata: JSON.parse(JSON.stringify({
          path: body.path,
          config: body.config,
          deployed: deployData.deployed,
          executedAt: new Date().toISOString(),
        })),
      },
    });

    // Notify user
    createNotification({
      userId: user.id,
      type: "system",
      title: "Your business is deployed",
      body: `${body.path} business created with site, emails, and campaign. Review and publish to go live.`,
      href: deployData.deployed?.site?.url ?? "/",
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      path: body.path,
      deployed: deployData.deployed,
      nextSteps: [
        "Review your site and click Publish",
        body.path === "affiliate" ? null : "Add your pricing in the site editor",
        "Fund your ad account (Meta, Google, or TikTok)",
        "Approve ad creatives in your campaign",
        "Your email flows are already active — leads will be nurtured automatically",
      ].filter(Boolean),
      automationsActive: [
        "Email flow processing (every 5 min)",
        "Daily action queue",
        "Weekly performance digest",
        "Proactive alerts (every 6 hours)",
        "Cold lead follow-up (weekly)",
        "Competitor monitoring (weekly)",
      ],
    });
  } catch (err) {
    console.error("Orchestrator execute error:", err);
    return NextResponse.json({ ok: false, error: "Execution failed" }, { status: 500 });
  }
}

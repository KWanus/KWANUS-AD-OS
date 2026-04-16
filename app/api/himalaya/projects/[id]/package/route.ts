// GET /api/himalaya/projects/[id]/package
// Returns the full campaign package for a project (scripts, emails, math, timeline)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { id } = await params;

    // Find the deployment
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { id, userId: user.id },
    });
    if (!deployment) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    // Find the campaign package event
    const packageEvent = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId: user.id,
        event: "campaign_package_generated",
        metadata: { path: ["runId"], equals: deployment.analysisRunId },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!packageEvent) {
      return NextResponse.json({ ok: true, package: null, message: "Package not generated yet" });
    }

    // Also get organic posts
    const organicEvent = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId: user.id,
        event: "organic_content_generated",
        metadata: { path: ["campaignId"], equals: deployment.campaignId ?? "" },
      },
      orderBy: { createdAt: "desc" },
    });

    // Also get revenue system
    const revenueEvent = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId: user.id,
        event: "revenue_system_generated",
        metadata: { path: ["runId"], equals: deployment.analysisRunId },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      package: packageEvent.metadata,
      organicPosts: organicEvent?.metadata ?? null,
      revenueSystem: revenueEvent?.metadata ?? null,
    });
  } catch (err) {
    console.error("Package error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/himalaya/projects
// Returns all user's businesses as grouped projects
// Each project = one Himalaya build with its site, campaign, emails, leads
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Get all deployments (each = a project/business)
    const deployments = await prisma.himalayaDeployment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const projects = await Promise.all(deployments.map(async (dep) => {
      // Get the analysis run for the name/niche
      const run = await prisma.analysisRun.findUnique({
        where: { id: dep.analysisRunId },
        select: { title: true, mode: true, decisionPacket: true },
      }).catch(() => null);

      // Get site info
      let site = null;
      if (dep.siteId) {
        const s = await prisma.site.findUnique({
          where: { id: dep.siteId },
          select: { id: true, slug: true, published: true, totalViews: true },
        }).catch(() => null);
        if (s) site = { id: s.id, slug: s.slug, published: s.published, views: s.totalViews ?? 0 };
      }

      // Get campaign info
      let campaign = null;
      if (dep.campaignId) {
        const c = await prisma.campaign.findUnique({
          where: { id: dep.campaignId },
          select: { id: true, status: true },
        }).catch(() => null);
        if (c) {
          const varCount = await prisma.adVariation.count({ where: { campaignId: c.id } }).catch(() => 0);
          campaign = { id: c.id, status: c.status, variationCount: varCount };
        }
      }

      // Get email flow info
      let emailFlow = null;
      if (dep.emailFlowId) {
        const f = await prisma.emailFlow.findUnique({
          where: { id: dep.emailFlowId },
          select: { id: true, status: true, enrolled: true, sent: true },
        }).catch(() => null);
        if (f) emailFlow = { id: f.id, status: f.status, enrolled: f.enrolled, sent: f.sent };
      }

      // Get lead count for this project's site
      let leadCount = 0;
      if (dep.siteId) {
        leadCount = await prisma.lead.count({ where: { userId: user.id } }).catch(() => 0);
      }

      // Get revenue from orders on this site
      let revenue = 0;
      if (dep.siteId) {
        const orders = await prisma.siteOrder.findMany({
          where: { siteId: dep.siteId, status: { in: ["paid", "fulfilled"] } },
          select: { amountCents: true },
        }).catch(() => []);
        revenue = orders.reduce((sum, o) => sum + o.amountCents, 0) / 100;
      }

      const packet = run?.decisionPacket as Record<string, string> | null;

      return {
        id: dep.id,
        name: run?.title ?? "Business",
        niche: packet?.audience ?? packet?.angle ?? run?.mode ?? "",
        createdAt: dep.createdAt.toISOString(),
        site,
        campaign,
        emailFlow,
        leadCount,
        revenue,
      };
    }));

    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    console.error("Projects error:", err);
    return NextResponse.json({ ok: true, projects: [] });
  }
}

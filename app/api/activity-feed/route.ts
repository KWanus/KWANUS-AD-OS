import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/activity-feed — Recent workspace activity across all modules.
 * Shows the last N actions the user took, sorted by most recent.
 */

type FeedItem = {
  id: string;
  type: "client_created" | "client_stage_change" | "campaign_created" | "site_created" | "site_published" |
        "analysis_run" | "email_flow_created" | "lead_found" | "proposal_created" | "client_activity" |
        "market_intel" | "himalaya_run";
  title: string;
  subtitle: string;
  href: string;
  timestamp: string;
};

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 50);

    // Fetch recent items from multiple tables in parallel
    const [
      recentClients,
      recentCampaigns,
      recentSites,
      recentAnalyses,
      recentFlows,
      recentLeads,
      recentActivities,
      recentIntel,
      recentHimalaya,
    ] = await Promise.all([
      prisma.client.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, pipelineStage: true, createdAt: true },
      }),
      prisma.campaign.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.site.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, name: true, published: true, updatedAt: true, createdAt: true },
      }),
      prisma.analysisRun.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, inputUrl: true, score: true, verdict: true, createdAt: true },
      }),
      prisma.emailFlow.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, niche: true, location: true, createdAt: true },
      }),
      prisma.clientActivity.findMany({
        where: { client: { userId: user.id }, type: { not: "note" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, type: true, content: true, createdAt: true, client: { select: { id: true, name: true } } },
      }),
      prisma.marketIntelligence.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, niche: true, status: true, score: true, topProductName: true, createdAt: true },
      }),
      prisma.himalayaRun.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, mode: true, status: true, createdAt: true },
      }),
    ]);

    const feed: FeedItem[] = [];

    for (const c of recentClients) {
      feed.push({
        id: `client-${c.id}`,
        type: "client_created",
        title: `Added client: ${c.name}`,
        subtitle: `Stage: ${c.pipelineStage}`,
        href: `/clients/${c.id}`,
        timestamp: c.createdAt.toISOString(),
      });
    }

    for (const c of recentCampaigns) {
      feed.push({
        id: `campaign-${c.id}`,
        type: "campaign_created",
        title: `Campaign: ${c.name}`,
        subtitle: `Status: ${c.status}`,
        href: `/campaigns/${c.id}`,
        timestamp: c.createdAt.toISOString(),
      });
    }

    for (const s of recentSites) {
      feed.push({
        id: `site-${s.id}`,
        type: s.published ? "site_published" : "site_created",
        title: `${s.published ? "Published" : "Created"} site: ${s.name}`,
        subtitle: s.published ? "Live" : "Draft",
        href: `/websites/${s.id}`,
        timestamp: (s.published ? s.updatedAt : s.createdAt).toISOString(),
      });
    }

    for (const a of recentAnalyses) {
      feed.push({
        id: `analysis-${a.id}`,
        type: "analysis_run",
        title: `Scanned: ${a.title ?? a.inputUrl}`,
        subtitle: `${a.score ?? 0}/100 · ${a.verdict ?? "Unknown"}`,
        href: `/analyses/${a.id}`,
        timestamp: a.createdAt.toISOString(),
      });
    }

    for (const f of recentFlows) {
      feed.push({
        id: `flow-${f.id}`,
        type: "email_flow_created",
        title: `Email flow: ${f.name}`,
        subtitle: `Status: ${f.status}`,
        href: `/emails/flows/${f.id}`,
        timestamp: f.createdAt.toISOString(),
      });
    }

    for (const l of recentLeads) {
      feed.push({
        id: `lead-${l.id}`,
        type: "lead_found",
        title: `Lead: ${l.name}`,
        subtitle: `${l.niche} · ${l.location}`,
        href: `/leads/${l.id}`,
        timestamp: l.createdAt.toISOString(),
      });
    }

    for (const a of recentActivities) {
      feed.push({
        id: `activity-${a.id}`,
        type: "client_activity",
        title: `${a.type}: ${a.client.name}`,
        subtitle: a.content ?? "",
        href: `/clients/${a.client.id}`,
        timestamp: a.createdAt.toISOString(),
      });
    }

    for (const mi of recentIntel) {
      feed.push({
        id: `intel-${mi.id}`,
        type: "market_intel",
        title: `Market Intel: ${mi.niche}`,
        subtitle: `${mi.status === "complete" ? `Score: ${mi.score}/100` : mi.status}${mi.topProductName ? ` · ${mi.topProductName}` : ""}`,
        href: `/market-intelligence/${mi.id}`,
        timestamp: mi.createdAt.toISOString(),
      });
    }

    for (const hr of recentHimalaya) {
      feed.push({
        id: `himalaya-${hr.id}`,
        type: "himalaya_run",
        title: `Himalaya: ${hr.mode === "scratch" ? "New Business" : "Business Audit"}`,
        subtitle: hr.status ?? "complete",
        href: `/himalaya/run/${hr.id}`,
        timestamp: hr.createdAt.toISOString(),
      });
    }

    // Sort by timestamp descending and limit
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ ok: true, feed: feed.slice(0, limit) });
  } catch (err) {
    console.error("Activity feed error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

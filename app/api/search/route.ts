import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

type SearchResult = {
  type: "client" | "campaign" | "site" | "analysis" | "lead" | "email_flow" | "affiliate" | "proposal";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score?: number;
};

/**
 * GET /api/search?q=query
 * Universal search across all workspace entities.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ ok: true, results: [], total: 0 });
    }

    const contains = { contains: q, mode: "insensitive" as const };

    // Search all entity types in parallel
    const [clients, campaigns, sites, analyses, leads, flows, offers, proposals] = await Promise.all([
      prisma.client.findMany({
        where: { userId: user.id, OR: [{ name: contains }, { email: contains }, { company: contains }] },
        select: { id: true, name: true, company: true, pipelineStage: true, healthScore: true },
        take: 5,
      }),
      prisma.campaign.findMany({
        where: { userId: user.id, OR: [{ name: contains }, { productName: contains }] },
        select: { id: true, name: true, status: true, mode: true },
        take: 5,
      }),
      prisma.site.findMany({
        where: { userId: user.id, OR: [{ name: contains }, { slug: contains }] },
        select: { id: true, name: true, slug: true, published: true },
        take: 5,
      }),
      prisma.analysisRun.findMany({
        where: { userId: user.id, OR: [{ title: contains }, { inputUrl: contains }] },
        select: { id: true, title: true, inputUrl: true, score: true, verdict: true },
        take: 5,
      }),
      prisma.lead.findMany({
        where: { userId: user.id, OR: [{ name: contains }, { niche: contains }, { location: contains }] },
        select: { id: true, name: true, niche: true, location: true, status: true },
        take: 5,
      }),
      prisma.emailFlow.findMany({
        where: { userId: user.id, name: contains },
        select: { id: true, name: true, status: true, trigger: true },
        take: 5,
      }),
      prisma.affiliateOffer.findMany({
        where: { userId: user.id, OR: [{ name: contains }, { niche: contains }] },
        select: { id: true, name: true, platform: true, niche: true },
        take: 5,
      }),
      prisma.proposal.findMany({
        where: { userId: user.id, title: contains },
        select: { id: true, title: true, status: true, totalValue: true },
        take: 5,
      }),
    ]);

    const results: SearchResult[] = [];

    for (const c of clients) {
      results.push({
        type: "client", id: c.id,
        title: c.name,
        subtitle: [c.company, c.pipelineStage, `health:${c.healthScore}`].filter(Boolean).join(" · "),
        href: `/clients/${c.id}`,
        score: c.healthScore,
      });
    }

    for (const c of campaigns) {
      results.push({
        type: "campaign", id: c.id,
        title: c.name,
        subtitle: `${c.mode} · ${c.status}`,
        href: `/campaigns/${c.id}`,
      });
    }

    for (const s of sites) {
      results.push({
        type: "site", id: s.id,
        title: s.name,
        subtitle: s.published ? `/${s.slug} · published` : `/${s.slug} · draft`,
        href: `/websites/${s.id}`,
      });
    }

    for (const a of analyses) {
      results.push({
        type: "analysis", id: a.id,
        title: a.title ?? a.inputUrl,
        subtitle: `${a.score ?? 0}/100 · ${a.verdict ?? "Unknown"}`,
        href: `/analyses/${a.id}`,
        score: a.score ?? undefined,
      });
    }

    for (const l of leads) {
      results.push({
        type: "lead", id: l.id,
        title: l.name,
        subtitle: [l.niche, l.location, l.status].filter(Boolean).join(" · "),
        href: `/leads/${l.id}`,
      });
    }

    for (const f of flows) {
      results.push({
        type: "email_flow", id: f.id,
        title: f.name,
        subtitle: `${f.trigger} · ${f.status}`,
        href: `/emails/flows/${f.id}`,
      });
    }

    for (const o of offers) {
      results.push({
        type: "affiliate", id: o.id,
        title: o.name,
        subtitle: [o.platform, o.niche].filter(Boolean).join(" · "),
        href: `/affiliate/offers/${o.id}`,
      });
    }

    for (const p of proposals) {
      results.push({
        type: "proposal", id: p.id,
        title: p.title,
        subtitle: [p.status, p.totalValue ? `$${p.totalValue}` : null].filter(Boolean).join(" · "),
        href: `/consult/proposals/${p.id}`,
      });
    }

    // Sort by relevance: exact title match > starts-with > contains
    const qLower = q.toLowerCase();
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aExact = aTitle === qLower ? 3 : aTitle.startsWith(qLower) ? 2 : 1;
      const bExact = bTitle === qLower ? 3 : bTitle.startsWith(qLower) ? 2 : 1;
      return bExact - aExact;
    });

    return NextResponse.json({ ok: true, results, total: results.length });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

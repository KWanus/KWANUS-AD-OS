import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/campaigns/[id]/export?format=txt|json|md
 * Export the full campaign asset package as a formatted download.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const format = req.nextUrl.searchParams.get("format") ?? "md";

    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
      include: {
        adVariations: { orderBy: [{ type: "asc" }, { sortOrder: "asc" }] },
        landingDraft: true,
        emailDrafts: { orderBy: [{ sequence: "asc" }, { position: "asc" }] },
        checklistItems: { orderBy: [{ day: "asc" }, { position: "asc" }] },
        analysisRun: {
          select: {
            inputUrl: true,
            title: true,
            verdict: true,
            score: true,
            summary: true,
            mode: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(campaign, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${campaign.name.replace(/[^a-z0-9]/gi, "_")}_export.json"`,
        },
      });
    }

    // Build Markdown / Text export
    const hooks = campaign.adVariations.filter((v: { type: string }) => v.type === "hook");
    const scripts = campaign.adVariations.filter((v: { type: string }) => v.type === "script");
    const briefs = campaign.adVariations.filter((v: { type: string }) => v.type === "brief");

    const lines: string[] = [];

    lines.push(`# ${campaign.name}`);
    lines.push(`**Status:** ${campaign.status} | **Mode:** ${campaign.mode}`);
    lines.push(`**Created:** ${new Date(campaign.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
    if (campaign.productUrl) lines.push(`**Product URL:** ${campaign.productUrl}`);
    lines.push("");

    if (campaign.analysisRun) {
      const run = campaign.analysisRun;
      lines.push("---");
      lines.push("## Analysis");
      if (run.verdict) lines.push(`**Verdict:** ${run.verdict}`);
      if (run.score) lines.push(`**Score:** ${run.score}/100`);
      if (run.summary) lines.push(`\n${run.summary}`);
      lines.push("");
    }

    if (hooks.length) {
      lines.push("---");
      lines.push("## Ad Hooks");
      lines.push("");
      hooks.forEach((v: { content: unknown; name: string; platform: string | null }) => {
        const c = v.content as { format?: string; hook?: string };
        lines.push(`### ${c.format ?? v.name}`);
        if (v.platform) lines.push(`*Platform: ${v.platform}*`);
        lines.push(`> ${c.hook ?? ""}`);
        lines.push("");
      });
    }

    if (scripts.length) {
      lines.push("---");
      lines.push("## Ad Scripts");
      lines.push("");
      scripts.forEach((v: { content: unknown; name: string; platform: string | null }) => {
        const c = v.content as { title?: string; duration?: string; sections?: { timestamp: string; direction: string; copy: string }[] };
        lines.push(`### ${c.title ?? v.name}${c.duration ? ` (${c.duration})` : ""}`);
        if (v.platform) lines.push(`*Platform: ${v.platform}*`);
        lines.push("");
        (c.sections ?? []).forEach((s: { timestamp: string; direction: string; copy: string }) => {
          lines.push(`**[${s.timestamp}]** ${s.direction}`);
          lines.push(`> ${s.copy}`);
          lines.push("");
        });
      });
    }

    if (briefs.length) {
      lines.push("---");
      lines.push("## Creative Briefs");
      lines.push("");
      briefs.forEach((v: { content: unknown; name: string }) => {
        const c = v.content as { title?: string; platform?: string; duration?: string; concept?: string; scenes?: { timestamp: string; shotType: string; visual: string; audio: string; textOverlay: string }[]; productionKit?: { location?: string; casting?: string; lighting?: string; audioStyle?: string }; imageAd?: { headline?: string; bodyCopy?: string; cta?: string } };
        lines.push(`### ${c.title ?? v.name}`);
        if (c.platform) lines.push(`**Platform:** ${c.platform} | **Duration:** ${c.duration ?? "—"}`);
        if (c.concept) lines.push(`\n*${c.concept}*\n`);
        if (c.scenes?.length) {
          lines.push("**Scene Breakdown:**");
          c.scenes.forEach((s: { timestamp: string; shotType: string; visual: string; audio: string; textOverlay: string }) => {
            lines.push(`- **[${s.timestamp}]** ${s.shotType} — ${s.visual}`);
            if (s.audio) lines.push(`  - Audio: ${s.audio}`);
            if (s.textOverlay) lines.push(`  - Text: "${s.textOverlay}"`);
          });
        }
        if (c.productionKit) {
          lines.push("\n**Production Notes:**");
          if (c.productionKit.location) lines.push(`- Location: ${c.productionKit.location}`);
          if (c.productionKit.casting) lines.push(`- Casting: ${c.productionKit.casting}`);
          if (c.productionKit.lighting) lines.push(`- Lighting: ${c.productionKit.lighting}`);
          if (c.productionKit.audioStyle) lines.push(`- Audio: ${c.productionKit.audioStyle}`);
        }
        if (c.imageAd) {
          lines.push("\n**Static Ad Copy:**");
          if (c.imageAd.headline) lines.push(`- Headline: "${c.imageAd.headline}"`);
          if (c.imageAd.bodyCopy) lines.push(`- Body: "${c.imageAd.bodyCopy}"`);
          if (c.imageAd.cta) lines.push(`- CTA: "${c.imageAd.cta}"`);
        }
        lines.push("");
      });
    }

    if (campaign.landingDraft) {
      const lp = campaign.landingDraft;
      lines.push("---");
      lines.push("## Landing Page");
      lines.push("");
      if (lp.headline) lines.push(`**Headline:** ${lp.headline}`);
      if (lp.subheadline) lines.push(`**Subheadline:** ${lp.subheadline}`);
      if (lp.ctaCopy) lines.push(`**CTA:** ${lp.ctaCopy}`);
      if (lp.urgencyLine) lines.push(`**Urgency:** ${lp.urgencyLine}`);
      if (lp.guarantee) lines.push(`**Guarantee:** ${lp.guarantee}`);
      if (Array.isArray(lp.bullets) && lp.bullets.length) {
        lines.push("\n**Benefit Bullets:**");
        (lp.bullets as string[]).forEach((b: string) => lines.push(`- ${b}`));
      }
      if (Array.isArray(lp.trustBar) && lp.trustBar.length) {
        lines.push(`\n**Trust Bar:** ${(lp.trustBar as string[]).join(" · ")}`);
      }
      lines.push("");
    }

    if (campaign.emailDrafts.length) {
      const seqMap: Record<string, string> = { welcome: "Welcome Sequence", cart: "Abandoned Cart", "post-purchase": "Post-Purchase" };
      const seqSet = new Set<string>();
      for (const draft of campaign.emailDrafts as unknown[]) {
        const sequence = (draft as { sequence?: unknown }).sequence;
        if (typeof sequence === "string" && sequence.length > 0) {
          seqSet.add(sequence);
        }
      }
      const seqs = Array.from(seqSet);

      lines.push("---");
      lines.push("## Email Sequences");
      lines.push("");

      seqs.forEach((seq: string) => {
        const emails = campaign.emailDrafts
          .filter((e: { sequence: string }) => e.sequence === seq)
          .sort(
            (a: { position: number }, b: { position: number }) =>
              a.position - b.position
          );
        lines.push(`### ${seqMap[seq] ?? seq}`);
        lines.push("");
        emails.forEach((e: { position: number; timing: string | null; subject: string | null; preview: string | null; body: string | null }) => {
          lines.push(`**Email ${e.position}${e.timing ? ` — ${e.timing}` : ""}**`);
          if (e.subject) lines.push(`Subject: ${e.subject}`);
          if (e.preview) lines.push(`Preview: ${e.preview}`);
          if (e.body) {
            lines.push("");
            lines.push(e.body);
          }
          lines.push("");
        });
      });
    }

    if (campaign.checklistItems.length) {
      const dayMap: Record<string, string> = { day1: "Day 1 — Today", day2: "Day 2", day3: "Day 3", week2: "Week 2", scaling: "Scale Trigger", kill: "Kill Criteria" };
      const daySet = new Set<string>();
      for (const item of campaign.checklistItems as unknown[]) {
        const day = (item as { day?: unknown }).day;
        if (typeof day === "string" && day.length > 0) {
          daySet.add(day);
        }
      }
      const days = Array.from(daySet);

      lines.push("---");
      lines.push("## Execution Checklist");
      lines.push("");

      days.forEach((day: string) => {
        const items = campaign.checklistItems
          .filter((i: { day: string }) => i.day === day)
          .sort(
            (a: { position: number }, b: { position: number }) =>
              a.position - b.position
          );
        lines.push(`### ${dayMap[day] ?? day}`);
        items.forEach((i: { done: boolean; text: string }) => lines.push(`- [${i.done ? "x" : " "}] ${i.text}`));
        lines.push("");
      });
    }

    const content = lines.join("\n");
    const fileName = `${campaign.name.replace(/[^a-z0-9]/gi, "_")}_export.md`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Campaign export error:", err);
    return NextResponse.json({ ok: false, error: "Export failed" }, { status: 500 });
  }
}

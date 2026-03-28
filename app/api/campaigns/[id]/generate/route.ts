import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateAdHooks } from "@/src/logic/ad-os/generateAdHooks";
import { generateAdScripts } from "@/src/logic/ad-os/generateAdScripts";
import { generateAdBriefs } from "@/src/logic/ad-os/generateAdBriefs";
import { generateEmailSequences } from "@/src/logic/ad-os/generateEmailSequences";
import { generateExecutionChecklist } from "@/src/logic/ad-os/generateExecutionChecklist";
import type { DecisionPacket } from "@/src/logic/ad-os/buildDecisionPacket";
import type { AnalysisMode } from "@/src/logic/ad-os/normalizeInput";
import type { OpportunityPacket } from "@/src/logic/ad-os/buildOpportunityPacket";
import type { ExecutionTier } from "@/lib/sites/conversionEngine";

type GenerateType = "hooks" | "scripts" | "briefs" | "emails" | "checklist" | "all";

/**
 * POST /api/campaigns/[id]/generate
 * Regenerates asset package sections for an existing campaign using
 * the stored analysis data. Deletes old entries and creates fresh ones.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json() as { type?: GenerateType };
    const type: GenerateType = body.type ?? "all";

    // Load campaign + analysis data
    const campaign = await prisma.campaign.findUnique({
      where: { id, userId: user.id },
      include: {
        analysisRun: {
          select: {
            mode: true,
            decisionPacket: true,
            opportunityAssessments: {
              select: { opportunityPacket: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    const run = campaign.analysisRun;
    if (!run?.decisionPacket) {
      return NextResponse.json(
        { ok: false, error: "No analysis data found for this campaign. Analyze a product URL first." },
        { status: 400 }
      );
    }

    const packet = run.decisionPacket as unknown as DecisionPacket;
    const mode = (run.mode ?? "operator") as AnalysisMode;
    const opportunityPacket = (run.opportunityAssessments[0]?.opportunityPacket ?? null) as unknown as OpportunityPacket | null;
    const executionTier =
      ((campaign.workflowState as { executionTier?: ExecutionTier } | null | undefined)?.executionTier === "core" ? "core" : "elite") as ExecutionTier;

    const generated: Record<string, unknown> = {};

    // Hooks
    if (type === "hooks" || type === "all") {
      const hooks = generateAdHooks(packet, mode);
      if (executionTier === "elite") {
        hooks.push({
          format: "Elite Angle (Specific Operator Insight)",
          hook:
            mode === "consultant"
              ? `The best-performing operators in this niche fix the revenue leak before they buy more traffic. Most campaigns never address that.`
              : `The ad that wins is usually the one that removes the buying friction, not the one that screams the loudest.`,
        });
      }
      await prisma.adVariation.deleteMany({ where: { campaignId: id, type: "hook" } });
      if (hooks.length) {
        await prisma.adVariation.createMany({
          data: hooks.map((h, i) => ({
            campaignId: id,
            name: h.format,
            type: "hook",
            content: h as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }
      generated.hooks = hooks.length;
    }

    // Scripts
    if (type === "scripts" || type === "all") {
      const scripts = generateAdScripts(packet, mode);
      if (executionTier === "elite") {
        scripts.push({
          title: "Script 4 — Elite Objection Crusher (20–30 sec)",
          duration: "20–30 seconds",
          sections: [
            {
              timestamp: "0–4s",
              direction: "Open on the objection that smart buyers already have.",
              copy:
                mode === "consultant"
                  ? `"You don't need more random leads. You need to stop losing the ones you should already be closing."`
                  : `"You've seen products like this before. The difference is this one actually removes the friction that keeps people from buying."`,
            },
            {
              timestamp: "4–14s",
              direction: "Show the better mechanism and what changes.",
              copy:
                mode === "consultant"
                  ? `"Fix the positioning and trust gap first, then every click gets more valuable."`
                  : `"When the buying path feels safer and clearer, conversion goes up without begging the customer."`,
            },
            {
              timestamp: "14–24s",
              direction: "Close with direct next step.",
              copy:
                mode === "consultant"
                  ? `"If you want the exact gap map for your business, book the audit below."`
                  : `"If you want the stronger version, hit the link below."`,
            },
          ],
        });
      }
      await prisma.adVariation.deleteMany({ where: { campaignId: id, type: "script" } });
      if (scripts.length) {
        await prisma.adVariation.createMany({
          data: scripts.map((s, i) => ({
            campaignId: id,
            name: s.title,
            type: "script",
            content: s as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }
      generated.scripts = scripts.length;
    }

    // Briefs
    if (type === "briefs" || type === "all") {
      const briefs = generateAdBriefs(packet, mode);
      await prisma.adVariation.deleteMany({ where: { campaignId: id, type: "brief" } });
      if (briefs.length) {
        await prisma.adVariation.createMany({
          data: briefs.map((b, i) => ({
            campaignId: id,
            name: b.title,
            type: "brief",
            content: b as object,
            status: "draft",
            sortOrder: i,
          })),
        });
      }
      generated.briefs = briefs.length;
    }

    // Emails
    if (type === "emails" || type === "all") {
      const sequences = generateEmailSequences(packet, mode);
      if (executionTier === "elite") {
        sequences.welcome.push({
          subject: "The real objection that keeps this decision stuck",
          preview: "A quick note on the hesitation point most buyers never say out loud.",
          body: "Most buying decisions stall because of trust, timing, or uncertainty about what happens next. Stronger campaigns remove those frictions directly instead of hoping urgency alone gets the job done.",
          timing: "Day 5",
        });
      }
      await prisma.emailDraft.deleteMany({ where: { campaignId: id } });

      const rows: {
        campaignId: string;
        sequence: string;
        position: number;
        subject: string;
        preview: string;
        body: string;
        timing: string;
        status: string;
      }[] = [];

      const seqMap: [string, typeof sequences.welcome][] = [
        ["welcome", sequences.welcome],
        ["cart", sequences.abandonedCart],
        ["post-purchase", sequences.postPurchase],
      ];

      for (const [seq, emails] of seqMap) {
        emails.forEach((e, i) => {
          rows.push({
            campaignId: id,
            sequence: seq,
            position: i + 1,
            subject: e.subject,
            preview: e.preview,
            body: e.body,
            timing: e.timing,
            status: "draft",
          });
        });
      }

      if (rows.length) {
        await prisma.emailDraft.createMany({ data: rows });
      }
      generated.emails = rows.length;
    }

    // Checklist
    if ((type === "checklist" || type === "all") && opportunityPacket) {
      const checklist = generateExecutionChecklist(opportunityPacket, mode);
      if (executionTier === "elite") {
        checklist.week2 = [
          ...checklist.week2,
          "Elite optimization: spin two sharper variants from the winning hook and one objection-driven version for warmer traffic.",
        ];
      }
      await prisma.checklistItem.deleteMany({ where: { campaignId: id } });

      const items: {
        campaignId: string;
        day: string;
        position: number;
        text: string;
        done: boolean;
      }[] = [];

      const dayMap: [string, string[] | undefined][] = [
        ["day1", checklist.day1],
        ["day2", checklist.day2],
        ["day3", checklist.day3],
        ["week2", checklist.week2],
      ];
      for (const [day, tasks] of dayMap) {
        tasks?.forEach((t, i) => items.push({ campaignId: id, day, position: i, text: t, done: false }));
      }
      if (checklist.scalingTrigger) {
        items.push({ campaignId: id, day: "scaling", position: 0, text: checklist.scalingTrigger, done: false });
      }
      if (checklist.killCriteria) {
        items.push({ campaignId: id, day: "kill", position: 0, text: checklist.killCriteria, done: false });
      }
      if (items.length) {
        await prisma.checklistItem.createMany({ data: items });
      }
      generated.checklist = items.length;
    }

    return NextResponse.json({ ok: true, generated: { ...generated, executionTier }, type });
  } catch (err) {
    console.error("Campaign generate error:", err);
    return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
  }
}

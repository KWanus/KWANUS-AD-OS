import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/campaigns/[id]/analytics
 * Returns campaign performance metrics: variations, emails, checklist progress.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: {
        adVariations: { select: { id: true, type: true, status: true, name: true } },
        emailDrafts: { select: { id: true, sequence: true, status: true } },
        checklistItems: { select: { id: true, done: true, day: true } },
        landingDraft: { select: { id: true, status: true } },
        analysisRun: { select: { score: true, verdict: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    // Variation stats
    const variationsByType: Record<string, { total: number; live: number; winner: number }> = {};
    for (const v of campaign.adVariations) {
      if (!variationsByType[v.type]) variationsByType[v.type] = { total: 0, live: 0, winner: 0 };
      variationsByType[v.type].total++;
      if (v.status === "live") variationsByType[v.type].live++;
      if (v.status === "winner") variationsByType[v.type].winner++;
    }

    // Checklist progress
    const totalChecklist = campaign.checklistItems.length;
    const doneChecklist = campaign.checklistItems.filter(c => c.done).length;
    const checklistByDay: Record<string, { total: number; done: number }> = {};
    for (const c of campaign.checklistItems) {
      if (!checklistByDay[c.day]) checklistByDay[c.day] = { total: 0, done: 0 };
      checklistByDay[c.day].total++;
      if (c.done) checklistByDay[c.day].done++;
    }

    // Email stats
    const emailsBySequence: Record<string, number> = {};
    for (const e of campaign.emailDrafts) {
      emailsBySequence[e.sequence] = (emailsBySequence[e.sequence] ?? 0) + 1;
    }

    // Phase progress
    const phases = ["SOURCE", "AUDIT", "STRATEGIZE", "PRODUCE", "DEPLOY"];
    const currentPhaseIndex = (campaign.currentPhase ?? 1) - 1;

    return NextResponse.json({
      ok: true,
      analytics: {
        campaign: {
          name: campaign.name,
          mode: campaign.mode,
          status: campaign.status,
          currentPhase: phases[currentPhaseIndex] ?? "SOURCE",
          phaseProgress: Math.round(((currentPhaseIndex + 1) / 5) * 100),
        },
        sourceAnalysis: campaign.analysisRun ? {
          score: campaign.analysisRun.score,
          verdict: campaign.analysisRun.verdict,
        } : null,
        variations: {
          total: campaign.adVariations.length,
          byType: variationsByType,
        },
        emails: {
          total: campaign.emailDrafts.length,
          bySequence: emailsBySequence,
        },
        landingPage: campaign.landingDraft ? { status: campaign.landingDraft.status } : null,
        checklist: {
          total: totalChecklist,
          done: doneChecklist,
          progress: totalChecklist > 0 ? Math.round((doneChecklist / totalChecklist) * 100) : 0,
          byDay: checklistByDay,
        },
        daysSinceCreation: Math.round((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (err) {
    console.error("Campaign analytics error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

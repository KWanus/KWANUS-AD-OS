// GET /api/himalaya/projects/[id]/scripts — returns all 10 scripts for a project

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPreBuiltCampaignPackage } from "@/lib/himalaya/campaignPackages";

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
    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { id, userId: user.id },
    });
    if (!deployment) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    // Get the run to find business type/niche
    const run = await prisma.analysisRun.findUnique({
      where: { id: deployment.analysisRunId },
      select: { title: true, mode: true, rawSignals: true, decisionPacket: true },
    }).catch(() => null);

    const foundation = (run?.rawSignals as Record<string, unknown> | null)?.foundation as Record<string, unknown> | undefined;
    const path = (foundation?.path as string) ?? run?.mode ?? "affiliate";
    const packet = run?.decisionPacket as Record<string, string> | null;
    const niche = packet?.audience ?? packet?.angle ?? "business";

    // Get pre-built package
    const pkg = getPreBuiltCampaignPackage({
      businessType: path,
      subNiche: niche,
      targetIncome: 10000,
    });

    if (pkg) {
      return NextResponse.json({
        ok: true,
        scripts: pkg.scripts,
        product: pkg.product,
        contentStrategy: pkg.contentStrategy,
      });
    }

    // Fallback: get scripts from campaign ad variations
    if (deployment.campaignId) {
      const variations = await prisma.adVariation.findMany({
        where: { campaignId: deployment.campaignId, type: "hook" },
        select: { name: true, content: true, platform: true },
        orderBy: { sortOrder: "asc" },
        take: 10,
      });

      const scripts = variations.map((v, i) => {
        const c = v.content as Record<string, string>;
        return {
          id: i + 1,
          title: v.name,
          style: c.format ?? "hook",
          length: "15-20 sec",
          hook: c.hook ?? "",
          body: c.body ?? "",
          cta: c.cta ?? "Link in bio.",
          caption: c.hook ?? "",
          hashtags: [] as string[],
          postFirst: i < 3,
        };
      });

      return NextResponse.json({ ok: true, scripts });
    }

    return NextResponse.json({ ok: true, scripts: [] });
  } catch (err) {
    console.error("Scripts error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

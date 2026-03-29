import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { generateAutomationGraph, type AutomationExecutionTier } from "@/lib/automations/generateAutomationGraph";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      campaignId?: string;
      executionTier?: AutomationExecutionTier;
    };

    if (!body.campaignId) {
      return NextResponse.json({ ok: false, error: "Campaign is required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: body.campaignId, userId: user.id },
      include: {
        landingDraft: {
          select: {
            headline: true,
            ctaCopy: true,
            guarantee: true,
          },
        },
        emailDrafts: {
          orderBy: [{ sequence: "asc" }, { position: "asc" }],
          select: {
            sequence: true,
            subject: true,
            timing: true,
          },
          take: 3,
        },
        checklistItems: {
          orderBy: [{ day: "asc" }, { position: "asc" }],
          select: {
            day: true,
            text: true,
          },
          take: 5,
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    const inheritedTier =
      ((campaign.workflowState as { executionTier?: AutomationExecutionTier } | null | undefined)?.executionTier === "core"
        ? "core"
        : "elite") as AutomationExecutionTier;
    const executionTier = body.executionTier === "core" ? "core" : inheritedTier;

    const graph = generateAutomationGraph(executionTier, {
      name: campaign.name,
      productName: campaign.productName,
      mode: campaign.mode,
      landingDraft: campaign.landingDraft,
      emailDrafts: campaign.emailDrafts,
      checklistItems: campaign.checklistItems,
    });

    return NextResponse.json({
      ok: true,
      automation: {
        name: graph.name,
        nodes: graph.nodes,
        edges: graph.edges,
        summary: graph.summary,
        executionTier,
      },
    });
  } catch (err) {
    console.error("Automation generate:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate automation" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";

/**
 * POST /api/analyses/[id]/create-client
 * Create a CRM client directly from a scan analysis.
 * Pulls title, URL, and niche from the analysis data.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const analysis = await prisma.analysisRun.findFirst({
      where: { id, userId: user.id },
    });

    if (!analysis) {
      return NextResponse.json({ ok: false, error: "Analysis not found" }, { status: 404 });
    }

    const body = await req.json() as {
      name?: string;
      pipelineStage?: string;
      dealValue?: number;
      tags?: string[];
    };

    const name = body.name?.trim() || analysis.title || new URL(analysis.inputUrl).hostname;
    const packet = analysis.decisionPacket as Record<string, unknown> | null;

    // Check for duplicate
    const existing = await prisma.client.findFirst({
      where: { userId: user.id, name },
    });
    if (existing) {
      return NextResponse.json({
        ok: false,
        error: "A client with this name already exists",
        existingClientId: existing.id,
      }, { status: 409 });
    }

    const { score, status } = computeHealthScore({
      lastContactAt: new Date(),
      pipelineStage: body.pipelineStage ?? "lead",
      dealValue: body.dealValue,
      createdAt: new Date(),
    });

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name,
        website: analysis.inputUrl,
        niche: (packet?.niche as string) ?? undefined,
        pipelineStage: body.pipelineStage ?? "lead",
        dealValue: body.dealValue ?? undefined,
        tags: body.tags ?? ["from-scan"],
        healthScore: score,
        healthStatus: status,
        lastContactAt: new Date(),
        priority: "normal",
      },
    });

    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: "note",
        content: `Created from scan analysis. URL: ${analysis.inputUrl}. Score: ${analysis.score ?? 0}/100 (${analysis.verdict ?? "Unknown"}).`,
        metadata: { system: true, analysisId: analysis.id },
        createdBy: user.id,
      },
    });

    return NextResponse.json({ ok: true, client: { id: client.id, name: client.name } });
  } catch (err) {
    console.error("Analysis to client:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

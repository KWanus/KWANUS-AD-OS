import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

type ExecutionTier = "core" | "elite";

function normalizeExecutionTier(value: unknown): ExecutionTier {
  return value === "core" ? "core" : "elite";
}

function mergeExecutionTier(customFields: unknown, executionTier: ExecutionTier) {
  return {
    ...(customFields && typeof customFields === "object" && !Array.isArray(customFields)
      ? (customFields as Record<string, unknown>)
      : {}),
    executionTier,
  };
}

function readExecutionTier(customFields: unknown): ExecutionTier {
  if (!customFields || typeof customFields !== "object" || Array.isArray(customFields)) {
    return "elite";
  }
  return normalizeExecutionTier((customFields as Record<string, unknown>).executionTier);
}

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

    const client = await prisma.client.findFirst({
      where: { id, userId: user.id },
      include: {
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
        _count: { select: { activities: true } },
      },
    });
    if (!client) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      client: {
        ...client,
        executionTier: readExecutionTier(client.customFields),
      },
    });
  } catch (err) {
    console.error("Client GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, client: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      website?: string;
      niche?: string;
      tags?: string[];
      pipelineStage?: string;
      dealValue?: number | null;
      notes?: string;
      priority?: string;
      lastContactAt?: string | null;
      executionTier?: ExecutionTier;
    };

    const VALID_STAGES = ["lead", "qualified", "proposal", "active", "won", "churned"];
    if (body.pipelineStage && !VALID_STAGES.includes(body.pipelineStage)) {
      return NextResponse.json(
        { ok: false, error: `pipelineStage must be one of: ${VALID_STAGES.join(", ")}` },
        { status: 400 }
      );
    }

    const VALID_PRIORITIES = ["low", "normal", "high"];
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json(
        { ok: false, error: `priority must be one of: ${VALID_PRIORITIES.join(", ")}` },
        { status: 400 }
      );
    }

    const executionTier = body.executionTier ? normalizeExecutionTier(body.executionTier) : undefined;

    // If stage is changing, log it
    const existing = await prisma.client.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const newStage = body.pipelineStage ?? existing.pipelineStage;
    const newLastContact = body.lastContactAt !== undefined
      ? (body.lastContactAt ? new Date(body.lastContactAt) : null)
      : existing.lastContactAt;

    const { score, status } = computeHealthScore({
      lastContactAt: newLastContact,
      pipelineStage: newStage,
      dealValue: body.dealValue !== undefined ? body.dealValue : existing.dealValue,
      createdAt: existing.createdAt,
    });

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.company !== undefined && { company: body.company || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.niche !== undefined && { niche: body.niche || null }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.pipelineStage !== undefined && { pipelineStage: body.pipelineStage }),
        ...(body.dealValue !== undefined && { dealValue: body.dealValue }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.lastContactAt !== undefined && { lastContactAt: newLastContact }),
        ...(executionTier !== undefined && { customFields: mergeExecutionTier(existing.customFields, executionTier) }),
        healthScore: score,
        healthStatus: status,
      },
    });

    // Log stage change activity
    if (body.pipelineStage && body.pipelineStage !== existing.pipelineStage) {
      await prisma.clientActivity.create({
        data: {
          clientId: id,
          type: "stage_change",
          content: `Moved from ${existing.pipelineStage} to ${body.pipelineStage}`,
          metadata: { from: existing.pipelineStage, to: body.pipelineStage },
          createdBy: user.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      client: {
        ...client,
        executionTier: executionTier ?? readExecutionTier(client.customFields),
      },
    });
  } catch (err) {
    console.error("Client PATCH:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await prisma.client.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Client DELETE:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

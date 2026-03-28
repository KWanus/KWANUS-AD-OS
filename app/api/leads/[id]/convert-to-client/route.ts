import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";

/**
 * POST /api/leads/[id]/convert-to-client
 * Promote a lead to a full CRM client record.
 * Copies name, niche, website, and creates a client with initial pipeline stage.
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

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
    });

    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    // Check if client already exists with same name
    const existing = await prisma.client.findFirst({
      where: { userId: user.id, name: lead.name },
    });

    if (existing) {
      return NextResponse.json({
        ok: false,
        error: "A client with this name already exists",
        existingClientId: existing.id,
      }, { status: 409 });
    }

    const body = await req.json() as {
      pipelineStage?: string;
      dealValue?: number;
      tags?: string[];
    };

    const ALLOWED_STAGES = ["lead", "qualified", "prospect", "proposal", "negotiation", "won", "lost"] as const;
    const pipelineStage = ALLOWED_STAGES.includes(body.pipelineStage as never)
      ? body.pipelineStage!
      : "qualified";

    if (body.dealValue !== undefined && body.dealValue !== null) {
      if (typeof body.dealValue !== "number" || !isFinite(body.dealValue) || body.dealValue < 0) {
        return NextResponse.json({ ok: false, error: "dealValue must be a non-negative number" }, { status: 400 });
      }
    }
    const dealValue = body.dealValue ?? undefined;

    const { score, status } = computeHealthScore({
      lastContactAt: new Date(),
      pipelineStage,
      dealValue,
      createdAt: new Date(),
    });

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: lead.name,
        email: lead.email ?? undefined,
        phone: lead.phone ?? undefined,
        company: lead.name,
        website: lead.website ?? undefined,
        niche: lead.niche ?? undefined,
        pipelineStage,
        dealValue,
        tags: Array.isArray(body.tags) ? body.tags.slice(0, 20) : ["converted-from-lead"],
        healthScore: score,
        healthStatus: status,
        lastContactAt: new Date(),
        priority: "normal",
      },
    });

    // Log conversion activity
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: "note",
        content: `Converted from lead pipeline. Original lead: ${lead.name} (${lead.niche} - ${lead.location}).`,
        metadata: { system: true, leadId: lead.id },
        createdBy: user.id,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "converted" },
    });

    return NextResponse.json({ ok: true, client: { id: client.id, name: client.name } });
  } catch (err) {
    console.error("Lead convert:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

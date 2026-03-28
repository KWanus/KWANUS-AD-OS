import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";

/**
 * POST /api/email-contacts/[id]/convert-to-client
 * Promote an email subscriber to a full CRM client record.
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

    const contact = await prisma.emailContact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ ok: false, error: "Contact not found" }, { status: 404 });
    }

    const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email;

    // Check if client already exists with same email
    if (contact.email) {
      const existing = await prisma.client.findFirst({
        where: { userId: user.id, email: contact.email },
      });
      if (existing) {
        return NextResponse.json({
          ok: false,
          error: "A client with this email already exists",
          existingClientId: existing.id,
        }, { status: 409 });
      }
    }

    const body = await req.json() as {
      pipelineStage?: string;
      dealValue?: number;
    };

    const ALLOWED_STAGES = ["lead", "prospect", "proposal", "negotiation", "won", "lost"] as const;
    const pipelineStage = ALLOWED_STAGES.includes(body.pipelineStage as never)
      ? body.pipelineStage!
      : "lead";

    // Validate dealValue: must be a non-negative finite number if provided
    const rawDeal = body.dealValue;
    if (rawDeal !== undefined && rawDeal !== null) {
      if (typeof rawDeal !== "number" || !isFinite(rawDeal) || rawDeal < 0) {
        return NextResponse.json({ ok: false, error: "dealValue must be a non-negative number" }, { status: 400 });
      }
    }
    const dealValue = rawDeal ?? undefined;

    const { score, status } = computeHealthScore({
      lastContactAt: new Date(),
      pipelineStage,
      dealValue,
      createdAt: new Date(),
    });

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name,
        email: contact.email,
        pipelineStage,
        dealValue,
        tags: ["converted-from-subscriber", ...(contact.tags as string[] ?? [])],
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
        content: `Promoted from email subscriber (${contact.email}).`,
        metadata: { system: true, contactId: contact.id },
        createdBy: user.id,
      },
    });

    return NextResponse.json({ ok: true, client: { id: client.id, name: client.name } });
  } catch (err) {
    console.error("Contact convert:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

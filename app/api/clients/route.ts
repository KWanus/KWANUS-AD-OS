import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { computeHealthScore } from "@/lib/clients/healthScore";

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

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const stage = searchParams.get("stage") ?? "";
    const health = searchParams.get("health") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    const page  = parseInt(searchParams.get("page")  ?? "1",  10) || 1;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);

    const where = {
      userId: user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { company: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(stage && { pipelineStage: stage }),
      ...(health && { healthStatus: health }),
    };

    const orderBy = sortBy === "healthScore"
      ? { healthScore: "asc" as const }
      : sortBy === "dealValue"
      ? { dealValue: "desc" as const }
      : sortBy === "lastContact"
      ? { lastContactAt: "desc" as const }
      : { updatedAt: "desc" as const };

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { activities: true } } },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      clients: clients.map((client) => ({
        ...client,
        executionTier: readExecutionTier(client.customFields),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("Clients GET:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name: string;
      email?: string;
      phone?: string;
      company?: string;
      website?: string;
      niche?: string;
      tags?: string[];
      pipelineStage?: string;
      dealValue?: number;
      notes?: string;
      sourceCampaignId?: string;
      priority?: string;
      executionTier?: ExecutionTier;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }

    // Duplicate detection — check by name or email
    const duplicateCheck = await prisma.client.findFirst({
      where: {
        userId: user.id,
        OR: [
          { name: body.name.trim() },
          ...(body.email?.trim() ? [{ email: body.email.trim() }] : []),
        ],
      },
      select: { id: true, name: true, email: true },
    });

    if (duplicateCheck) {
      return NextResponse.json({
        ok: false,
        error: `A client with this ${duplicateCheck.name === body.name.trim() ? "name" : "email"} already exists`,
        existingClientId: duplicateCheck.id,
        duplicate: true,
      }, { status: 409 });
    }

    const executionTier = normalizeExecutionTier(body.executionTier);

    const { score, status } = computeHealthScore({
      lastContactAt: null,
      pipelineStage: body.pipelineStage ?? "lead",
      dealValue: body.dealValue,
      createdAt: new Date(),
    });

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        website: body.website?.trim() || null,
        niche: body.niche?.trim() || null,
        tags: body.tags ?? [],
        pipelineStage: body.pipelineStage ?? "lead",
        dealValue: body.dealValue ?? null,
        notes: body.notes?.trim() || null,
        sourceCampaignId: body.sourceCampaignId || null,
        priority: body.priority ?? "normal",
        customFields: mergeExecutionTier(null, executionTier),
        healthScore: score,
        healthStatus: status,
      },
    });

    // Log creation activity
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: "note",
        content: "Client created",
        metadata: { system: true },
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      client: {
        ...client,
        executionTier,
      },
    });
  } catch (err) {
    console.error("Clients POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

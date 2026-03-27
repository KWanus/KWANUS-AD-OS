import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { ARCHETYPES, type BusinessType, type SystemSlug } from "@/lib/archetypes";
import type { Prisma } from "@prisma/client";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

type BusinessProfileBody = {
  businessType?: string;
  businessName?: string;
  niche?: string;
  location?: string;
  website?: string;
  mainOffer?: string;
  offerPrice?: string;
  offerType?: string;
  targetAudience?: string;
  audienceAge?: string;
  audienceGender?: string;
  audiencePains?: string[] | string;
  audienceDesires?: string[] | string;
  stage?: string;
  monthlyRevenue?: string;
  mainGoal?: string;
  activeSystems?: string[];
  systemScore?: number;
  setupCompleted?: boolean;
  setupStep?: number;
};

function normalizeList(input: string[] | string | undefined): string[] | undefined {
  if (Array.isArray(input)) return input.map((item) => item.trim()).filter(Boolean);
  if (typeof input === "string") {
    return input
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return undefined;
}

function computeSystemScore(businessType: BusinessType | null, activeSystems: string[]): number {
  if (!businessType || !ARCHETYPES[businessType]) return Math.min(activeSystems.length * 10, 100);

  const systemMap = new Map(ARCHETYPES[businessType].systems.map((system) => [system.slug, system.priority]));
  let score = 0;
  for (const slug of activeSystems) {
    const priority = systemMap.get(slug as SystemSlug);
    if (priority === "essential") score += 18;
    else if (priority === "recommended") score += 10;
    else if (priority === "optional") score += 5;
    else score += 4;
  }
  return Math.min(score, 100);
}

function toNullableString(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildUpdateData(body: BusinessProfileBody): Prisma.BusinessProfileUncheckedUpdateInput {
  const normalizedPains = normalizeList(body.audiencePains);
  const normalizedDesires = normalizeList(body.audienceDesires);
  const activeSystems = Array.isArray(body.activeSystems)
    ? Array.from(new Set(body.activeSystems.map((item) => item.trim()).filter(Boolean)))
    : undefined;
  const businessType = (body.businessType && body.businessType in ARCHETYPES ? body.businessType : null) as BusinessType | null;
  const systemScore = body.systemScore ?? (activeSystems ? computeSystemScore(businessType, activeSystems) : undefined);

  return {
    ...(body.businessType !== undefined && { businessType: body.businessType }),
    ...(body.businessName !== undefined && { businessName: toNullableString(body.businessName) }),
    ...(body.niche !== undefined && { niche: toNullableString(body.niche) }),
    ...(body.location !== undefined && { location: toNullableString(body.location) }),
    ...(body.website !== undefined && { website: toNullableString(body.website) }),
    ...(body.mainOffer !== undefined && { mainOffer: toNullableString(body.mainOffer) }),
    ...(body.offerPrice !== undefined && { offerPrice: toNullableString(body.offerPrice) }),
    ...(body.offerType !== undefined && { offerType: toNullableString(body.offerType) }),
    ...(body.targetAudience !== undefined && { targetAudience: toNullableString(body.targetAudience) }),
    ...(body.audienceAge !== undefined && { audienceAge: toNullableString(body.audienceAge) }),
    ...(body.audienceGender !== undefined && { audienceGender: toNullableString(body.audienceGender) }),
    ...(normalizedPains !== undefined && { audiencePains: normalizedPains as Prisma.InputJsonValue }),
    ...(normalizedDesires !== undefined && { audienceDesires: normalizedDesires as Prisma.InputJsonValue }),
    ...(body.stage !== undefined && { stage: body.stage }),
    ...(body.monthlyRevenue !== undefined && { monthlyRevenue: toNullableString(body.monthlyRevenue) }),
    ...(body.mainGoal !== undefined && { mainGoal: toNullableString(body.mainGoal) }),
    ...(activeSystems !== undefined && { activeSystems: activeSystems as Prisma.InputJsonValue }),
    ...(systemScore !== undefined && { systemScore }),
    ...(body.setupCompleted !== undefined && { setupCompleted: body.setupCompleted }),
    ...(body.setupStep !== undefined && { setupStep: body.setupStep }),
  };
}

function buildCreateData(userId: string, body: BusinessProfileBody): Prisma.BusinessProfileUncheckedCreateInput {
  const normalizedPains = normalizeList(body.audiencePains) ?? [];
  const normalizedDesires = normalizeList(body.audienceDesires) ?? [];
  const activeSystems = Array.isArray(body.activeSystems)
    ? Array.from(new Set(body.activeSystems.map((item) => item.trim()).filter(Boolean)))
    : [];
  const businessType = (body.businessType && body.businessType in ARCHETYPES ? body.businessType : "local_service") as BusinessType;

  return {
    userId,
    businessType,
    businessName: toNullableString(body.businessName) ?? null,
    niche: toNullableString(body.niche) ?? null,
    location: toNullableString(body.location) ?? null,
    website: toNullableString(body.website) ?? null,
    mainOffer: toNullableString(body.mainOffer) ?? null,
    offerPrice: toNullableString(body.offerPrice) ?? null,
    offerType: toNullableString(body.offerType) ?? null,
    targetAudience: toNullableString(body.targetAudience) ?? null,
    audienceAge: toNullableString(body.audienceAge) ?? null,
    audienceGender: toNullableString(body.audienceGender) ?? null,
    audiencePains: normalizedPains as Prisma.InputJsonValue,
    audienceDesires: normalizedDesires as Prisma.InputJsonValue,
    stage: body.stage ?? "starting",
    monthlyRevenue: toNullableString(body.monthlyRevenue) ?? null,
    mainGoal: toNullableString(body.mainGoal) ?? null,
    activeSystems: activeSystems as Prisma.InputJsonValue,
    systemScore: body.systemScore ?? computeSystemScore(businessType, activeSystems),
    setupCompleted: body.setupCompleted ?? false,
    setupStep: body.setupStep ?? 0,
  };
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error("Business profile GET:", error);
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ ok: true, profile: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to load business profile" }, { status: 500 });
  }
}

async function upsertProfile(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as BusinessProfileBody;
    if (!body.businessType && req.method === "POST") {
      const existing = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Business type is required" }, { status: 400 });
      }
    }

    const updateData = buildUpdateData(body);
    const createData = buildCreateData(user.id, {
      ...body,
      businessType: body.businessType && body.businessType in ARCHETYPES ? body.businessType : (user.businessType as BusinessType | undefined) || "local_service",
    });

    const profile = await prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: createData,
      update: updateData,
    });

    if (body.businessType !== undefined || body.website !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(body.businessType !== undefined && { businessType: body.businessType || null }),
          ...(body.website !== undefined && { businessUrl: toNullableString(body.website) }),
        },
      });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error(`Business profile ${req.method}:`, error);
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { ok: true, profile: null, databaseUnavailable: true, schemaPending: true },
        { status: 200 },
      );
    }
    return NextResponse.json({ ok: false, error: "Failed to save business profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return upsertProfile(req);
}

export async function PATCH(req: NextRequest) {
  return upsertProfile(req);
}

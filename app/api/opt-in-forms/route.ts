import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

const EXECUTION_TIER_PREFIX = "__execution_tier:";

function normalizeExecutionTier(value?: string) {
  return value === "core" ? "core" : "elite";
}

function withExecutionTier(tags: string[] | undefined, tier?: string) {
  const cleaned = (tags ?? []).filter((tag) => !tag.startsWith(EXECUTION_TIER_PREFIX));
  return [...cleaned, `${EXECUTION_TIER_PREFIX}${normalizeExecutionTier(tier)}`];
}

function parseExecutionTier(tags: string[] | undefined) {
  const raw = (tags ?? []).find((tag) => tag.startsWith(EXECUTION_TIER_PREFIX));
  return raw === `${EXECUTION_TIER_PREFIX}core` ? "core" : "elite";
}

function visibleTags(tags: string[] | undefined) {
  return (tags ?? []).filter((tag) => !tag.startsWith(EXECUTION_TIER_PREFIX));
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const forms = await prisma.optInForm.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      forms: forms.map((form) => ({
        ...form,
        tags: visibleTags(form.tags),
        executionTier: parseExecutionTier(form.tags),
      })),
    });
  } catch (err) {
    console.error("OptInForms GET:", err);
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
      headline?: string;
      subheadline?: string;
      buttonText?: string;
      tags?: string[];
      redirectUrl?: string;
      executionTier?: "core" | "elite";
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });
    }

    const form = await prisma.optInForm.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        headline: body.headline?.trim() || null,
        subheadline: body.subheadline?.trim() || null,
        buttonText: body.buttonText?.trim() || "Subscribe",
        tags: withExecutionTier(body.tags, body.executionTier),
        redirectUrl: body.redirectUrl?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, form });
  } catch (err) {
    console.error("OptInForms POST:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

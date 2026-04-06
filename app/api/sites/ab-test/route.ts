// ---------------------------------------------------------------------------
// POST /api/sites/ab-test — create or evaluate an A/B test on a site block
// GET /api/sites/ab-test?siteId=xxx — get active tests for a site
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateHeadlineVariants, hasSignificantWinner } from "@/lib/sites/abTesting";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      siteId: string;
      blockId: string;
      field: string;
      originalValue: string;
    };

    if (!body.siteId || !body.blockId || !body.originalValue) {
      return NextResponse.json({ ok: false, error: "siteId, blockId, originalValue required" }, { status: 400 });
    }

    const variants = generateHeadlineVariants(body.originalValue);

    // Store test in funnel events
    const test = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: user.id,
        event: "ab_test_created",
        metadata: {
          siteId: body.siteId,
          blockId: body.blockId,
          field: body.field ?? "headline",
          status: "running",
          variants: variants.map((v, i) => ({
            id: `v${i}`,
            value: v,
            views: 0,
            conversions: 0,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, testId: test.id, variants });
  } catch (err) {
    console.error("AB test error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const siteId = req.nextUrl.searchParams.get("siteId");

    const tests = await prisma.himalayaFunnelEvent.findMany({
      where: {
        userId: user.id,
        event: "ab_test_created",
        ...(siteId ? { metadata: { path: ["siteId"], equals: siteId } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const results = tests.map((t) => {
      const meta = t.metadata as Record<string, unknown>;
      const variants = (meta.variants as { id: string; value: string; views: number; conversions: number }[]) ?? [];
      const winner = hasSignificantWinner(variants);
      return {
        id: t.id,
        siteId: meta.siteId,
        blockId: meta.blockId,
        field: meta.field,
        status: meta.status,
        variants,
        winner,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json({ ok: true, tests: results });
  } catch (err) {
    console.error("AB test list error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

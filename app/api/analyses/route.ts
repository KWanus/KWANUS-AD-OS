import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") ?? "";
    const verdict = searchParams.get("verdict") ?? "";
    const mode = searchParams.get("mode") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);

    const where = {
      userId: user.id,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { inputUrl: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(verdict && { verdict }),
      ...(mode && { mode }),
    };

    const orderBy = sortBy === "score"
      ? { score: "desc" as const }
      : { createdAt: "desc" as const };

    const [analyses, total] = await Promise.all([
      prisma.analysisRun.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          opportunityAssessments: {
            select: {
              id: true,
              status: true,
              totalScore: true,
              topGaps: true,
              topStrengths: true,
              recommendedPath: true,
            },
            take: 1,
          },
          _count: { select: { assetPackages: true } },
        },
      }),
      prisma.analysisRun.count({ where }),
    ]);

    return NextResponse.json({ ok: true, analyses, total, page, limit });
  } catch (err) {
    console.error("Analyses GET:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, analyses: [], total: 0, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

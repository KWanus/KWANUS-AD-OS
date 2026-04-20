import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: siteId } = await params;

  const body = await req.json() as {
    pageId?: string;
    blockId?: string;
    data?: Record<string, string>;
  };

  if (!body.data || Object.keys(body.data).length === 0) {
    return NextResponse.json({ ok: false, error: "No form data" }, { status: 400 });
  }

  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { id: true } });
  if (!site) {
    return NextResponse.json({ ok: false, error: "Site not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const submission = await prisma.siteFormSubmission.create({
    data: {
      siteId,
      pageId: body.pageId ?? null,
      blockId: body.blockId ?? null,
      data: body.data,
      ip,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true, id: submission.id });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: siteId } = await params;

  const site = await prisma.site.findFirst({
    where: { id: siteId, userId: user.id },
    select: { id: true },
  });
  if (!site) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const [submissions, total] = await Promise.all([
    prisma.siteFormSubmission.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.siteFormSubmission.count({ where: { siteId } }),
  ]);

  return NextResponse.json({
    ok: true,
    submissions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

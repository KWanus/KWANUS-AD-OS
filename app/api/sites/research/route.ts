import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runFullResearch } from "@/lib/sites/competitorResearch";

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    niche?: string;
    urls?: string[];
    location?: string;
  };

  if (!body.niche?.trim()) {
    return NextResponse.json({ ok: false, error: "Niche is required" }, { status: 400 });
  }

  const urls = body.urls?.filter((u) => u.startsWith("http")).slice(0, 5);

  try {
    const { scans, intelligence } = await runFullResearch(
      body.niche.trim(),
      urls,
      body.location?.trim()
    );

    const research = await prisma.nicheResearch.create({
      data: {
        userId: user.id,
        niche: body.niche.trim(),
        location: body.location?.trim() || null,
        competitorUrls: scans.map((s) => s.url),
        scans: scans as never,
        intelligence: intelligence as never,
      },
    });

    return NextResponse.json({
      ok: true,
      researchId: research.id,
      intelligence,
      scans: scans.map((s) => ({
        url: s.url,
        title: s.fetchedPage.title,
        headline: s.signals.headline,
        angle: s.diagnosis.currentAngle,
        strengths: s.diagnosis.strengths,
        weaknesses: s.diagnosis.weaknesses,
      })),
    });
  } catch (err) {
    console.error("Research failed:", err);
    return NextResponse.json(
      { ok: false, error: "Research failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const researches = await prisma.nicheResearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      niche: true,
      location: true,
      competitorUrls: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, researches });
}

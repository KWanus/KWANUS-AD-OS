import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/affiliate/offers — list all offers for user, optional ?niche=&status=&platform=
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const niche = searchParams.get("niche");
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");

    const where: Record<string, unknown> = { userId: user.id };
    if (niche) where.niche = niche;
    if (status) where.status = status;
    if (platform) where.platform = platform;

    const offers = await prisma.affiliateOffer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, offers });
  } catch (err) {
    console.error("Affiliate offers GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load offers" }, { status: 500 });
  }
}

// POST /api/affiliate/offers — create a new offer
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const body = await req.json() as {
      name: string;
      platform: string;
      niche: string;
      url: string;
      affiliateUrl?: string;
      commission?: string;
      gravity?: string;
    };

    if (!body.name?.trim()) return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });
    if (!body.platform?.trim()) return NextResponse.json({ ok: false, error: "platform is required" }, { status: 400 });
    if (!body.niche?.trim()) return NextResponse.json({ ok: false, error: "niche is required" }, { status: 400 });
    if (!body.url?.trim()) return NextResponse.json({ ok: false, error: "url is required" }, { status: 400 });

    const offer = await prisma.affiliateOffer.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        platform: body.platform.trim(),
        niche: body.niche.trim(),
        url: body.url.trim(),
        affiliateUrl: body.affiliateUrl?.trim() ?? null,
        commission: body.commission ?? null,
        gravity: body.gravity ? parseFloat(body.gravity) : null,
        status: "researching",
      },
    });

    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (err) {
    console.error("Affiliate offers POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create offer" }, { status: 500 });
  }
}

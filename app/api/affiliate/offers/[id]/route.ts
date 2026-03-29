import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailable } from "@/lib/db/runtime";

// GET /api/affiliate/offers/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const offer = await prisma.affiliateOffer.findFirst({
      where: { id, userId: user.id },
    });

    if (!offer) return NextResponse.json({ ok: false, error: "Offer not found" }, { status: 404 });

    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    console.error("Affiliate offer GET error:", err);
    if (isDatabaseUnavailable(err)) {
      return NextResponse.json({ ok: true, offer: null, databaseUnavailable: true });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch offer" }, { status: 500 });
  }
}

// PATCH /api/affiliate/offers/[id] — update any fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.affiliateOffer.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Offer not found" }, { status: 404 });

    const body = await req.json() as Record<string, unknown>;

    // Whitelist updatable fields
    const allowed = [
      "name", "platform", "niche", "url", "affiliateUrl", "vendorId",
      "commission", "recurringComm", "epc", "gravity", "convRate",
      "refundRate", "avgOrderValue", "cookieDuration",
      "offerAnalysis", "funnelJson", "trafficAngles",
      "swipeJson", "adHooksJson", "landingJson", "keywordsJson",
      "competitorJson", "status", "notes",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "No valid fields to update" }, { status: 400 });
    }

    const offer = await prisma.affiliateOffer.update({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    console.error("Affiliate offer PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update offer" }, { status: 500 });
  }
}

// DELETE /api/affiliate/offers/[id] — soft delete (status="dropped")
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { id } = await params;

    const existing = await prisma.affiliateOffer.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ ok: false, error: "Offer not found" }, { status: 404 });

    const offer = await prisma.affiliateOffer.update({
      where: { id, userId: user.id },
      data: { status: "dropped" },
    });

    return NextResponse.json({ ok: true, offer });
  } catch (err) {
    console.error("Affiliate offer DELETE error:", err);
    return NextResponse.json({ ok: false, error: "Failed to drop offer" }, { status: 500 });
  }
}

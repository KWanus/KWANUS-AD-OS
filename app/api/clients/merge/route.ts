import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/clients/merge
 * Merge two duplicate client records into one.
 * Keeps the primary client, merges activities from the secondary, then deletes secondary.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      primaryId: string;
      secondaryId: string;
    };

    if (!body.primaryId || !body.secondaryId) {
      return NextResponse.json({ ok: false, error: "primaryId and secondaryId required" }, { status: 400 });
    }

    if (body.primaryId === body.secondaryId) {
      return NextResponse.json({ ok: false, error: "Cannot merge a client with itself" }, { status: 400 });
    }

    const [primary, secondary] = await Promise.all([
      prisma.client.findFirst({ where: { id: body.primaryId, userId: user.id } }),
      prisma.client.findFirst({
        where: { id: body.secondaryId, userId: user.id },
        include: { activities: true },
      }),
    ]);

    if (!primary || !secondary) {
      return NextResponse.json({ ok: false, error: "One or both clients not found" }, { status: 404 });
    }

    // Merge fields — fill in blanks on primary from secondary
    const mergedData: Record<string, unknown> = {};
    if (!primary.email && secondary.email) mergedData.email = secondary.email;
    if (!primary.phone && secondary.phone) mergedData.phone = secondary.phone;
    if (!primary.company && secondary.company) mergedData.company = secondary.company;
    if (!primary.website && secondary.website) mergedData.website = secondary.website;
    if (!primary.niche && secondary.niche) mergedData.niche = secondary.niche;

    // Merge tags (union)
    const primaryTags = (primary.tags as string[]) ?? [];
    const secondaryTags = (secondary.tags as string[]) ?? [];
    const mergedTags = [...new Set([...primaryTags, ...secondaryTags])];
    mergedData.tags = mergedTags;

    // Take higher deal value
    if ((secondary.dealValue ?? 0) > (primary.dealValue ?? 0)) {
      mergedData.dealValue = secondary.dealValue;
    }

    // Merge notes
    if (secondary.notes && primary.notes) {
      mergedData.notes = `${primary.notes}\n\n--- Merged from ${secondary.name} ---\n${secondary.notes}`;
    } else if (secondary.notes) {
      mergedData.notes = secondary.notes;
    }

    // Move activities from secondary to primary
    if (secondary.activities.length > 0) {
      await prisma.clientActivity.updateMany({
        where: { clientId: secondary.id },
        data: { clientId: primary.id },
      });
    }

    // Update primary with merged data
    await prisma.client.update({
      where: { id: primary.id },
      data: mergedData,
    });

    // Log the merge
    await prisma.clientActivity.create({
      data: {
        clientId: primary.id,
        type: "note",
        content: `Merged with "${secondary.name}" — ${secondary.activities.length} activities transferred.`,
        metadata: { system: true, mergedFrom: secondary.id, mergedName: secondary.name },
        createdBy: user.id,
      },
    });

    // Delete secondary
    await prisma.client.delete({ where: { id: secondary.id } });

    return NextResponse.json({
      ok: true,
      mergedClient: { id: primary.id, name: primary.name },
      activitiesMoved: secondary.activities.length,
    });
  } catch (err) {
    console.error("Client merge error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

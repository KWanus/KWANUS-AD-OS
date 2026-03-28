import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/campaigns/[id]/clone
 * Duplicate a campaign with all its assets (variations, landing draft, email drafts, checklist).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const source = await prisma.campaign.findFirst({
      where: { id, userId: user.id },
      include: {
        adVariations: true,
        landingDraft: true,
        emailDrafts: true,
        checklistItems: true,
      },
    });

    if (!source) {
      return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
    }

    // Create the cloned campaign
    const clone = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: `${source.name} (Copy)`,
        mode: source.mode,
        status: "draft",
        productName: source.productName,
        productUrl: source.productUrl,
        sourceUrl: source.sourceUrl,
        sourceType: source.sourceType,
        workflowState: source.workflowState as object ?? undefined,
        notes: source.notes,
      },
    });

    // Clone ad variations
    if (source.adVariations.length > 0) {
      await prisma.adVariation.createMany({
        data: source.adVariations.map(v => ({
          campaignId: clone.id,
          name: v.name,
          type: v.type,
          content: v.content as object,
          status: "draft",
          sortOrder: v.sortOrder,
        })),
      });
    }

    // Clone landing draft
    if (source.landingDraft) {
      const ld = source.landingDraft;
      await prisma.landingDraft.create({
        data: {
          campaignId: clone.id,
          headline: ld.headline,
          subheadline: ld.subheadline,
          trustBar: ld.trustBar as object ?? undefined,
          bullets: ld.bullets as object ?? undefined,
          socialProof: ld.socialProof,
          guarantee: ld.guarantee,
          faqItems: ld.faqItems as object ?? undefined,
          ctaCopy: ld.ctaCopy,
          urgencyLine: ld.urgencyLine,
          status: "draft",
        },
      });
    }

    // Clone email drafts
    if (source.emailDrafts.length > 0) {
      await prisma.emailDraft.createMany({
        data: source.emailDrafts.map(e => ({
          campaignId: clone.id,
          sequence: e.sequence,
          position: e.position,
          subject: e.subject,
          preview: e.preview,
          body: e.body,
          timing: e.timing,
          status: "draft",
        })),
      });
    }

    // Clone checklist items
    if (source.checklistItems.length > 0) {
      await prisma.checklistItem.createMany({
        data: source.checklistItems.map(c => ({
          campaignId: clone.id,
          day: c.day,
          position: c.position,
          text: c.text,
          done: false, // Reset completion
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      campaign: { id: clone.id, name: clone.name },
      cloned: {
        variations: source.adVariations.length,
        landingDraft: source.landingDraft ? 1 : 0,
        emailDrafts: source.emailDrafts.length,
        checklistItems: source.checklistItems.length,
      },
    });
  } catch (err) {
    console.error("Campaign clone error:", err);
    return NextResponse.json({ ok: false, error: "Failed to clone campaign" }, { status: 500 });
  }
}

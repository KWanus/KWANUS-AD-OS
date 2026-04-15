import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** DELETE /api/himalaya/projects/[id] — delete a business and all its assets */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { id } = await params;

    const deployment = await prisma.himalayaDeployment.findFirst({
      where: { id, userId: user.id },
    });

    if (!deployment) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    // Delete in order: variations → campaign, pages → site, flow, deployment
    if (deployment.campaignId) {
      await prisma.adVariation.deleteMany({ where: { campaignId: deployment.campaignId } }).catch(() => {});
      await prisma.emailDraft.deleteMany({ where: { campaignId: deployment.campaignId } }).catch(() => {});
      await prisma.landingDraft.deleteMany({ where: { campaignId: deployment.campaignId } }).catch(() => {});
      await prisma.checklistItem.deleteMany({ where: { campaignId: deployment.campaignId } }).catch(() => {});
      await prisma.creativeWork.deleteMany({ where: { campaignId: deployment.campaignId } }).catch(() => {});
      await prisma.campaign.delete({ where: { id: deployment.campaignId } }).catch(() => {});
    }

    if (deployment.siteId) {
      await prisma.sitePage.deleteMany({ where: { siteId: deployment.siteId } }).catch(() => {});
      await prisma.siteProduct.deleteMany({ where: { siteId: deployment.siteId } }).catch(() => {});
      await prisma.siteOrder.deleteMany({ where: { siteId: deployment.siteId } }).catch(() => {});
      await prisma.site.delete({ where: { id: deployment.siteId } }).catch(() => {});
    }

    if (deployment.emailFlowId) {
      await prisma.emailFlowEnrollment.deleteMany({ where: { flowId: deployment.emailFlowId } }).catch(() => {});
      await prisma.emailFlow.delete({ where: { id: deployment.emailFlowId } }).catch(() => {});
    }

    // Delete the deployment record itself
    await prisma.himalayaDeployment.delete({ where: { id } }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete project error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

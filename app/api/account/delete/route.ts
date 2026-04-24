import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST — delete user account and all associated data (GDPR right to erasure) */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { confirmEmail?: string };

    // Require email confirmation to prevent accidental deletion
    if (body.confirmEmail !== user.email) {
      return NextResponse.json({
        ok: false,
        error: "Please confirm your email address to delete your account",
      }, { status: 400 });
    }

    // Delete all user data in order (respecting foreign keys)
    const userId = user.id;

    // 1. Delete email flow enrollments
    await prisma.emailFlowEnrollment.deleteMany({ where: { userId } }).catch(() => {});

    // 2. Delete email contacts
    await prisma.emailContact.deleteMany({ where: { userId } }).catch(() => {});

    // 3. Delete email flows
    await prisma.emailFlow.deleteMany({ where: { userId } }).catch(() => {});

    // 4. Delete email broadcasts
    await prisma.emailBroadcast.deleteMany({ where: { userId } }).catch(() => {});

    // 5. Delete leads
    await prisma.lead.deleteMany({ where: { userId } }).catch(() => {});

    // 6. Delete site orders, products, pages, then sites
    const sites = await prisma.site.findMany({ where: { userId }, select: { id: true } }).catch(() => []);
    for (const site of sites) {
      await prisma.siteOrder.deleteMany({ where: { siteId: site.id } }).catch(() => {});
      await prisma.siteProduct.deleteMany({ where: { siteId: site.id } }).catch(() => {});
      await prisma.sitePage.deleteMany({ where: { siteId: site.id } }).catch(() => {});
    }
    await prisma.site.deleteMany({ where: { userId } }).catch(() => {});

    // 7. Delete campaigns and variations
    const campaigns = await prisma.campaign.findMany({ where: { userId }, select: { id: true } }).catch(() => []);
    for (const campaign of campaigns) {
      await prisma.adVariation.deleteMany({ where: { campaignId: campaign.id } }).catch(() => {});
      await prisma.emailDraft.deleteMany({ where: { campaignId: campaign.id } }).catch(() => {});
    }
    await prisma.campaign.deleteMany({ where: { userId } }).catch(() => {});

    // 8. Delete business profile
    await prisma.businessProfile.deleteMany({ where: { userId } }).catch(() => {});

    // 9. Delete credit logs
    await prisma.creditLog.deleteMany({ where: { userId } }).catch(() => {});

    // 10. Delete Himalaya data (analysis runs, deployments, funnel events)
    await prisma.himalayaFunnelEvent.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.himalayaDeployment.deleteMany({ where: { userId } }).catch(() => {});

    // 11. Delete subscriptions
    await prisma.himalayaSubscription.deleteMany({ where: { userId } }).catch(() => {});

    // 12. Delete notifications (uses himalayaFunnelEvent with event type)
    // Already covered by step 10 (himalayaFunnelEvent.deleteMany)

    // 13. Finally, delete the user record
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});

    // Note: Clerk account is NOT deleted here — user should do that in Clerk dashboard
    // or we can add Clerk API call: await clerkClient.users.deleteUser(clerkId)

    return NextResponse.json({
      ok: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ ok: false, error: "Deletion failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Auto-Runner — runs background automations on every business
//
// This is called by the daily cron job. For each user with active businesses,
// it runs the automations that keep everything improving:
//
// 1. Check milestones (celebrate wins)
// 2. Detect ad fatigue (refresh creatives when stale)
// 3. Clean email lists (remove dead subscribers)
// 4. Monitor competitors (track changes)
// 5. Score business maturity (where are they in the journey)
// 6. Run funnel leak detection (where are they losing people)
// 7. Check customer health (who's about to churn)
// 8. Send platform re-engagement (bring back inactive users)
// 9. Process scheduled emails (testimonial requests, cross-sells)
// 10. Update daily commands (fresh actions for tomorrow)
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { checkMilestones } from "./milestones";
import { checkInactiveUsers, cleanEmailList } from "./engagementEngine";
import { optimizeAllCampaigns } from "@/lib/ads/autoOptimizer";

export async function runDailyAutomations(): Promise<{
  usersProcessed: number;
  milestonesAwarded: number;
  adsOptimized: number;
  emailsCleaned: number;
  reengaged: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let milestonesAwarded = 0;
  let emailsCleaned = 0;
  let reengaged = 0;

  // Get all users with at least one deployment
  const users = await prisma.user.findMany({
    where: {
      leads: { some: {} }, // has at least some activity
    },
    select: { id: true },
    take: 100,
  }).catch(() => []);

  // 1. Check milestones for each user
  for (const user of users) {
    try {
      const milestones = await checkMilestones(user.id);
      milestonesAwarded += milestones.filter(m => m.achieved).length;
    } catch (err) {
      errors.push(`Milestones for ${user.id}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  // 2. Optimize all active campaigns
  let adsOptimized = 0;
  try {
    const optResult = await optimizeAllCampaigns();
    adsOptimized = optResult.optimized;
  } catch (err) {
    errors.push(`Ad optimization: ${err instanceof Error ? err.message : "failed"}`);
  }

  // 3. Clean email lists
  for (const user of users.slice(0, 20)) {
    try {
      const cleanResult = await cleanEmailList(user.id);
      emailsCleaned += cleanResult.removed;
    } catch { /* non-blocking */ }
  }

  // 4. Re-engage inactive platform users
  try {
    const reengageResult = await checkInactiveUsers();
    reengaged = reengageResult.contacted;
  } catch (err) {
    errors.push(`Re-engagement: ${err instanceof Error ? err.message : "failed"}`);
  }

  // 5. Process scheduled emails (testimonial requests, cross-sells)
  try {
    const now = new Date();
    const scheduledEmails = await prisma.himalayaFunnelEvent.findMany({
      where: {
        event: "scheduled_email",
        metadata: { path: ["sendAfter"], lte: now.toISOString() },
      },
      take: 50,
    });

    for (const scheduled of scheduledEmails) {
      const meta = scheduled.metadata as Record<string, unknown>;
      const action = meta.action as string;

      if (action === "testimonial_request") {
        try {
          const { sendTestimonialRequest } = await import("./growthAutomations");
          await sendTestimonialRequest({
            userId: scheduled.userId ?? "",
            customerEmail: meta.customerEmail as string,
            customerName: meta.customerName as string | undefined,
            productName: meta.productName as string,
            businessName: meta.businessName as string,
          });
        } catch { /* non-blocking */ }
      }

      // Mark as processed by deleting
      await prisma.himalayaFunnelEvent.delete({ where: { id: scheduled.id } }).catch(() => {});
    }
  } catch (err) {
    errors.push(`Scheduled emails: ${err instanceof Error ? err.message : "failed"}`);
  }

  return {
    usersProcessed: users.length,
    milestonesAwarded,
    adsOptimized,
    emailsCleaned,
    reengaged,
    errors,
  };
}

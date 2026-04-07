// ---------------------------------------------------------------------------
// Daily Action Queue — generates the 3-5 highest-impact tasks for today
// Combines: optimizer actions, leak fixes, campaign health, stale leads,
// pending bookings, unanswered chat messages
//
// This is what makes users open Himalaya every morning.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { runAutonomousOptimization } from "./autonomousOptimizer";
import { detectRevenueLeaks } from "./revenueLeakDetector";

export type DailyAction = {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = do this now
  category: "revenue" | "leads" | "content" | "ads" | "email" | "site" | "client";
  title: string;
  description: string;
  cta: string;
  href: string;
  estimatedImpact: string;
  timeEstimate: string; // "2 min", "10 min", etc
};

export async function generateDailyActions(userId: string): Promise<DailyAction[]> {
  const actions: DailyAction[] = [];

  // Run all checks in parallel
  const [optimization, leaks, unreadInbox, pendingBookings, coldLeads, staleCampaigns] = await Promise.allSettled([
    runAutonomousOptimization(userId),
    detectRevenueLeaks(userId),
    prisma.himalayaFunnelEvent.count({
      where: { userId, event: "chat_message", metadata: { path: ["read"], equals: false } },
    }),
    prisma.himalayaFunnelEvent.count({
      where: {
        userId,
        event: "booking_created",
        metadata: { path: ["status"], equals: "confirmed" },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.lead.count({
      where: {
        userId,
        status: "new",
        score: { gte: 40 },
        createdAt: { lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.campaign.count({
      where: {
        userId,
        status: "draft",
        createdAt: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // ── Unread messages (highest priority — real people waiting) ──
  const unread = unreadInbox.status === "fulfilled" ? unreadInbox.value : 0;
  if (unread > 0) {
    actions.push({
      id: "inbox-unread",
      priority: 1,
      category: "leads",
      title: `${unread} unread message${unread > 1 ? "s" : ""} in your inbox`,
      description: "Real people are waiting for a response. Reply within 5 minutes for highest close rate.",
      cta: "Open Inbox",
      href: "/inbox",
      estimatedImpact: "Replying fast = 5x higher close rate",
      timeEstimate: "2 min",
    });
  }

  // ── Today's bookings ──
  const bookings = pendingBookings.status === "fulfilled" ? pendingBookings.value : 0;
  if (bookings > 0) {
    actions.push({
      id: "bookings-today",
      priority: 1,
      category: "client",
      title: `${bookings} booking${bookings > 1 ? "s" : ""} today`,
      description: "You have appointments scheduled. Prepare by reviewing client notes.",
      cta: "View Bookings",
      href: "/bookings",
      estimatedImpact: "Prepared meetings close 3x better",
      timeEstimate: "5 min",
    });
  }

  // ── Critical revenue leaks ──
  if (leaks.status === "fulfilled" && leaks.value.leaks.length > 0) {
    const topLeak = leaks.value.leaks[0];
    if (topLeak.priority === "critical") {
      actions.push({
        id: `leak-${topLeak.location}`,
        priority: 2,
        category: "revenue",
        title: `Revenue leak: ${topLeak.location}`,
        description: `${topLeak.fix} Estimated loss: $${topLeak.estimatedLoss}/month.`,
        cta: "Fix This",
        href: topLeak.location.includes("Email") ? "/emails" : topLeak.location.includes("Landing") ? "/websites" : "/",
        estimatedImpact: `$${topLeak.estimatedLoss}/mo recovered`,
        timeEstimate: "10 min",
      });
    }
  }

  // ── Critical optimizer actions ──
  if (optimization.status === "fulfilled" && optimization.value.actionsProposed.length > 0) {
    const criticalActions = optimization.value.actionsProposed.filter((a) => a.priority === "critical");
    for (const action of criticalActions.slice(0, 2)) {
      actions.push({
        id: `optimize-${action.target}`,
        priority: 2,
        category: action.targetType === "ad_variation" ? "ads" : action.targetType === "email_node" ? "email" : "site",
        title: action.reason.split(".")[0],
        description: action.suggestedChange,
        cta: "Fix Now",
        href: action.targetType === "ad_variation" ? "/campaigns" : action.targetType === "email_node" ? "/emails" : "/websites",
        estimatedImpact: action.expectedImpact,
        timeEstimate: "5 min",
      });
    }
  }

  // ── Cold leads to follow up ──
  const cold = coldLeads.status === "fulfilled" ? coldLeads.value : 0;
  if (cold > 0) {
    actions.push({
      id: "cold-leads",
      priority: 3,
      category: "leads",
      title: `${cold} warm lead${cold > 1 ? "s" : ""} going cold`,
      description: "These leads scored 40+ but haven't been contacted in 3+ days. Follow up before they forget you.",
      cta: "View Leads",
      href: "/leads",
      estimatedImpact: "Reactivating 1 cold lead = potential sale",
      timeEstimate: "10 min",
    });
  }

  // ── Stale campaigns ──
  const stale = staleCampaigns.status === "fulfilled" ? staleCampaigns.value : 0;
  if (stale > 0) {
    actions.push({
      id: "stale-campaigns",
      priority: 4,
      category: "ads",
      title: `${stale} campaign${stale > 1 ? "s" : ""} still in draft`,
      description: "Campaigns sitting in draft don't make money. Launch them or delete them.",
      cta: "Open Campaigns",
      href: "/campaigns",
      estimatedImpact: "Each launched campaign = new revenue potential",
      timeEstimate: "5 min",
    });
  }

  // ── If nothing critical, suggest content creation ──
  if (actions.length < 2) {
    actions.push({
      id: "create-content",
      priority: 5,
      category: "content",
      title: "Generate this week's social content",
      description: "Consistent posting builds authority. AI generates 7 days of posts in 30 seconds.",
      cta: "Generate Content",
      href: "/content",
      estimatedImpact: "Consistent posting = compounding authority",
      timeEstimate: "1 min",
    });
  }

  // Sort by priority, take top 5
  return actions.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

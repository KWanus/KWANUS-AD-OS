// ---------------------------------------------------------------------------
// Audience Intelligence — analyze and segment audiences from contact data
// Builds segments for targeted campaigns
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type AudienceSegment = {
  name: string;
  size: number;
  criteria: string;
  tags: string[];
  avgScore: number;
  topSource: string;
  engagement: "high" | "medium" | "low";
};

export type AudienceReport = {
  totalContacts: number;
  subscribedCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
  segments: AudienceSegment[];
  topSources: { source: string; count: number }[];
  growthRate: number; // contacts added in last 30 days
};

export async function buildAudienceReport(userId: string): Promise<AudienceReport> {
  const [contacts, recentContacts] = await Promise.all([
    prisma.emailContact.findMany({
      where: { userId },
      select: { status: true, source: true, tags: true, createdAt: true },
    }),
    prisma.emailContact.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalContacts = contacts.length;
  const subscribedCount = contacts.filter((c) => c.status === "subscribed").length;
  const unsubscribedCount = contacts.filter((c) => c.status === "unsubscribed").length;
  const bouncedCount = contacts.filter((c) => c.status === "bounced").length;

  // Source analysis
  const sourceMap: Record<string, number> = {};
  for (const c of contacts) {
    const source = c.source ?? "unknown";
    const key = source.split(":")[0]; // "site:xxx" → "site"
    sourceMap[key] = (sourceMap[key] ?? 0) + 1;
  }
  const topSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  // Auto-segments
  const segments: AudienceSegment[] = [];

  // Segment: Site visitors who submitted forms
  const siteContacts = contacts.filter((c) => c.source?.startsWith("site:"));
  if (siteContacts.length > 0) {
    segments.push({
      name: "Website Leads",
      size: siteContacts.length,
      criteria: "Submitted a form on your site",
      tags: ["site-form"],
      avgScore: 45,
      topSource: "site",
      engagement: siteContacts.length > 10 ? "high" : "medium",
    });
  }

  // Segment: Purchasers
  const purchasers = contacts.filter((c) => c.tags.includes("customer") || c.tags.includes("purchaser"));
  if (purchasers.length > 0) {
    segments.push({
      name: "Customers",
      size: purchasers.length,
      criteria: "Made a purchase",
      tags: ["customer"],
      avgScore: 90,
      topSource: "purchase",
      engagement: "high",
    });
  }

  // Segment: Recent (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentWeek = contacts.filter((c) => new Date(c.createdAt).getTime() > weekAgo);
  if (recentWeek.length > 0) {
    segments.push({
      name: "New This Week",
      size: recentWeek.length,
      criteria: "Joined in the last 7 days",
      tags: [],
      avgScore: 40,
      topSource: topSources[0]?.source ?? "unknown",
      engagement: "high",
    });
  }

  // Segment: Auto-enrolled
  const autoEnrolled = contacts.filter((c) => c.tags.includes("himalaya-auto-enroll"));
  if (autoEnrolled.length > 0) {
    segments.push({
      name: "Auto-Enrolled",
      size: autoEnrolled.length,
      criteria: "Automatically enrolled from Himalaya deploy",
      tags: ["himalaya-auto-enroll"],
      avgScore: 50,
      topSource: "himalaya",
      engagement: "medium",
    });
  }

  // Segment: Partial (abandoned form)
  const partials = contacts.filter((c) => c.status === "partial");
  if (partials.length > 0) {
    segments.push({
      name: "Abandoned Form",
      size: partials.length,
      criteria: "Started but didn't complete form",
      tags: ["partial-form"],
      avgScore: 15,
      topSource: "partial",
      engagement: "low",
    });
  }

  return {
    totalContacts,
    subscribedCount,
    unsubscribedCount,
    bouncedCount,
    segments,
    topSources,
    growthRate: recentContacts,
  };
}

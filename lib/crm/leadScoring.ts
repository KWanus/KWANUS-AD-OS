// ---------------------------------------------------------------------------
// Smart Lead Scoring — AI-powered lead prioritization
//
// Automatically scores leads 0-100 based on:
// 1. Engagement signals (email opens, clicks, website visits)
// 2. Demographic fit (company size, industry, location)
// 3. Behavioral patterns (reply speed, questions asked, objections)
// 4. Deal indicators (budget mentioned, timeline discussed, authority confirmed)
//
// Scoring tiers:
// - 0-25: Cold (ignore for now)
// - 26-50: Warm (follow up in 7 days)
// - 51-75: Hot (follow up in 24 hours)
// - 76-100: Ready to Buy (call immediately)
//
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type LeadScore = {
  leadId: string;
  score: number;          // 0-100
  tier: "cold" | "warm" | "hot" | "ready";
  signals: {
    engagement: number;   // 0-40 points
    fit: number;          // 0-30 points
    behavior: number;     // 0-20 points
    dealIndicators: number; // 0-10 points
  };
  reasons: string[];      // Why this score?
  nextAction: string;     // What to do next
  urgency: "low" | "medium" | "high" | "urgent";
};

/** Calculate lead score */
export async function calculateLeadScore(leadId: string): Promise<LeadScore> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      email: true,
      emailOpened: true,
      emailReplied: true,
      outreachSentAt: true,
      website: true,
      rating: true,
      reviewCount: true,
      niche: true,
      location: true,
      notes: true,
      status: true,
    },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  // Get email tracking data
  const emailTracking = await prisma.emailTracking.findMany({
    where: { leadId },
    select: {
      opened: true,
      clicked: true,
      replied: true,
      sentAt: true,
      openedAt: true,
      repliedAt: true,
    },
  });

  let engagementScore = 0;
  let fitScore = 0;
  let behaviorScore = 0;
  let dealIndicatorScore = 0;
  const reasons: string[] = [];

  // ═══ ENGAGEMENT SCORING (0-40 points) ═══
  if (emailTracking.length > 0) {
    const openRate = emailTracking.filter(e => e.opened).length / emailTracking.length;
    const clickRate = emailTracking.filter(e => e.clicked).length / emailTracking.length;
    const replyRate = emailTracking.filter(e => e.replied).length / emailTracking.length;

    // Opened emails: up to 10 points
    if (openRate > 0.7) {
      engagementScore += 10;
      reasons.push("Opens most emails (70%+)");
    } else if (openRate > 0.4) {
      engagementScore += 5;
      reasons.push("Opens some emails");
    }

    // Clicked links: up to 15 points
    if (clickRate > 0.5) {
      engagementScore += 15;
      reasons.push("Clicks links frequently");
    } else if (clickRate > 0.2) {
      engagementScore += 8;
      reasons.push("Has clicked links");
    }

    // Replied: up to 15 points
    if (replyRate > 0) {
      engagementScore += 15;
      reasons.push("Has replied to emails");

      // Fast reply = bonus points
      const fastReplies = emailTracking.filter(e => {
        if (!e.repliedAt || !e.sentAt) return false;
        const hoursDiff = (e.repliedAt.getTime() - e.sentAt.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24;
      });
      if (fastReplies.length > 0) {
        behaviorScore += 10;
        reasons.push("Replies quickly (<24h)");
      }
    }
  }

  // ═══ FIT SCORING (0-30 points) ═══
  // Business quality (Google rating + review count)
  if (lead.rating && lead.reviewCount) {
    if (lead.rating >= 4.5 && lead.reviewCount >= 50) {
      fitScore += 15;
      reasons.push("High-quality business (4.5★, 50+ reviews)");
    } else if (lead.rating >= 4.0 && lead.reviewCount >= 20) {
      fitScore += 10;
      reasons.push("Established business");
    } else if (lead.rating >= 3.5) {
      fitScore += 5;
    }
  }

  // Has website: 10 points
  if (lead.website) {
    fitScore += 10;
    reasons.push("Has a website");
  }

  // Niche fit (can be customized per user's target niche)
  const highValueNiches = ["dentist", "law firm", "hvac", "med spa", "real estate"];
  if (highValueNiches.some(n => lead.niche.toLowerCase().includes(n))) {
    fitScore += 5;
    reasons.push("High-value niche");
  }

  // ═══ BEHAVIOR SCORING (0-20 points) ═══
  // Manually advanced status
  if (lead.status === "qualified") {
    behaviorScore += 10;
    reasons.push("Manually qualified");
  } else if (lead.status === "contacted") {
    behaviorScore += 5;
  }

  // Has notes (indicates personal attention)
  if (lead.notes && lead.notes.length > 20) {
    behaviorScore += 5;
    reasons.push("Has detailed notes");
  }

  // Recent activity
  if (lead.outreachSentAt) {
    const daysSince = (Date.now() - lead.outreachSentAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) {
      behaviorScore += 5;
      reasons.push("Recent outreach");
    }
  }

  // ═══ DEAL INDICATOR SCORING (0-10 points) ═══
  // Parse notes for buying signals
  const buyingSignals = [
    "budget", "price", "pricing", "cost", "how much",
    "timeline", "when", "start date",
    "decision", "approved", "ready",
    "interested", "excited",
  ];
  if (lead.notes) {
    const notesLower = lead.notes.toLowerCase();
    const signalCount = buyingSignals.filter(signal => notesLower.includes(signal)).length;
    if (signalCount >= 3) {
      dealIndicatorScore += 10;
      reasons.push("Multiple buying signals in notes");
    } else if (signalCount >= 1) {
      dealIndicatorScore += 5;
      reasons.push("Buying signals detected");
    }
  }

  // ═══ CALCULATE TOTAL SCORE ═══
  const totalScore = Math.min(100, engagementScore + fitScore + behaviorScore + dealIndicatorScore);

  // Determine tier
  let tier: "cold" | "warm" | "hot" | "ready" = "cold";
  let urgency: "low" | "medium" | "high" | "urgent" = "low";
  let nextAction = "";

  if (totalScore >= 76) {
    tier = "ready";
    urgency = "urgent";
    nextAction = "Call immediately — this lead is ready to buy";
  } else if (totalScore >= 51) {
    tier = "hot";
    urgency = "high";
    nextAction = "Follow up within 24 hours with a personalized message";
  } else if (totalScore >= 26) {
    tier = "warm";
    urgency = "medium";
    nextAction = "Schedule follow-up in 3-7 days";
  } else {
    tier = "cold";
    urgency = "low";
    nextAction = "Keep in nurture sequence, check back in 30 days";
  }

  return {
    leadId: lead.id,
    score: totalScore,
    tier,
    signals: {
      engagement: engagementScore,
      fit: fitScore,
      behavior: behaviorScore,
      dealIndicators: dealIndicatorScore,
    },
    reasons,
    nextAction,
    urgency,
  };
}

/** Batch score all leads for a user */
export async function scoreAllLeads(userId: string): Promise<LeadScore[]> {
  const leads = await prisma.lead.findMany({
    where: { userId },
    select: { id: true },
  });

  const scores: LeadScore[] = [];
  for (const lead of leads) {
    try {
      const score = await calculateLeadScore(lead.id);
      scores.push(score);

      // Update lead score in database
      await prisma.lead.update({
        where: { id: lead.id },
        data: { score: score.score },
      });
    } catch (err) {
      console.error(`Failed to score lead ${lead.id}:`, err);
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

/** Get top hot leads for a user */
export async function getHotLeads(userId: string, limit = 10): Promise<Array<{
  id: string;
  name: string;
  email: string | null;
  score: number;
  tier: string;
  urgency: string;
  nextAction: string;
  reasons: string[];
}>> {
  const leads = await prisma.lead.findMany({
    where: {
      userId,
      score: { gte: 51 }, // Hot and Ready leads only
    },
    orderBy: { score: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      score: true,
    },
  });

  const enrichedLeads = [];
  for (const lead of leads) {
    const scoreData = await calculateLeadScore(lead.id);
    enrichedLeads.push({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      score: scoreData.score,
      tier: scoreData.tier,
      urgency: scoreData.urgency,
      nextAction: scoreData.nextAction,
      reasons: scoreData.reasons,
    });
  }

  return enrichedLeads;
}

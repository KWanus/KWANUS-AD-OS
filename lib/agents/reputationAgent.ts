// ---------------------------------------------------------------------------
// Reputation Management Agent
// Monitors reviews, generates responses, requests new reviews
// Tracks business reputation score over time
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/notify";

export type Review = {
  platform: "google" | "yelp" | "facebook" | "trustpilot" | "internal";
  author: string;
  rating: number;
  text: string;
  date: string;
  responded: boolean;
};

export type ReputationScore = {
  overall: number;         // 0-100
  avgRating: number;       // 1-5
  totalReviews: number;
  responseRate: number;    // % of reviews responded to
  sentiment: "positive" | "neutral" | "negative";
  trend: "improving" | "stable" | "declining";
};

/** Generate an AI response to a review */
export function generateReviewResponse(review: Review, businessName: string): string {
  if (review.rating >= 4) {
    return `Thank you so much for the wonderful review, ${review.author}! We're thrilled to hear about your experience with ${businessName}. Your feedback means the world to us. We look forward to serving you again!`;
  }

  if (review.rating === 3) {
    return `Thank you for sharing your feedback, ${review.author}. We appreciate your honest review and are always looking for ways to improve. We'd love to hear more about how we can make your next experience better — please feel free to reach out to us directly.`;
  }

  // Negative review
  return `${review.author}, thank you for taking the time to share your feedback. We're sorry to hear that your experience didn't meet expectations. This isn't the standard we hold ourselves to at ${businessName}. We'd like to make this right — please reach out to us directly so we can address your concerns.`;
}

/** Generate a review request message (email or SMS) */
export function generateReviewRequest(input: {
  customerName: string;
  businessName: string;
  reviewUrl: string;
  channel: "email" | "sms";
}): { subject?: string; body: string } {
  if (input.channel === "sms") {
    return {
      body: `Hi ${input.customerName}! Thanks for choosing ${input.businessName}. If you had a great experience, we'd love a quick review — it helps others find us. ${input.reviewUrl}`,
    };
  }

  return {
    subject: `${input.customerName}, how was your experience with ${input.businessName}?`,
    body: `Hi ${input.customerName},\n\nThank you for choosing ${input.businessName}! We hope you had a great experience.\n\nIf you have a moment, we'd really appreciate a quick review. It only takes 30 seconds and it helps other people like you find us:\n\n${input.reviewUrl}\n\nYour feedback means everything to us — whether it's praise or suggestions for improvement.\n\nThank you!\n${input.businessName}`,
  };
}

/** Calculate reputation score from reviews */
export function calculateReputationScore(reviews: Review[]): ReputationScore {
  if (reviews.length === 0) {
    return { overall: 50, avgRating: 0, totalReviews: 0, responseRate: 0, sentiment: "neutral", trend: "stable" };
  }

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const responded = reviews.filter((r) => r.responded).length;
  const responseRate = (responded / reviews.length) * 100;

  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const sentiment: ReputationScore["sentiment"] =
    positive > reviews.length * 0.7 ? "positive" :
    negative > reviews.length * 0.3 ? "negative" : "neutral";

  // Score: rating (50%) + response rate (25%) + volume (25%)
  let overall = 0;
  overall += (avgRating / 5) * 50;
  overall += (responseRate / 100) * 25;
  overall += Math.min(reviews.length / 50, 1) * 25; // Max at 50 reviews

  return {
    overall: Math.round(overall),
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: reviews.length,
    responseRate: Math.round(responseRate),
    sentiment,
    trend: "stable",
  };
}

/** Auto-send review requests to recent customers */
export async function autoRequestReviews(userId: string): Promise<{ sent: number }> {
  // Find recent customers who haven't been asked
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentCustomers = await prisma.emailContact.findMany({
    where: {
      userId,
      tags: { hasSome: ["customer", "purchaser"] },
      createdAt: { gte: sevenDaysAgo, lte: threeDaysAgo },
    },
    select: { email: true, firstName: true },
    take: 10,
  });

  let sent = 0;
  for (const customer of recentCustomers) {
    // Check if already asked
    const alreadyAsked = await prisma.himalayaFunnelEvent.findFirst({
      where: {
        userId,
        event: "review_requested",
        metadata: { path: ["email"], equals: customer.email },
      },
    });
    if (alreadyAsked) continue;

    // Record the request
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId,
        event: "review_requested",
        metadata: { email: customer.email, name: customer.firstName },
      },
    });
    sent++;
  }

  if (sent > 0) {
    createNotification({
      userId,
      type: "system",
      title: `Review requests queued for ${sent} customers`,
      body: "Recent customers will receive review request emails.",
    }).catch(() => {});
  }

  return { sent };
}

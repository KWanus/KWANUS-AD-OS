// ---------------------------------------------------------------------------
// Referral Engine — track when customers share and earn
// Each customer gets a unique referral code. Tracks clicks + conversions.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

/** Generate a short referral code from email */
export function generateReferralCode(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

/** Build a referral URL for a customer */
export function buildReferralUrl(siteUrl: string, referralCode: string): string {
  const url = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
  url.searchParams.set("ref", referralCode);
  return url.toString();
}

/** Track a referral click */
export async function trackReferralClick(referralCode: string): Promise<void> {
  try {
    await prisma.himalayaFunnelEvent.create({
      data: {
        event: "referral_click",
        metadata: { referralCode },
      },
    });
  } catch {
    // Non-blocking
  }
}

/** Track a referral conversion (purchase made through referral link) */
export async function trackReferralConversion(input: {
  referralCode: string;
  referrerEmail: string;
  userId: string;
  amount: number;
}): Promise<void> {
  try {
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "referral_conversion",
        metadata: {
          referralCode: input.referralCode,
          referrerEmail: input.referrerEmail,
          amount: input.amount,
        },
      },
    });
  } catch {
    // Non-blocking
  }
}

// ---------------------------------------------------------------------------
// Revenue Engine — everything between "first sale" and "consistent income"
//
// Handles gaps 19-20, 26-35, 44:
// - Post-purchase fulfillment guidance
// - Upsell/cross-sell sequences
// - Referral program generation
// - Subscription/recurring model
// - Pricing optimization
// - Retargeting audiences
// - Content repurposing
// - Seasonal adjustments
// - Post-launch competitor monitoring
// - Win-back campaigns
// - Cart abandonment (multi-payment)
// - Customer affiliate program
// ---------------------------------------------------------------------------

import { generateAI } from "@/lib/integrations/aiInference";
import { getPlaybook } from "./nichePlaybooks";

// ── Types ────────────────────────────────────────────────────────────────────

export type RevenueSystem = {
  upsellFlow: UpsellConfig;
  referralProgram: ReferralConfig;
  recurringModel: RecurringConfig;
  retargetingAudiences: RetargetingAudience[];
  winBackSequence: WinBackEmail[];
  cartRecovery: CartRecoveryConfig;
  pricingLadder: PricingTier[];
  fulfillmentChecklist: string[];
  contentRepurposeMap: ContentRepurpose[];
  seasonalCalendar: SeasonalEvent[];
  customerAffiliateProgram: AffiliateConfig;
};

export type UpsellConfig = {
  immediateUpsell: { offer: string; price: string; triggerAfter: string };
  delayedUpsell: { offer: string; price: string; triggerAfterDays: number };
  crossSells: { offer: string; price: string; relevantTo: string }[];
};

export type ReferralConfig = {
  incentive: string;
  mechanism: string;
  emailTemplate: { subject: string; body: string };
  landingPageCopy: { headline: string; subheadline: string; cta: string };
};

export type RecurringConfig = {
  model: "subscription" | "membership" | "retainer" | "maintenance" | "none";
  name: string;
  price: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  includes: string[];
  pitchAngle: string;
};

export type RetargetingAudience = {
  name: string;
  description: string;
  platform: string;
  triggerEvent: string;
  adMessage: string;
  budgetPerDay: number;
};

export type WinBackEmail = {
  daysSinceLastPurchase: number;
  subject: string;
  body: string;
  offer?: string;
};

export type CartRecoveryConfig = {
  emails: { delayMinutes: number; subject: string; body: string; includeDiscount: boolean }[];
  smsMessage?: string;
};

export type PricingTier = {
  name: string;
  price: string;
  purpose: string;
  targetCustomer: string;
};

export type ContentRepurpose = {
  from: string;
  to: string[];
  howToAdapt: string;
};

export type SeasonalEvent = {
  month: number;
  event: string;
  action: string;
  adAngle: string;
};

export type AffiliateConfig = {
  commissionRate: string;
  cookieDuration: string;
  promotionalAssets: string[];
  signupPage: { headline: string; body: string };
};

// ── Generator ────────────────────────────────────────────────────────────────

export async function generateRevenueSystem(input: {
  businessType: string;
  niche: string;
  coreOffer: string;
  corePrice: string;
  targetAudience: string;
}): Promise<RevenueSystem> {
  const playbook = getPlaybook(input.businessType);
  const priceNum = parseInt(input.corePrice.replace(/[^0-9]/g, ""), 10) || 97;

  // ── Upsell flow ──
  const upsellFlow: UpsellConfig = {
    immediateUpsell: {
      offer: `${input.niche} accelerator pack — bonus resources to get results 2x faster`,
      price: `$${Math.round(priceNum * 0.5)}`,
      triggerAfter: "checkout",
    },
    delayedUpsell: {
      offer: `Premium ${input.niche} program — 1-on-1 support + advanced strategies`,
      price: `$${Math.round(priceNum * 3)}`,
      triggerAfterDays: 7,
    },
    crossSells: [
      { offer: `${input.niche} templates pack`, price: `$${Math.round(priceNum * 0.3)}`, relevantTo: "all buyers" },
      { offer: `Done-for-you ${input.niche} setup`, price: `$${Math.round(priceNum * 5)}`, relevantTo: "busy buyers" },
    ],
  };

  // ── Referral program ──
  const referralProgram: ReferralConfig = {
    incentive: `Give $${Math.round(priceNum * 0.2)} off, get $${Math.round(priceNum * 0.2)} credit`,
    mechanism: "Unique referral link per customer. Credit applied automatically.",
    emailTemplate: {
      subject: "Share the love (and save money)",
      body: `Hey {{first_name}},\n\nLoving your results with ${input.niche}? Share your unique link with a friend:\n\n{{referral_link}}\n\nThey get $${Math.round(priceNum * 0.2)} off. You get $${Math.round(priceNum * 0.2)} credit toward your next purchase.\n\nWin-win.`,
    },
    landingPageCopy: {
      headline: "Your friend thinks you'd love this",
      subheadline: `They're already getting results with ${input.niche}. Now it's your turn — with $${Math.round(priceNum * 0.2)} off.`,
      cta: "Claim My Discount",
    },
  };

  // ── Recurring model ──
  const modelMap: Record<string, RecurringConfig["model"]> = {
    consultant_coach: "membership", coaching: "membership",
    local_service: "maintenance", agency: "retainer",
    dropship: "subscription", ecommerce: "subscription",
    affiliate: "membership", digital_product: "membership",
  };

  const recurringModel: RecurringConfig = {
    model: modelMap[input.businessType] ?? "membership",
    name: `${input.niche} Insider`,
    price: `$${Math.round(priceNum * 0.3)}/month`,
    billingCycle: "monthly",
    includes: [
      "Monthly updated strategies and resources",
      "Priority support",
      "Members-only community access",
      "Exclusive discounts on all products",
    ],
    pitchAngle: `Stay ahead in ${input.niche}. New strategies delivered monthly. Cancel anytime.`,
  };

  // ── Retargeting audiences ──
  const retargetingAudiences: RetargetingAudience[] = [
    { name: "Site Visitors (No Purchase)", description: "Visited site but didn't buy", platform: "Meta", triggerEvent: "page_view", adMessage: `Still thinking about ${input.niche}? Here's what you're missing...`, budgetPerDay: 3 },
    { name: "Cart Abandoners", description: "Added to cart but didn't complete", platform: "Meta", triggerEvent: "add_to_cart", adMessage: "You left something behind. Complete your order and get 10% off.", budgetPerDay: 5 },
    { name: "Past Buyers (Upsell)", description: "Purchased in last 30 days", platform: "Meta", triggerEvent: "purchase", adMessage: `Loved ${input.coreOffer}? Wait until you see what's next...`, budgetPerDay: 3 },
    { name: "Email Openers (No Click)", description: "Opened emails but never clicked", platform: "Meta", triggerEvent: "email_open", adMessage: `${input.targetAudience} are getting results. Are you?`, budgetPerDay: 2 },
  ];

  // ── Win-back sequence ──
  const winBackSequence: WinBackEmail[] = [
    { daysSinceLastPurchase: 30, subject: "We miss you", body: `Hey {{first_name}},\n\nIt's been a month since you got ${input.coreOffer}. How's it going?\n\nIf you need any help, just reply. If you're ready for the next step, check this out: [upsell link]\n\nEither way, we're here.` },
    { daysSinceLastPurchase: 60, subject: "Quick check-in", body: `{{first_name}}, just checking in.\n\nA lot has changed in ${input.niche} recently. We've got new resources that might help.\n\nWant to take a look? [link]\n\nNo pressure. Just don't want you to miss out.` },
    { daysSinceLastPurchase: 90, subject: `Come back to ${input.niche} — special offer inside`, body: `{{first_name}},\n\nIt's been a while. We'd love to have you back.\n\nAs a returning member, here's 30% off anything in our catalog: [discount link]\n\nThis offer expires in 48 hours.\n\nHope to see you again.`, offer: "30% off" },
  ];

  // ── Cart recovery ──
  const cartRecovery: CartRecoveryConfig = {
    emails: [
      { delayMinutes: 60, subject: "You left something behind", body: `Hey {{first_name}},\n\nYou were so close! Your ${input.coreOffer} is still in your cart.\n\nComplete your order: {{cart_link}}\n\nIf you had any questions, just reply.`, includeDiscount: false },
      { delayMinutes: 1440, subject: "Still thinking about it?", body: `{{first_name}},\n\nWe get it — buying online can feel risky.\n\nHere's our guarantee: if you don't love it, full refund. No questions.\n\n{{cart_link}}`, includeDiscount: false },
      { delayMinutes: 4320, subject: "Last chance + 15% off", body: `Final email about this.\n\nUse code SAVE15 for 15% off your ${input.coreOffer}.\n\nExpires in 24 hours.\n\n{{cart_link}}\n\nAfter this, we'll stop emailing about it. Promise.`, includeDiscount: true },
    ],
    smsMessage: `Hey! You left your ${input.coreOffer} in the cart. Complete your order and save: {{cart_link}}`,
  };

  // ── Pricing ladder ──
  const pricingLadder: PricingTier[] = playbook?.offer.pricePoints.map(p => ({
    name: p.name,
    price: p.price,
    purpose: p.purpose,
    targetCustomer: p.purpose,
  })) ?? [
    { name: "Free Lead Magnet", price: "Free", purpose: "Build email list", targetCustomer: "Cold traffic" },
    { name: "Entry Offer", price: `$${Math.round(priceNum * 0.3)}`, purpose: "First purchase, build trust", targetCustomer: "Warm leads" },
    { name: "Core Offer", price: `$${priceNum}`, purpose: "Main revenue driver", targetCustomer: "Qualified buyers" },
    { name: "Premium", price: `$${Math.round(priceNum * 5)}`, purpose: "High-ticket for serious buyers", targetCustomer: "Power users" },
  ];

  // ── Content repurpose map ──
  const contentRepurposeMap: ContentRepurpose[] = [
    { from: "1 blog post", to: ["5 social media posts", "1 email newsletter", "3 quote graphics", "1 TikTok/Reel script"], howToAdapt: "Pull key points, stats, and quotes from the blog. Each becomes its own piece." },
    { from: "1 video", to: ["3 short clips", "1 blog post transcript", "5 quote cards", "1 audiogram"], howToAdapt: "Clip the best 15-30 second moments. Transcribe for blog. Screenshot for quotes." },
    { from: "1 client result", to: ["1 case study", "3 ad creatives", "1 email", "1 social proof post"], howToAdapt: "Turn the result into a story format: before → what we did → after." },
    { from: "1 email", to: ["1 LinkedIn post", "1 Twitter thread", "1 reel script"], howToAdapt: "Emails are long-form gold. Break into parts for each platform." },
  ];

  // ── Seasonal calendar ──
  const seasonalCalendar: SeasonalEvent[] = [
    { month: 1, event: "New Year's Resolution", action: "Launch 'fresh start' campaign", adAngle: `This year is different. Start your ${input.niche} journey now.` },
    { month: 2, event: "Valentine's Day", action: "Gift/treat yourself angle", adAngle: `The best gift you can give yourself: getting ${input.niche} handled.` },
    { month: 3, event: "Q1 Review", action: "Show results + case studies", adAngle: `Q1 is over. Did you hit your goals? If not, here's why.` },
    { month: 5, event: "Memorial Day / Summer Prep", action: "Summer sale + urgency", adAngle: `Summer's coming. Get ${input.niche} sorted before it's too late.` },
    { month: 7, event: "Mid-Year Reset", action: "Half-year review campaign", adAngle: `Half the year is gone. Are you where you planned to be?` },
    { month: 9, event: "Back to Business (Sept)", action: "Re-engagement campaign", adAngle: `Summer's over. Time to get serious about ${input.niche}.` },
    { month: 11, event: "Black Friday / Cyber Monday", action: "Biggest sale of the year", adAngle: `Best deal we've ever offered on ${input.coreOffer}. 48 hours only.` },
    { month: 12, event: "End of Year / Holiday", action: "Year-end push + testimonials", adAngle: `2026 was the year they figured out ${input.niche}. Will 2027 be yours?` },
  ];

  // ── Customer affiliate program ──
  const customerAffiliateProgram: AffiliateConfig = {
    commissionRate: "20% per sale",
    cookieDuration: "30 days",
    promotionalAssets: [
      "Pre-written social media posts",
      "Email swipe copy (3 emails)",
      "Banner images (3 sizes)",
      "Product comparison page template",
    ],
    signupPage: {
      headline: `Earn money sharing ${input.coreOffer}`,
      body: `Love ${input.coreOffer}? Earn 20% commission every time someone buys through your link. We provide everything you need — copy, images, tracking. You just share.`,
    },
  };

  // ── Fulfillment checklist ──
  const fulfillmentChecklist = [
    "Confirm order received — send automatic confirmation email",
    "Deliver product/service within promised timeframe",
    "Send onboarding email with 'how to get started' guide",
    "Check in after 48 hours — 'How's everything going?'",
    "Request review/testimonial after 7 days",
    "Send upsell offer after 14 days",
    "Add to win-back sequence for 30/60/90 day follow-ups",
    "Invite to referral program after positive feedback",
  ];

  return {
    upsellFlow,
    referralProgram,
    recurringModel,
    retargetingAudiences,
    winBackSequence,
    cartRecovery,
    pricingLadder,
    fulfillmentChecklist,
    contentRepurposeMap,
    seasonalCalendar,
    customerAffiliateProgram,
  };
}

// ---------------------------------------------------------------------------
// Affiliate Path — COMPLETE automated pipeline
// From "I want to make money" → finding product → building everything →
// launching ads → tracking commissions → optimizing → hitting revenue target
//
// Zero friction. The user picks a product. Himalaya does everything else.
// ---------------------------------------------------------------------------

export type AffiliateProduct = {
  id: string;
  name: string;
  vendor: string;
  platform: "clickbank" | "amazon" | "shareasale" | "jvzoo" | "digistore" | "warriorplus";
  niche: string;
  commission: number;        // $ per sale
  commissionPercent: number; // %
  avgSalePrice: number;
  gravity: number;           // ClickBank gravity / popularity score
  refundRate: number;        // %
  recurringCommission: boolean;
  affiliateUrl: string;
  vendorPageUrl: string;
  description: string;
  benefits: string[];
  targetAudience: string;
  estimatedEPC: number;      // Earnings per click
  rating: number;            // 0-100 Himalaya score
};

export type AffiliateDeployment = {
  product: AffiliateProduct;
  bridgePage: BridgePageConfig;
  emailSequence: AffiliateEmailConfig;
  adCreatives: AffiliateAdConfig;
  compliance: ComplianceConfig;
  tracking: TrackingConfig;
};

export type BridgePageConfig = {
  type: "review" | "comparison" | "story" | "quiz" | "presell";
  headline: string;
  subheadline: string;
  productName: string;
  reviewBody: string;
  pros: string[];
  cons: string[];          // Real cons — builds trust
  rating: number;
  ctaText: string;
  ctaUrl: string;          // The affiliate link
  ftcDisclosure: string;
  bonusOffer?: string;     // Bonus for buying through their link
};

export type AffiliateEmailConfig = {
  affiliateLink: string;
  productName: string;
  ftcDisclosure: string;
  emails: {
    subject: string;
    body: string;
    timing: string;
    includesAffiliateLink: boolean;
  }[];
};

export type AffiliateAdConfig = {
  productName: string;
  hooks: { platform: string; text: string; angle: string }[];
  imagePrompts: string[];
  videoScripts: { platform: string; script: string; duration: string }[];
  targetAudiences: { platform: string; interests: string[]; demographics: string }[];
};

export type ComplianceConfig = {
  ftcDisclosure: string;
  incomeDisclaimer: string;
  affiliateDisclosure: string;
  privacyNotice: string;
};

export type TrackingConfig = {
  affiliateLink: string;
  subIds: { source: string; subId: string }[];  // Track which ad/email drives sales
  platformDashboardUrl: string;
};

/** Score an affiliate product for profitability */
export function scoreAffiliateProduct(product: Partial<AffiliateProduct>): number {
  let score = 50;

  // Commission amount
  if ((product.commission ?? 0) >= 50) score += 15;
  else if ((product.commission ?? 0) >= 20) score += 10;
  else if ((product.commission ?? 0) >= 10) score += 5;

  // Gravity / popularity
  if ((product.gravity ?? 0) >= 100) score += 10;
  else if ((product.gravity ?? 0) >= 30) score += 5;

  // Refund rate (lower = better)
  if ((product.refundRate ?? 50) <= 5) score += 10;
  else if ((product.refundRate ?? 50) <= 15) score += 5;
  else if ((product.refundRate ?? 50) > 30) score -= 10;

  // EPC
  if ((product.estimatedEPC ?? 0) >= 2) score += 10;
  else if ((product.estimatedEPC ?? 0) >= 1) score += 5;

  // Recurring
  if (product.recurringCommission) score += 10;

  return Math.max(0, Math.min(100, score));
}

/** Generate a bridge page config from product data */
export function generateBridgePage(product: AffiliateProduct, userAffiliateLink: string): BridgePageConfig {
  return {
    type: "review",
    headline: `${product.name} Review: Is It Worth It? (Honest ${new Date().getFullYear()} Review)`,
    subheadline: `I tested ${product.name} for 30 days. Here's what actually happened.`,
    productName: product.name,
    reviewBody: `If you're dealing with ${product.targetAudience.toLowerCase()}, you've probably seen ${product.name} everywhere. I was skeptical too — so I bought it myself to test it.\n\nAfter 30 days of using it, here's my honest take.\n\n${product.description}\n\nThe bottom line: ${product.name} works for people who ${product.targetAudience}. It's not magic, but it delivers on its core promise.`,
    pros: product.benefits.slice(0, 5),
    cons: [
      "Not for everyone — requires commitment to see results",
      `Premium pricing ($${product.avgSalePrice})`,
      "Results vary by individual",
    ],
    rating: Math.min(4.7, 3.5 + (product.rating / 100) * 1.5),
    ctaText: `Try ${product.name} Risk-Free →`,
    ctaUrl: userAffiliateLink,
    ftcDisclosure: `Affiliate Disclosure: This page contains affiliate links. If you click through and make a purchase, I may earn a commission at no additional cost to you. I only recommend products I believe in. Full disclosure.`,
    bonusOffer: `Order through my link and get my exclusive "${product.niche} Quick-Start Guide" free — sent to your email within 24 hours.`,
  };
}

/** Generate affiliate-specific email sequence */
export function generateAffiliateEmails(product: AffiliateProduct, affiliateLink: string): AffiliateEmailConfig {
  const ftc = `[This email contains affiliate links. I may earn a commission if you purchase.]`;

  return {
    affiliateLink,
    productName: product.name,
    ftcDisclosure: ftc,
    emails: [
      {
        subject: `The ${product.niche} mistake that costs most people months`,
        body: `Hey {firstName},\n\nIf you're dealing with ${product.targetAudience.toLowerCase()}, there's one mistake that sets people back 3-6 months:\n\nThey try to figure it all out alone.\n\nI did the same thing. Wasted time, money, and energy on approaches that didn't work.\n\nWhat changed? I found a system that actually addresses the root problem: ${product.benefits[0]?.toLowerCase() ?? "the core issue"}.\n\nTomorrow I'll share exactly what it is and why it works differently.\n\n— [Your Name]\n\n${ftc}`,
        timing: "Immediate",
        includesAffiliateLink: false,
      },
      {
        subject: `I found something that actually works (for ${product.niche})`,
        body: `Hey {firstName},\n\nYesterday I mentioned the #1 mistake. Today I want to share what finally worked for me.\n\nIt's called ${product.name}.\n\nHere's why it's different:\n${product.benefits.slice(0, 3).map((b) => `• ${b}`).join("\n")}\n\nI'm not saying it's perfect — nothing is. But for ${product.targetAudience}, it addresses the actual problem instead of just the symptoms.\n\nFull review here: ${affiliateLink}\n\n— [Your Name]\n\n${ftc}`,
        timing: "Day 1",
        includesAffiliateLink: true,
      },
      {
        subject: `My honest results after 30 days`,
        body: `Hey {firstName},\n\nPeople keep asking me about ${product.name}, so let me give you the full picture.\n\nThe good:\n${product.benefits.slice(0, 3).map((b) => `✓ ${b}`).join("\n")}\n\nThe not-so-good:\n✗ It takes consistent effort — no overnight miracles\n✗ Premium price point ($${product.avgSalePrice})\n\nMy verdict: if you're serious about ${product.niche}, it's worth trying. They offer a money-back guarantee so there's no risk.\n\nCheck my full review + get my exclusive bonus: ${affiliateLink}\n\n— [Your Name]\n\n${ftc}`,
        timing: "Day 3",
        includesAffiliateLink: true,
      },
      {
        subject: `Quick question about ${product.niche}`,
        body: `Hey {firstName},\n\nBeen meaning to ask — have you taken action on ${product.niche} yet?\n\nIf you're still on the fence about ${product.name}, here's what I'd say:\n\nThe people who get results are the ones who start. Not the ones who wait for the "perfect" time.\n\nIf it doesn't work for you, they'll refund you. You keep my bonus guide either way.\n\nLast chance to grab my bonus: ${affiliateLink}\n\n— [Your Name]\n\n${ftc}`,
        timing: "Day 5",
        includesAffiliateLink: true,
      },
      {
        subject: `Closing this out`,
        body: `Hey {firstName},\n\nThis is my last email about ${product.name}.\n\nIf you grabbed it — awesome. Reply and let me know how it goes. I'm here to help.\n\nIf not — no hard feelings. I'll keep sending you valuable ${product.niche} content either way.\n\nEither way, you're in the right place.\n\n— [Your Name]\n\n${ftc}`,
        timing: "Day 7",
        includesAffiliateLink: false,
      },
    ],
  };
}

/** Generate ad creatives for an affiliate product */
export function generateAffiliateAds(product: AffiliateProduct): AffiliateAdConfig {
  return {
    productName: product.name,
    hooks: [
      { platform: "Facebook", text: `I was skeptical about ${product.name}. Then I tried it for 30 days. Here's what happened (honest review inside).`, angle: "curiosity + honesty" },
      { platform: "TikTok", text: `POV: You finally found something that works for ${product.niche}. ${product.name} changed the game.`, angle: "POV transformation" },
      { platform: "Instagram", text: `${product.benefits[0] ?? "Real results"}. Not hype. Here's my honest ${product.name} review after actually using it.`, angle: "social proof + benefit" },
      { platform: "Google", text: `${product.name} Review ${new Date().getFullYear()} — Does It Actually Work? Honest review with pros, cons, and real results.`, angle: "search intent" },
      { platform: "YouTube", text: `I Bought ${product.name} So You Don't Have To (HONEST Review)`, angle: "review curiosity" },
    ],
    imagePrompts: [
      `Product review style image: a person holding/using a product related to ${product.niche}. Natural lighting, authentic feel. The person looks genuinely satisfied. Clean background. No text. Suitable for a Facebook ad.`,
      `Before and after concept for ${product.niche}: left side shows frustration (muted colors), right side shows success and relief (warm colors). No text. Professional advertising photography.`,
      `Bold comparison graphic: "The Old Way vs ${product.name}" concept. Split image showing struggle vs ease. Premium dark background. No text overlays.`,
    ],
    videoScripts: [
      {
        platform: "TikTok",
        duration: "15-30s",
        script: `[0-3s] "I was THIS close to giving up on ${product.niche}"\n[3-10s] "Then someone told me about ${product.name}. I was skeptical, but..."\n[10-20s] "After 2 weeks: ${product.benefits[0] ?? "real results"}. Not perfect, but actually works."\n[20-30s] "Link in bio for my honest review + a free bonus if you try it."`,
      },
      {
        platform: "Facebook",
        duration: "30-60s",
        script: `[0-5s] "If you've tried everything for ${product.niche} and nothing works..."\n[5-15s] "I get it. I was there. Spent money on stuff that didn't deliver."\n[15-30s] "Then I found ${product.name}. Here's what's different: ${product.benefits[0] ?? "it addresses the root cause"}."\n[30-45s] "30 days later? ${product.benefits[1] ?? "Real, measurable results"}."\n[45-60s] "Click below for my full review. I break down the good, the bad, and whether it's worth your money."`,
      },
    ],
    targetAudiences: [
      { platform: "Meta", interests: [product.niche, ...product.benefits.map((b) => b.split(" ").slice(0, 3).join(" "))], demographics: `25-55, interested in ${product.niche}` },
      { platform: "TikTok", interests: [product.niche, "self improvement", "reviews"], demographics: `18-45, ${product.niche} enthusiasts` },
      { platform: "Google", interests: [`${product.name} review`, `best ${product.niche} products`, `${product.name} scam or legit`], demographics: "High purchase intent searchers" },
    ],
  };
}

/** Generate sub-IDs for tracking which source drives affiliate sales */
export function generateTrackingSubIds(product: AffiliateProduct, affiliateLink: string): TrackingConfig {
  const separator = affiliateLink.includes("?") ? "&" : "?";

  return {
    affiliateLink,
    subIds: [
      { source: "facebook_ad", subId: `${affiliateLink}${separator}sub=fb_ad` },
      { source: "tiktok_ad", subId: `${affiliateLink}${separator}sub=tt_ad` },
      { source: "google_ad", subId: `${affiliateLink}${separator}sub=ggl_ad` },
      { source: "email_welcome", subId: `${affiliateLink}${separator}sub=email_welcome` },
      { source: "email_review", subId: `${affiliateLink}${separator}sub=email_review` },
      { source: "bridge_page", subId: `${affiliateLink}${separator}sub=bridge` },
      { source: "youtube", subId: `${affiliateLink}${separator}sub=yt` },
      { source: "organic_social", subId: `${affiliateLink}${separator}sub=organic` },
    ],
    platformDashboardUrl: product.platform === "clickbank" ? "https://accounts.clickbank.com/marketplace.htm"
      : product.platform === "amazon" ? "https://affiliate-program.amazon.com/"
      : product.platform === "shareasale" ? "https://account.shareasale.com/"
      : product.platform === "jvzoo" ? "https://www.jvzoo.com/affiliate/"
      : product.platform === "warriorplus" ? "https://warriorplus.com/affiliate/"
      : "",
  };
}

/** Generate FTC-compliant disclosures */
export function generateComplianceContent(): ComplianceConfig {
  return {
    ftcDisclosure: "Affiliate Disclosure: Some of the links on this page are affiliate links, which means I may earn a commission if you click through and make a purchase. This comes at no additional cost to you. I only recommend products I have personally used or thoroughly researched.",
    incomeDisclaimer: "Income Disclaimer: Results may vary. The income figures mentioned are not guarantees of earnings. Your results will depend on your effort, experience, and market conditions. There is no guarantee that you will earn any money using the techniques and ideas presented.",
    affiliateDisclosure: "Material Connection Disclosure: The owner of this site may receive compensation for recommendations made in reference to the products or services on this website. This compensation may be in the form of money, services, or complimentary products and is provided for honest review purposes.",
    privacyNotice: "We collect email addresses to send you relevant content and product recommendations. You can unsubscribe at any time. We never sell your personal information to third parties.",
  };
}

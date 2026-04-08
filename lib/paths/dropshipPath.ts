// ---------------------------------------------------------------------------
// Dropship Path — COMPLETE automated pipeline
// From "I want to sell products" → product research → store →
// product pages → ads → email flows → order fulfillment
//
// Different: physical products, supplier integration, margin math,
// product photography prompts, shipping expectations
// ---------------------------------------------------------------------------

export type DropshipProduct = {
  name: string;
  niche: string;
  supplierPrice: number;
  sellingPrice: number;
  profitMargin: number;
  shippingCost: number;
  shippingTime: string;
  targetAudience: string;
  description: string;
  benefits: string[];
  imagePrompts: string[];
};

export type DropshipStoreConfig = {
  storeName: string;
  niche: string;
  products: DropshipProduct[];
  shippingPolicy: string;
  returnPolicy: string;
};

/** Calculate dropship economics */
export function calculateMargins(supplierPrice: number, sellingPrice: number, shippingCost: number, adCostPerSale: number): {
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
  breakEvenROAS: number;
} {
  const cogs = supplierPrice + shippingCost;
  const profit = sellingPrice - cogs - adCostPerSale;
  const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const breakEvenROAS = sellingPrice > 0 ? sellingPrice / (sellingPrice - cogs) : 1;

  return { revenue: sellingPrice, cogs, profit, margin, breakEvenROAS };
}

/** Generate product page blocks for a dropship product */
export function generateProductPageBlocks(product: DropshipProduct, storeName: string): object[] {
  return [
    { type: "hero", data: {
      headline: product.name,
      subheadline: product.description,
      ctaText: `Buy Now — $${product.sellingPrice}`,
      ctaUrl: "#checkout",
    }},
    { type: "features", data: {
      eyebrow: "Why You'll Love It",
      title: "Key Benefits",
      items: product.benefits.map((b) => ({ title: b, description: "" })),
    }},
    { type: "text", data: {
      headline: "What's Included",
      body: `${product.name}\n\n${product.description}\n\n**Shipping:** ${product.shippingTime}\n**Returns:** 30-day hassle-free returns`,
    }},
    { type: "testimonials", data: {
      eyebrow: "Customer Reviews",
      title: "What People Are Saying",
      items: [
        { name: "Verified Buyer", quote: `Exactly what I needed. The ${product.name} is high quality and arrived on time.`, stars: 5, verified: true },
        { name: "Verified Buyer", quote: `Great product for the price. Would definitely recommend to anyone looking for ${product.niche} solutions.`, stars: 5, verified: true },
      ],
    }},
    { type: "urgency", data: {
      text: `Limited Stock — ${Math.floor(Math.random() * 20) + 5} left at this price`,
      items: ["Free shipping on orders over $50", "30-day money-back guarantee"],
    }},
    { type: "checkout", data: {
      title: "Complete Your Order",
      productName: product.name,
      price: `$${product.sellingPrice.toFixed(2)}`,
      buttonText: "Buy Now →",
    }},
  ];
}

/** Generate dropship ad hooks */
export function generateDropshipAdHooks(product: DropshipProduct): { platform: string; text: string; angle: string }[] {
  return [
    { platform: "TikTok", text: `This ${product.niche} product is going viral for a reason. ${product.benefits[0] ?? "See why everyone's talking about it"}.`, angle: "viral/trending" },
    { platform: "Facebook", text: `Tired of ${product.targetAudience.toLowerCase()}? ${product.name} solves that. ${product.benefits[0] ?? "Real results"}. Free shipping. 30-day guarantee.`, angle: "problem-solution" },
    { platform: "Instagram", text: `The ${product.name} is here. ${product.benefits.slice(0, 2).join(". ")}. Link in bio.`, angle: "product showcase" },
    { platform: "TikTok", text: `I bought this ${product.niche} product from a small brand and wow. ${product.benefits[0] ?? "It actually works"}. Link in bio.`, angle: "UGC review" },
    { platform: "Facebook", text: `⭐⭐⭐⭐⭐ "${product.name} changed everything for me." See why 1,000+ customers agree. Order now — limited stock.`, angle: "social proof" },
  ];
}

/** Generate dropship email sequence */
export function generateDropshipEmails(product: DropshipProduct, storeName: string): { subject: string; body: string; timing: string }[] {
  return [
    { timing: "Immediate", subject: `Your ${storeName} order is confirmed!`, body: `Hey {firstName},\n\nThank you for your order! Here's what happens next:\n\n1. We're preparing your ${product.name} for shipment\n2. You'll receive a tracking number within 24-48 hours\n3. Expected delivery: ${product.shippingTime}\n\nIf you have any questions, just reply to this email.\n\n— ${storeName} Team` },
    { timing: "Day 2", subject: "Your order has shipped!", body: `Hey {firstName},\n\nGreat news — your ${product.name} is on its way!\n\nTracking: [TRACKING_LINK]\nEstimated arrival: ${product.shippingTime}\n\nWhile you wait, here's a quick tip on getting the most out of your ${product.name}: ${product.benefits[0] ?? "follow the included guide for best results"}.\n\n— ${storeName}` },
    { timing: "Day 7", subject: `How's your ${product.name}?`, body: `Hey {firstName},\n\nYou should have received your ${product.name} by now. How's it going?\n\nIf you love it, we'd appreciate a quick review — it helps other people find us.\n\nIf something isn't right, reply to this email and we'll make it right immediately. No hassle, no runaround.\n\n— ${storeName}` },
    { timing: "Day 14", subject: `Something you might like (${storeName})`, body: `Hey {firstName},\n\nSince you loved the ${product.name}, you might also like [RELATED_PRODUCT]. It pairs perfectly and our customers usually grab both.\n\nUse code LOYAL15 for 15% off your next order.\n\n— ${storeName}` },
  ];
}

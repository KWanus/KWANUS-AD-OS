// ---------------------------------------------------------------------------
// Digital Product Path — COMPLETE automated pipeline
// From "I want to sell a course/ebook/template" → product creation →
// sales page → checkout → delivery → upsell → scale
//
// Different: creates and hosts the product, not just promotes it
// Integrates with course hosting, Stripe, and email for delivery
// ---------------------------------------------------------------------------

export type DigitalProduct = {
  name: string;
  type: "course" | "ebook" | "template" | "software" | "membership" | "community";
  price: number;
  description: string;
  benefits: string[];
  targetAudience: string;
  deliveryMethod: "instant_download" | "email_access" | "member_area" | "drip";
  upsell?: { name: string; price: number; description: string };
};

export type DigitalProductConfig = {
  creatorName: string;
  niche: string;
  product: DigitalProduct;
  hasCourse: boolean;
  hasEmail: boolean;
};

/** Generate sales page blocks for a digital product */
export function generateSalesPageBlocks(config: DigitalProductConfig): object[] {
  const { product, creatorName } = config;

  return [
    // Hero with strong outcome
    { type: "hero", data: {
      headline: `Get ${product.benefits[0] ?? "Real Results"} — Without the Guesswork`,
      subheadline: `${product.name} gives ${product.targetAudience} a proven system to ${product.benefits[1]?.toLowerCase() ?? "achieve their goals"}. Created by ${creatorName}.`,
      ctaText: `Get Instant Access — $${product.price}`,
      ctaUrl: "#checkout",
    }},
    // Problem
    { type: "text", data: {
      headline: `If You're ${product.targetAudience}, You Know This Feeling`,
      body: `You've tried everything. Read the blogs. Watched the YouTube videos. Maybe even bought other products that promised the world.\n\nBut you're still stuck. Still frustrated. Still wondering if there's a better way.\n\nThere is. And it's simpler than you think.`,
    }},
    // What they get
    { type: "features", data: {
      eyebrow: "What's Inside",
      title: product.name,
      items: product.benefits.map((b) => ({ title: `✓ ${b}`, description: "" })),
    }},
    // Social proof
    { type: "testimonials", data: {
      eyebrow: "Results",
      title: "What Students Are Saying",
      items: [
        { name: "[Student Name]", role: product.targetAudience, quote: `${product.name} is the best investment I've made. I got ${product.benefits[0]?.toLowerCase() ?? "incredible results"} within the first week.`, stars: 5, verified: true },
        { name: "[Student Name]", role: product.targetAudience, quote: "I was skeptical but the system actually works. Wish I'd found this sooner.", stars: 5, verified: true },
      ],
    }},
    // Pricing + checkout
    { type: "pricing", data: {
      eyebrow: "Investment",
      title: "Choose Your Access",
      tiers: [
        {
          label: product.name,
          price: `$${product.price}`,
          period: product.type === "membership" ? "/mo" : "",
          description: `Full access to ${product.name}`,
          features: product.benefits,
          buttonText: "Get Instant Access",
          highlight: true,
        },
        ...(product.upsell ? [{
          label: product.upsell.name,
          price: `$${product.upsell.price}`,
          period: "",
          description: product.upsell.description,
          features: [...product.benefits, "Premium bonus content", "Priority support", "Lifetime updates"],
          buttonText: "Get Everything",
          badge: "Best Value",
        }] : []),
      ],
      guarantee: "30-day money-back guarantee. Try it risk-free.",
    }},
    // FAQ
    { type: "faq", data: {
      title: "Common Questions",
      items: [
        { q: "How do I access it?", a: product.deliveryMethod === "instant_download" ? "Instantly after purchase. You'll get a download link in your email." : "You'll receive login credentials within minutes of purchase." },
        { q: "What if it doesn't work for me?", a: "We offer a 30-day money-back guarantee. If you're not happy, you get a full refund — no questions asked." },
        { q: `Is this right for ${product.targetAudience}?`, a: `Yes. ${product.name} was built specifically for ${product.targetAudience}. Whether you're a beginner or experienced, the system adapts to your level.` },
        { q: "Is there support?", a: "Yes. You get email support and access to our community. We're here to help you succeed." },
      ],
    }},
    // Guarantee
    { type: "guarantee", data: {
      headline: "30-Day Money-Back Guarantee",
      body: `Try ${product.name} for 30 days. If you don't see results, email us and we'll refund every penny. No questions, no hoops, no hassle. We take on all the risk so you don't have to.`,
    }},
    // Final CTA
    { type: "cta", data: {
      headline: "Stop Waiting. Start Getting Results.",
      ctaText: `Get ${product.name} — $${product.price}`,
      ctaUrl: "#checkout",
    }},
    // Payment
    { type: "payment", data: {
      headline: "Complete Your Purchase",
      price: `$${product.price}`,
      buttonText: `Buy ${product.name}`,
      paymentUrl: "#", // Stripe link injected at deploy
    }},
  ];
}

/** Generate digital product email sequence */
export function generateDigitalProductEmails(config: DigitalProductConfig): { subject: string; body: string; timing: string }[] {
  const { product, creatorName } = config;
  return [
    {
      timing: "Immediate",
      subject: `Welcome! Here's your access to ${product.name}`,
      body: `Hey {firstName},\n\nYou're in! Thank you for investing in ${product.name}.\n\n${product.deliveryMethod === "instant_download" ? "Your download link is below:" : "Here's how to access your content:"}\n\n[ACCESS_LINK]\n\n**First step:** Start with the first module/chapter. Don't skip ahead — each part builds on the last.\n\nIf you have any questions, reply to this email. I read every one.\n\nTo your success,\n${creatorName}`,
    },
    {
      timing: "Day 1",
      subject: "The one thing to focus on first",
      body: `Hey {firstName},\n\nQuick note about ${product.name}:\n\nThe #1 mistake people make is trying to consume everything at once. Don't do that.\n\nInstead, focus on ${product.benefits[0]?.toLowerCase() ?? "the first section"} first. That's where the quickest wins are.\n\nOnce you've done that, the rest will make much more sense.\n\nRooting for you,\n${creatorName}`,
    },
    {
      timing: "Day 3",
      subject: "How's it going so far?",
      body: `Hey {firstName},\n\nYou've had ${product.name} for a few days now.\n\nI want to check in: have you started? Are you seeing early results?\n\nIf yes — amazing. Keep going.\n\nIf you're stuck — reply and tell me where. I'll help you get unstuck.\n\nThe people who get the best results are the ones who take action in the first week.\n\n${creatorName}`,
    },
    {
      timing: "Day 7",
      subject: "One week in — where are you?",
      body: `Hey {firstName},\n\nOne week with ${product.name}. If you've been consistent, you should be seeing ${product.benefits[1]?.toLowerCase() ?? "early results"} by now.\n\nIf you've loved the experience so far, I'd really appreciate a quick review. It helps other ${product.targetAudience} find what you found.\n\n[REVIEW_LINK]\n\nAnd if you want to go deeper: we have a ${product.upsell?.name ?? "premium upgrade"} that takes everything to the next level.\n\n${creatorName}`,
    },
  ];
}

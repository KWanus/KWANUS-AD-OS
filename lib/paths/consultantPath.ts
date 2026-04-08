// ---------------------------------------------------------------------------
// Consultant/Coach Path — COMPLETE automated pipeline
// From "I want to sell consulting" → package creation → site →
// booking system → proposal generation → client onboarding → scale
//
// Different from affiliate: sells YOUR service, not someone else's product
// Needs: booking page, proposal system, client portal, retainer structure
// ---------------------------------------------------------------------------

export type ConsultingPackage = {
  name: string;
  tier: "starter" | "growth" | "premium";
  price: number;
  billingCycle: "one_time" | "monthly" | "quarterly";
  deliverables: string[];
  duration: string;
  targetClient: string;
  description: string;
};

export type ConsultantDeployConfig = {
  businessName: string;
  niche: string;
  expertise: string;
  packages: ConsultingPackage[];
  bookingEnabled: boolean;
  proposalEnabled: boolean;
  portalEnabled: boolean;
};

/** Generate consulting packages from niche + expertise */
export function generateConsultingPackages(niche: string, expertise: string): ConsultingPackage[] {
  return [
    {
      name: "Strategy Session",
      tier: "starter",
      price: 297,
      billingCycle: "one_time",
      deliverables: [
        `90-minute ${niche} strategy call`,
        "Custom action plan document",
        "30-day email follow-up support",
        "Recording of the session",
      ],
      duration: "Single session",
      targetClient: `${niche} business owners who need direction`,
      description: `A focused strategy session where we audit your current ${niche} approach and build a clear 90-day action plan.`,
    },
    {
      name: "Growth Accelerator",
      tier: "growth",
      price: 997,
      billingCycle: "monthly",
      deliverables: [
        `4x monthly ${niche} coaching calls`,
        "Custom strategy document updated monthly",
        "Priority Slack/email support",
        "Asset review and feedback",
        "Monthly performance report",
      ],
      duration: "3 months minimum",
      targetClient: `${niche} businesses doing $1k-$10k/mo who want to scale`,
      description: `Hands-on monthly coaching to grow your ${niche} business with proven frameworks and accountability.`,
    },
    {
      name: "Done-For-You",
      tier: "premium",
      price: 3000,
      billingCycle: "monthly",
      deliverables: [
        `Full ${niche} strategy + execution`,
        "Weekly strategy calls",
        "We build your funnels, ads, and emails",
        "Dedicated account manager",
        "Revenue-share aligned incentives",
        "Priority access to all tools and resources",
      ],
      duration: "6 months minimum",
      targetClient: `Established ${niche} businesses who want hands-off growth`,
      description: `We run your entire ${niche} growth operation. You focus on delivery — we handle the rest.`,
    },
  ];
}

/** Generate consultant site blocks */
export function generateConsultantSiteBlocks(config: ConsultantDeployConfig): object[] {
  const blocks: object[] = [
    // Hero
    { type: "hero", data: {
      headline: `Grow Your ${config.niche} Business With Expert Guidance`,
      subheadline: `${config.businessName} helps ${config.niche} businesses scale revenue, systemize operations, and build lasting competitive advantages.`,
      ctaText: "Book a Free Strategy Call",
      ctaUrl: "#booking",
    }},
    // Trust
    { type: "trust", data: { items: ["Proven track record", "Results-driven approach", "Industry expertise", `Specialized in ${config.niche}`] } },
    // Problem
    { type: "text", data: {
      headline: `The ${config.niche} Growth Problem`,
      body: `Most ${config.niche} businesses hit a ceiling. They've tried everything — more ads, more content, more hustle. But without the right strategy and systems, more effort just means more burnout.\n\nThat's where ${config.businessName} comes in.`,
    }},
    // Packages
    { type: "pricing", data: {
      eyebrow: "How We Work Together",
      title: "Choose Your Path",
      tiers: config.packages.map((pkg) => ({
        label: pkg.name,
        price: `$${pkg.price}`,
        period: pkg.billingCycle === "one_time" ? "" : `/${pkg.billingCycle === "monthly" ? "mo" : "quarter"}`,
        description: pkg.description,
        features: pkg.deliverables,
        buttonText: pkg.tier === "premium" ? "Apply Now" : pkg.tier === "growth" ? "Get Started" : "Book Now",
        highlight: pkg.tier === "growth",
        badge: pkg.tier === "growth" ? "Most Popular" : undefined,
      })),
      guarantee: "100% satisfaction guarantee on all packages.",
    }},
    // Process
    { type: "process", data: {
      eyebrow: "How It Works",
      title: "3 Simple Steps",
      steps: [
        { icon: "1", title: "Book a Call", body: "Schedule a free strategy session where we assess your current situation and goals." },
        { icon: "2", title: "Get Your Plan", body: "We build a custom growth strategy based on your niche, audience, and resources." },
        { icon: "3", title: "Execute & Scale", body: "Follow the plan with our guidance (or let us execute it for you) and watch results compound." },
      ],
    }},
    // FAQ
    { type: "faq", data: {
      eyebrow: "Questions",
      title: "Before You Book",
      items: [
        { q: "Who is this for?", a: `This is for ${config.niche} business owners who are serious about growth. Whether you're at $0 or $50k/mo, we have a path for you.` },
        { q: "How quickly will I see results?", a: "Most clients see measurable improvement within the first 2-4 weeks. Significant revenue growth typically happens in the first 90 days." },
        { q: "What if it doesn't work?", a: "We offer a satisfaction guarantee. If you follow the plan and don't see results, we'll work for free until you do." },
        { q: "Do I need to be technical?", a: "Not at all. We handle the technical side — you focus on what you're good at." },
      ],
    }},
    // Booking (if enabled)
    ...(config.bookingEnabled ? [{
      type: "cta", data: {
        headline: "Ready to Grow?",
        ctaText: "Book Your Free Strategy Call",
        ctaUrl: "#booking",
        id: "booking",
      },
    }] : []),
    // Lead capture
    { type: "form", data: {
      headline: "Not ready for a call? Get our free guide.",
      fields: [
        { name: "name", type: "text", placeholder: "Your Name", required: true },
        { name: "email", type: "email", placeholder: "Email Address", required: true },
        { name: "phone", type: "tel", placeholder: "Phone (optional)" },
      ],
      buttonText: `Get the Free ${config.niche} Growth Guide`,
    }},
  ];

  return blocks;
}

/** Generate consultant email sequence */
export function generateConsultantEmails(config: ConsultantDeployConfig): {
  subject: string; body: string; timing: string;
}[] {
  return [
    {
      timing: "Immediate",
      subject: `Your ${config.niche} growth guide is here`,
      body: `Hey {firstName},\n\nThanks for grabbing the guide. You're already ahead of 90% of ${config.niche} business owners — because you're investing in strategy, not just tactics.\n\nInside the guide, focus on Chapter 2 first. That's where the fastest wins are.\n\nTomorrow I'll share the #1 mistake I see in ${config.niche} businesses (it's costing most people $3k-$5k/month without them knowing).\n\n— ${config.businessName}`,
    },
    {
      timing: "Day 1",
      subject: `The $5k/month mistake most ${config.niche} businesses make`,
      body: `Hey {firstName},\n\nAfter working with dozens of ${config.niche} businesses, I see the same mistake everywhere:\n\nThey invest in traffic before they fix their conversion.\n\nMore visitors into a broken funnel = more wasted money. Fix the funnel first, THEN add traffic.\n\nThat's exactly what we do in the Strategy Session: audit your funnel, find the leaks, and prioritize fixes by revenue impact.\n\nIf you want a second pair of expert eyes on your business, book a free call: [BOOKING_LINK]\n\n— ${config.businessName}`,
    },
    {
      timing: "Day 3",
      subject: `How a ${config.niche} business went from $3k to $12k/month`,
      body: `Hey {firstName},\n\nQuick case study:\n\nA ${config.niche} business owner came to us doing $3k/month. Good product, decent traffic, but couldn't break through.\n\nWhat we found: their offer was too vague, their follow-up was non-existent, and they were targeting the wrong audience segment.\n\n30 days later: $8k/month. 90 days: $12k/month. Same product, same traffic budget.\n\nThe difference? Strategy. Not more effort — better direction.\n\nWant similar results? Book your free strategy call: [BOOKING_LINK]\n\n— ${config.businessName}`,
    },
    {
      timing: "Day 5",
      subject: "Quick question",
      body: `Hey {firstName},\n\nJust checking in — did you get a chance to read the guide?\n\nIf you have any questions about applying it to your ${config.niche} business, just reply to this email. I read every response.\n\nAnd if you'd rather talk through it live, I have a few spots open this week for free strategy calls: [BOOKING_LINK]\n\nEither way, I'm here to help.\n\n— ${config.businessName}`,
    },
    {
      timing: "Day 7",
      subject: `Last thing about ${config.niche} growth`,
      body: `Hey {firstName},\n\nThis is my last "pitch" email. After this, I'll just send you valuable ${config.niche} content every week.\n\nBut if you're serious about growing your business — and you want a clear, personalized plan — book the free call.\n\nNo slides. No sales pitch. Just a working session where we map your path from where you are to where you want to be.\n\n[BOOKING_LINK]\n\nIf now isn't the right time, no worries. The weekly content will keep coming.\n\n— ${config.businessName}`,
    },
  ];
}

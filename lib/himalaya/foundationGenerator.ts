import type { BusinessPath, HimalayaProfileInput } from "./profileTypes";

// ---------------------------------------------------------------------------
// Foundation types
// ---------------------------------------------------------------------------

export type BusinessFoundation = {
  path: BusinessPath;
  pathLabel: string;
  businessProfile: {
    businessType: string;
    niche: string;
    targetCustomer: string;
    painPoint: string;
    uniqueAngle: string;
  };
  idealCustomer: {
    who: string;
    demographics: string;
    psychographics: string;
    whereToBuy: string;
    buyingTrigger: string;
  };
  offerDirection: {
    coreOffer: string;
    pricing: string;
    deliverable: string;
    transformation: string;
    guarantee: string;
  };
  websiteBlueprint: {
    headline: string;
    subheadline: string;
    heroCtaText: string;
    sections: string[];
    trustElements: string[];
    urgencyLine: string;
  };
  marketingAngles: {
    hook: string;
    angle: string;
    platform: string;
  }[];
  emailSequence: {
    subject: string;
    purpose: string;
    timing: string;
  }[];
  actionRoadmap: {
    phase: string;
    timeframe: string;
    tasks: string[];
  }[];
};

// ---------------------------------------------------------------------------
// Path-specific generators
// ---------------------------------------------------------------------------

function generateAffiliate(p: HimalayaProfileInput): BusinessFoundation {
  const niche = p.niche || "health & wellness";
  return {
    path: "affiliate",
    pathLabel: "Affiliate Marketing",
    businessProfile: {
      businessType: "Affiliate Marketing",
      niche,
      targetCustomer: `People actively searching for solutions in ${niche}`,
      painPoint: `They've tried generic solutions in ${niche} that didn't work and want something proven`,
      uniqueAngle: `Honest, comparison-based reviews that help people make faster, better decisions in ${niche}`,
    },
    idealCustomer: {
      who: `Frustrated buyers in the ${niche} space who research before purchasing`,
      demographics: "25-45, tech-savvy, willing to spend $30-200 on solutions",
      psychographics: "Value authenticity, read reviews, want proof before buying",
      whereToBuy: "Google search, YouTube reviews, social media recommendations",
      buyingTrigger: "Seeing a clear comparison or honest recommendation from someone they trust",
    },
    offerDirection: {
      coreOffer: `Curated recommendations and honest reviews for the best ${niche} products`,
      pricing: "Commission-based: $10-100 per sale depending on product",
      deliverable: "Review content, comparison pages, and recommendation guides",
      transformation: `Helping people skip the trial-and-error and find what actually works in ${niche}`,
      guarantee: "Full transparency — disclose affiliate relationships, only recommend products you'd use",
    },
    websiteBlueprint: {
      headline: `The ${niche.charAt(0).toUpperCase() + niche.slice(1)} Products That Actually Work`,
      subheadline: "Honest reviews, real comparisons, and no sponsored BS",
      heroCtaText: "See Top Picks",
      sections: [
        "Hero with value proposition",
        "Featured product comparison table",
        "In-depth review cards with pros/cons",
        "Category navigation",
        "About section (why trust this site)",
        "Email opt-in for deals and updates",
      ],
      trustElements: [
        "Personal testing disclosure",
        "Affiliate relationship transparency",
        "Reader testimonials or comments",
        "Social proof (subscriber count)",
      ],
      urgencyLine: "Prices and availability change — these are today's best verified deals",
    },
    marketingAngles: [
      { hook: `Stop wasting money on ${niche} products that don't work`, angle: "Problem-aware comparison", platform: "Google SEO / YouTube" },
      { hook: `I tested the top 5 ${niche} products so you don't have to`, angle: "Authority reviewer", platform: "YouTube / TikTok" },
      { hook: `The ${niche} product everyone is recommending is NOT the best option`, angle: "Contrarian truth", platform: "Social media / Reddit" },
      { hook: `$50 vs $200: which ${niche} product actually delivers?`, angle: "Price comparison", platform: "YouTube / Blog" },
      { hook: `The only ${niche} buying guide you'll ever need`, angle: "Definitive resource", platform: "Google SEO" },
    ],
    emailSequence: [
      { subject: `The #1 mistake people make buying ${niche} products`, purpose: "Hook and establish authority", timing: "Immediately after opt-in" },
      { subject: "My honest top 3 picks (and why)", purpose: "Deliver value and first recommendations", timing: "Day 1" },
      { subject: "The one I use every day", purpose: "Personal recommendation with affiliate link", timing: "Day 3" },
      { subject: `New deal alert: ${niche} sale this week`, purpose: "Urgency-driven promotion", timing: "Day 5" },
      { subject: "Quick question for you", purpose: "Engagement + segment by interest", timing: "Day 7" },
    ],
    actionRoadmap: [
      { phase: "Foundation", timeframe: "Week 1", tasks: [
        `Research top 10 affiliate programs in ${niche}`,
        "Sign up for 3-5 programs with best commissions",
        "Set up a simple review website or landing page",
        "Write your first 3 product reviews",
        "Set up email capture with lead magnet",
      ]},
      { phase: "Content & Traffic", timeframe: "Week 2-3", tasks: [
        "Create comparison content (top 5, vs articles)",
        "Set up YouTube or TikTok channel for video reviews",
        "Publish 2-3 pieces of content per week",
        "Optimize for SEO keywords in your niche",
        "Start sharing on relevant communities (Reddit, forums)",
      ]},
      { phase: "Scale & Optimize", timeframe: "Week 4+", tasks: [
        "Analyze which content drives the most clicks",
        "Double down on winning formats",
        "Test paid traffic to top-performing pages",
        "Build email list and nurture with weekly recommendations",
        "Negotiate higher commission rates with top-performing programs",
      ]},
    ],
  };
}

function generateDropshipping(p: HimalayaProfileInput): BusinessFoundation {
  const niche = p.niche || "home & lifestyle";
  return {
    path: "dropshipping",
    pathLabel: "Dropshipping / E-commerce",
    businessProfile: {
      businessType: "Dropshipping Store",
      niche,
      targetCustomer: `Impulse buyers and problem-solvers in the ${niche} space`,
      painPoint: `They want convenient, affordable ${niche} products that solve a specific problem`,
      uniqueAngle: `Curated, problem-solving ${niche} products with fast delivery and great support`,
    },
    idealCustomer: {
      who: `Online shoppers who scroll social media and buy impulsively when they see the right product`,
      demographics: "18-40, active on TikTok/Instagram, comfortable buying online",
      psychographics: "Trend-aware, value convenience, influenced by social proof and viral content",
      whereToBuy: "Social media ads, TikTok discovery, Instagram shopping",
      buyingTrigger: "Seeing the product solve a relatable problem in a short video",
    },
    offerDirection: {
      coreOffer: `Curated ${niche} products that solve everyday problems`,
      pricing: "$19.99-$49.99 sweet spot for impulse purchases",
      deliverable: "Physical product shipped directly from supplier",
      transformation: "Making their daily life easier, more organized, or more enjoyable",
      guarantee: "30-day satisfaction guarantee with easy returns",
    },
    websiteBlueprint: {
      headline: `${niche.charAt(0).toUpperCase() + niche.slice(1)} Solutions That Actually Work`,
      subheadline: "Discover products that make everyday life better",
      heroCtaText: "Shop Now",
      sections: [
        "Hero with featured product",
        "Best sellers grid",
        "Problem-solution product showcase",
        "Customer reviews carousel",
        "Trust badges and guarantees",
        "FAQ section",
      ],
      trustElements: [
        "Customer review photos",
        "Order count social proof",
        "Secure checkout badges",
        "Money-back guarantee badge",
      ],
      urgencyLine: "Free shipping on orders over $35 — limited time",
    },
    marketingAngles: [
      { hook: "I found this on TikTok and it actually works", angle: "Social discovery", platform: "TikTok / Reels" },
      { hook: `This ${niche} product is going viral for a reason`, angle: "Trend riding", platform: "TikTok / Instagram" },
      { hook: "I can't believe this only costs $29", angle: "Value shock", platform: "Facebook / Instagram" },
      { hook: "POV: You finally found the solution to [problem]", angle: "Relatable POV", platform: "TikTok" },
      { hook: `5 ${niche} products under $30 that feel luxury`, angle: "Affordable luxury", platform: "YouTube Shorts / TikTok" },
    ],
    emailSequence: [
      { subject: "Your order is on its way!", purpose: "Order confirmation and excitement", timing: "Immediately after purchase" },
      { subject: "How to get the most out of your new product", purpose: "Reduce returns with usage tips", timing: "Day 2" },
      { subject: "Did you see this?", purpose: "Cross-sell related product", timing: "Day 5" },
      { subject: "Your exclusive 15% off code", purpose: "Repeat purchase incentive", timing: "Day 10" },
      { subject: "We'd love your feedback", purpose: "Review request for social proof", timing: "Day 14" },
    ],
    actionRoadmap: [
      { phase: "Store Setup", timeframe: "Week 1", tasks: [
        `Research winning products in ${niche} using TikTok and AliExpress`,
        "Set up Shopify store with clean theme",
        "Import 5-10 products with optimized descriptions",
        "Set up payment processing and shipping rates",
        "Install essential apps: reviews, upsells, email",
      ]},
      { phase: "Testing", timeframe: "Week 2-3", tasks: [
        "Create 3-5 short-form video ads per product",
        "Launch test campaigns on TikTok or Facebook ($20-50/day)",
        "Test 3 products simultaneously",
        "Kill losers after 48 hours, scale winners",
        "Set up abandoned cart email sequence",
      ]},
      { phase: "Scale", timeframe: "Week 4+", tasks: [
        "Increase budget on winning products",
        "Launch retargeting campaigns",
        "Add post-purchase upsells",
        "Build email list for repeat customers",
        "Test new products weekly to keep pipeline fresh",
      ]},
    ],
  };
}

function generateAgency(p: HimalayaProfileInput): BusinessFoundation {
  const niche = p.niche || "local businesses";
  return {
    path: "agency",
    pathLabel: "Agency / Service Business",
    businessProfile: {
      businessType: "Digital Marketing Agency",
      niche: `Serving ${niche}`,
      targetCustomer: `${niche.charAt(0).toUpperCase() + niche.slice(1)} owners who know they need better marketing but don't have time to do it themselves`,
      painPoint: "They're busy running their business and losing money to bad marketing, no online presence, or weak follow-up",
      uniqueAngle: `Done-for-you marketing systems specifically built for ${niche}`,
    },
    idealCustomer: {
      who: `Owners of ${niche} doing $10k-100k/month who want to grow but are stuck`,
      demographics: "30-55, business owners, decision makers",
      psychographics: "Value results over theory, want proof, busy and impatient",
      whereToBuy: "Referrals, cold outreach, local networking, Google search",
      buyingTrigger: "Seeing clear ROI potential with specific examples from their industry",
    },
    offerDirection: {
      coreOffer: `Complete marketing system for ${niche}: website, ads, follow-up, and reporting`,
      pricing: "$1,500-$5,000/month retainer or $3,000-$10,000 setup fee",
      deliverable: "Done-for-you website, ad campaigns, email sequences, and monthly reporting",
      transformation: "From guessing at marketing to having a system that predictably generates leads",
      guarantee: "90-day performance benchmark with transparent reporting",
    },
    websiteBlueprint: {
      headline: `We Build Marketing Systems for ${niche.charAt(0).toUpperCase() + niche.slice(1)}`,
      subheadline: "More leads. More clients. Less guesswork.",
      heroCtaText: "Book a Free Strategy Call",
      sections: [
        "Hero with clear offer and CTA",
        "Problem section (what's broken for most businesses)",
        "Solution overview (your system)",
        "Case studies or results",
        "Service packages",
        "FAQ and objection handling",
        "Booking calendar embed",
      ],
      trustElements: [
        "Client logos or testimonials",
        "Before/after metrics",
        "Industry-specific case studies",
        "Guarantee or risk-reversal",
      ],
      urgencyLine: "We only take on 5 new clients per month to maintain quality",
    },
    marketingAngles: [
      { hook: `Most ${niche} waste $2,000/month on marketing that doesn't work`, angle: "Problem callout", platform: "Facebook / LinkedIn" },
      { hook: `How one ${niche.split(" ")[0]} went from 3 leads/week to 15`, angle: "Case study proof", platform: "LinkedIn / Email" },
      { hook: `The 3 marketing mistakes every ${niche.split(" ")[0]} makes`, angle: "Educational authority", platform: "YouTube / Blog" },
      { hook: "Your website is costing you clients (here's proof)", angle: "Audit hook", platform: "Cold email / DM" },
      { hook: `I'll rebuild your marketing system in 30 days or you don't pay`, angle: "Risk-reversal offer", platform: "Cold outreach" },
    ],
    emailSequence: [
      { subject: `Quick question about your ${niche.split(" ")[0]} marketing`, purpose: "Cold outreach opener", timing: "Outreach Day 1" },
      { subject: "The marketing gap I noticed on your site", purpose: "Value-first follow-up with specific observation", timing: "Day 3" },
      { subject: `How [similar business] doubled their leads in 60 days`, purpose: "Social proof and case study", timing: "Day 5" },
      { subject: "Free audit — no strings attached", purpose: "Low-friction offer to start conversation", timing: "Day 7" },
      { subject: "Last follow-up (for now)", purpose: "Breakup email that often gets highest response", timing: "Day 10" },
    ],
    actionRoadmap: [
      { phase: "Foundation", timeframe: "Week 1", tasks: [
        `Define your exact service offer for ${niche}`,
        "Build your agency website with booking calendar",
        "Create 1-2 case studies (even hypothetical/free work)",
        "Set up CRM to track leads and clients",
        "Write your cold outreach templates",
      ]},
      { phase: "Client Acquisition", timeframe: "Week 2-3", tasks: [
        "Send 10 personalized outreach messages per day",
        "Join local business groups and networking events",
        "Offer 2-3 free audits to build pipeline",
        "Follow up with every lead within 24 hours",
        "Close your first client (even at discount)",
      ]},
      { phase: "Deliver & Scale", timeframe: "Week 4+", tasks: [
        "Deliver exceptional results for first client",
        "Document your process into repeatable SOPs",
        "Ask for testimonials and referrals",
        "Raise prices after first 3 clients",
        "Hire first contractor to handle delivery",
      ]},
    ],
  };
}

function generateFreelance(p: HimalayaProfileInput): BusinessFoundation {
  const primarySkill = p.skills.find(s => s !== "none") || "communication";
  const skillMap: Record<string, string> = { communication: "copywriting & content", technical: "web development", creative: "design & video", sales: "sales consulting", operations: "operations management" };
  const skillLabel = skillMap[primarySkill] || primarySkill;
  const niche = p.niche || "startups and small businesses";
  return {
    path: "freelance",
    pathLabel: "Freelancing",
    businessProfile: {
      businessType: "Freelance Service",
      niche: `${skillLabel} for ${niche}`,
      targetCustomer: `${niche.charAt(0).toUpperCase() + niche.slice(1)} who need ${skillLabel} but can't hire full-time`,
      painPoint: `They need quality ${skillLabel} work but can't justify a full-time hire or agency retainer`,
      uniqueAngle: `Senior-quality ${skillLabel} at freelance pricing, with fast turnaround and direct communication`,
    },
    idealCustomer: {
      who: `Founders and managers at ${niche} who need ${skillLabel} help`,
      demographics: "25-50, decision makers, budget-conscious but value quality",
      psychographics: "Time-poor, want reliable partners, prefer working with individuals over agencies",
      whereToBuy: "Upwork, LinkedIn, referrals, Twitter/X, niche job boards",
      buyingTrigger: "Seeing relevant portfolio work and fast, professional communication",
    },
    offerDirection: {
      coreOffer: `${skillLabel.charAt(0).toUpperCase() + skillLabel.slice(1)} services — project-based or ongoing`,
      pricing: "$50-150/hour or project-based pricing ($500-5,000 per project)",
      deliverable: `Completed ${skillLabel} deliverables with revisions included`,
      transformation: `From struggling with ${skillLabel} to having it handled by a reliable professional`,
      guarantee: "Satisfaction guarantee with revision rounds included in every project",
    },
    websiteBlueprint: {
      headline: `${skillLabel.charAt(0).toUpperCase() + skillLabel.slice(1)} That Drives Results`,
      subheadline: `Freelance ${skillLabel} for ${niche} who want quality without the agency markup`,
      heroCtaText: "See My Work",
      sections: ["Hero with portfolio highlight", "Services overview", "Portfolio gallery", "Client testimonials", "Process breakdown", "Contact/booking form"],
      trustElements: ["Client logos", "Testimonial quotes", "Project count", "Response time guarantee"],
      urgencyLine: "Currently accepting new projects — availability changes monthly",
    },
    marketingAngles: [
      { hook: `Your ${skillLabel} shouldn't be the bottleneck`, angle: "Pain-focused", platform: "LinkedIn" },
      { hook: `I just finished this project in 48 hours (portfolio share)`, angle: "Speed + quality proof", platform: "Twitter/X" },
      { hook: `3 ${skillLabel} mistakes that are costing you conversions`, angle: "Educational authority", platform: "LinkedIn / Blog" },
      { hook: "Here's what I'd change about your [site/copy/design]", angle: "Unsolicited value", platform: "Cold DM" },
    ],
    emailSequence: [
      { subject: "Quick intro — I specialize in [skill] for [niche]", purpose: "Cold outreach", timing: "Outreach Day 1" },
      { subject: "A quick win I noticed for your business", purpose: "Value-first follow-up", timing: "Day 3" },
      { subject: "Portfolio: recent work for [similar company]", purpose: "Social proof", timing: "Day 5" },
      { subject: "Happy to do a small test project", purpose: "Low-risk entry offer", timing: "Day 7" },
    ],
    actionRoadmap: [
      { phase: "Launch", timeframe: "Week 1", tasks: [
        "Define your core service offering and pricing",
        "Build a portfolio page (even with personal projects)",
        "Create profiles on Upwork, Fiverr, or Contra",
        "Optimize your LinkedIn profile as a service provider",
        "Send 5 proposals or pitches daily",
      ]},
      { phase: "Build Pipeline", timeframe: "Week 2-3", tasks: [
        "Deliver first project with exceptional quality",
        "Ask for testimonial and referral",
        "Publish 1-2 case studies from completed work",
        "Expand outreach to LinkedIn and Twitter/X",
        "Raise rates after every 3 completed projects",
      ]},
      { phase: "Productize", timeframe: "Month 2+", tasks: [
        "Create a productized service with fixed scope and pricing",
        "Build a simple booking and payment flow",
        "Develop templates and processes for faster delivery",
        "Start content marketing to attract inbound leads",
        "Consider transitioning to retainer model for recurring revenue",
      ]},
    ],
  };
}

function generateGenericPath(p: HimalayaProfileInput, path: BusinessPath): BusinessFoundation {
  const niche = p.niche || "your chosen market";
  const labels: Record<string, string> = {
    coaching: "Coaching / Consulting",
    local_service: "Local Service Business",
    ecommerce_brand: "E-commerce Brand",
    digital_product: "Digital Products",
  };
  return {
    path,
    pathLabel: labels[path] || path,
    businessProfile: {
      businessType: labels[path] || path,
      niche,
      targetCustomer: `People in ${niche} who need professional help`,
      painPoint: `Struggling to find reliable, quality solutions in ${niche}`,
      uniqueAngle: `A structured, results-driven approach specifically designed for ${niche}`,
    },
    idealCustomer: {
      who: `Motivated individuals or businesses in ${niche}`,
      demographics: "25-50, willing to invest in solutions",
      psychographics: "Value expertise, want clear outcomes, prefer working with specialists",
      whereToBuy: "Online search, social media, referrals, industry events",
      buyingTrigger: "Seeing proof of results and feeling understood by the provider",
    },
    offerDirection: {
      coreOffer: `Professional ${labels[path] || path} services for ${niche}`,
      pricing: "Based on value delivered — start competitive, raise with proof",
      deliverable: "Clear outcomes tied to the client's specific goals",
      transformation: `From stuck or struggling to structured, growing, and confident in ${niche}`,
      guarantee: "Results-focused engagement with clear milestones",
    },
    websiteBlueprint: {
      headline: `The ${niche.charAt(0).toUpperCase() + niche.slice(1)} Solution You've Been Looking For`,
      subheadline: "Professional results without the guesswork",
      heroCtaText: "Get Started",
      sections: ["Hero section", "Problem/solution", "Services", "Testimonials", "Process", "Contact"],
      trustElements: ["Testimonials", "Results metrics", "Professional credentials", "Guarantee"],
      urgencyLine: "Limited availability — book your spot today",
    },
    marketingAngles: [
      { hook: `The biggest mistake people make in ${niche}`, angle: "Problem awareness", platform: "Social media" },
      { hook: "Here's what nobody tells you about getting results", angle: "Truth-telling authority", platform: "Content / Video" },
      { hook: "I helped [client type] achieve [result] in [timeframe]", angle: "Case study", platform: "LinkedIn / Email" },
    ],
    emailSequence: [
      { subject: "Welcome — here's what happens next", purpose: "Onboarding", timing: "Immediately" },
      { subject: "The #1 thing that will accelerate your results", purpose: "Value delivery", timing: "Day 2" },
      { subject: "Quick question about your goals", purpose: "Engagement", timing: "Day 4" },
      { subject: "A success story you'll relate to", purpose: "Social proof", timing: "Day 7" },
    ],
    actionRoadmap: [
      { phase: "Setup", timeframe: "Week 1", tasks: [
        "Define your exact offer and target market",
        "Build your web presence (site + social profiles)",
        "Create initial content demonstrating expertise",
        "Set up lead capture and CRM",
        "Start outreach to potential clients/customers",
      ]},
      { phase: "Traction", timeframe: "Week 2-4", tasks: [
        "Get your first 3 clients or customers",
        "Deliver exceptional results",
        "Collect testimonials and case studies",
        "Refine your offer based on feedback",
        "Scale marketing with proven messaging",
      ]},
      { phase: "Growth", timeframe: "Month 2+", tasks: [
        "Systematize delivery and operations",
        "Build referral and repeat-customer programs",
        "Expand marketing channels",
        "Consider hiring or outsourcing",
        "Raise prices with confidence",
      ]},
    ],
  };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateFoundation(
  profile: HimalayaProfileInput,
  path: BusinessPath
): BusinessFoundation {
  switch (path) {
    case "affiliate": return generateAffiliate(profile);
    case "dropshipping": return generateDropshipping(profile);
    case "agency": return generateAgency(profile);
    case "freelance": return generateFreelance(profile);
    default: return generateGenericPath(profile, path);
  }
}

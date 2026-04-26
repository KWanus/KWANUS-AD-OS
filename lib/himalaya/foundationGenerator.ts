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
  adCreatives: {
    platform: string;
    format: string;
    hook: string;
    visualStyle: string;
    imagePrompt: string;
    videoScript?: {
      duration: string;
      hook: string;
      problem: string;
      solution: string;
      cta: string;
    };
  }[];
};

// ---------------------------------------------------------------------------
// Ad Creative Generation Helper
// ---------------------------------------------------------------------------

function generateAdCreatives(params: {
  productName: string;
  niche: string;
  benefits: string[];
  platform: string;
  hook: string;
  angle: string;
}): {
  platform: string;
  format: string;
  hook: string;
  visualStyle: string;
  imagePrompt: string;
  videoScript?: {
    duration: string;
    hook: string;
    problem: string;
    solution: string;
    cta: string;
  };
} {
  const { productName, niche, benefits, platform, hook, angle } = params;
  const mainBenefit = benefits[0] || `Solves ${niche} problems`;

  // Platform-specific formats and styles
  const formats: Record<string, { format: string; visualStyle: string; ar: string }> = {
    "TikTok": { format: "vertical-video", visualStyle: "UGC style, authentic, relatable", ar: "9:16" },
    "Instagram": { format: "square-video", visualStyle: "Aesthetic, clean, modern", ar: "1:1" },
    "Facebook": { format: "static-image", visualStyle: "Lifestyle photography, aspirational", ar: "4:5" },
    "YouTube": { format: "horizontal-video", visualStyle: "Professional, polished", ar: "16:9" },
  };

  const platformKey = Object.keys(formats).find(k => platform.includes(k)) || "TikTok";
  const { format, visualStyle, ar } = formats[platformKey];

  // Generate Midjourney/DALL-E prompt
  const imagePrompt = `${visualStyle} product photography of ${productName}, ${mainBenefit}, modern setting, natural lighting, --ar ${ar} --style raw --v 6`;

  // Generate video script (for video formats)
  let videoScript: {
    duration: string;
    hook: string;
    problem: string;
    solution: string;
    cta: string;
  } | undefined;

  if (format.includes("video")) {
    videoScript = {
      duration: "15-30 seconds",
      hook: `0-3s: ${hook}`,
      problem: `3-10s: Show the ${niche} problem people face`,
      solution: `10-25s: Demonstrate ${productName} solving it - ${mainBenefit}`,
      cta: `25-30s: "Link in bio to get ${productName}" with product shot`,
    };
  }

  return {
    platform: platformKey,
    format,
    hook,
    visualStyle,
    imagePrompt,
    videoScript,
  };
}

// ---------------------------------------------------------------------------
// Path-specific generators
// ---------------------------------------------------------------------------

async function generateAffiliate(p: HimalayaProfileInput): Promise<BusinessFoundation> {
  const niche = p.niche || "health & wellness";

  // 🔥 CRITICAL: Find a REAL affiliate product to promote
  let product: { name: string; commission: number; platform: string; description: string; vendorPageUrl: string } | null = null;
  try {
    const { findProducts } = await import("../paths/productFinder");
    const results = await findProducts(niche);
    if (results.products.length > 0) {
      const top = results.products[0];
      product = {
        name: top.name,
        commission: top.commission,
        platform: top.platform.charAt(0).toUpperCase() + top.platform.slice(1),
        description: top.description,
        vendorPageUrl: top.vendorPageUrl,
      };
      console.log(`[Foundation] Found product: ${top.name} ($${top.commission}/sale)`);
    }
  } catch (err) {
    console.warn("[Foundation] Product research failed, using generic template:", err);
  }

  const productName = product?.name || `Top ${niche} Solution`;
  const commissionAmount = product?.commission || 45;
  const platform = product?.platform || "ClickBank";
  const productDesc = product?.description || `A proven ${niche} program with great results`;

  return {
    path: "affiliate",
    pathLabel: "Affiliate Marketing",
    businessProfile: {
      businessType: "Affiliate Marketing",
      niche,
      targetCustomer: `People actively searching for ${productName} or proven ${niche} solutions`,
      painPoint: `They've tried generic solutions in ${niche} that didn't work - they need something proven like ${productName}`,
      uniqueAngle: `Expert, honest review of ${productName} - helping people make the right buying decision with real insights`,
    },
    idealCustomer: {
      who: `Buyers researching ${productName} or looking for proven ${niche} solutions`,
      demographics: "25-45, tech-savvy, willing to spend $30-200 on solutions",
      psychographics: "Value authenticity, read reviews, want proof before buying",
      whereToBuy: "Google search, YouTube reviews, social media recommendations",
      buyingTrigger: `Seeing an honest, detailed review of ${productName} from someone they trust`,
    },
    offerDirection: {
      coreOffer: `Promote ${productName} and earn $${commissionAmount} commission per sale through ${platform}`,
      pricing: `Earn $${commissionAmount} per sale promoting ${productName}`,
      deliverable: `Complete sales website promoting ${productName} with your ${platform} affiliate link embedded`,
      transformation: `Turn visitors into ${productName} buyers and earn passive commissions on autopilot`,
      guarantee: "Full FTC disclosure - transparent affiliate relationship with honest product review",
    },
    websiteBlueprint: {
      headline: `${productName}: Honest Review & Results`,
      subheadline: `Real testing, honest feedback, and everything you need to know about ${productName}`,
      heroCtaText: `Get ${productName} Now →`,
      sections: [
        `Hero with ${productName} value proposition`,
        `What is ${productName}? (Product overview)`,
        `Honest pros and cons of ${productName}`,
        `Who ${productName} is perfect for`,
        `Real results from ${productName} users`,
        `How to get ${productName} (CTA with affiliate link)`,
        "FTC disclosure and transparency section",
      ],
      trustElements: [
        `Full FTC disclosure - "I earn a commission if you buy ${productName} through my link"`,
        `Honest review - both pros AND cons of ${productName}`,
        "Real user testimonials and results",
        "Money-back guarantee information",
      ],
      urgencyLine: `Limited time: Get ${productName} now before the price increases`,
    },
    marketingAngles: [
      { hook: `${productName}: My honest review after 30 days`, angle: "Personal experience", platform: "YouTube / Blog" },
      { hook: `Is ${productName} worth it? Real results revealed`, angle: "Results-focused review", platform: "YouTube / TikTok" },
      { hook: `${productName} vs competitors: Which one actually works?`, angle: "Comparison review", platform: "Google SEO" },
      { hook: `I tested ${productName} so you don't have to - here's what happened`, angle: "Authority reviewer", platform: "Social media" },
      { hook: `The truth about ${productName} that nobody tells you`, angle: "Contrarian insight", platform: "Reddit / Forums" },
    ],
    emailSequence: [
      { subject: `The truth about ${productName}`, purpose: "Hook and establish credibility", timing: "Immediately after opt-in" },
      { subject: `My honest ${productName} review (pros & cons)`, purpose: "Deliver detailed review with value", timing: "Day 1" },
      { subject: `Who ${productName} is NOT for`, purpose: "Build trust through honesty", timing: "Day 3" },
      { subject: `Special ${productName} bonus offer inside`, purpose: "Urgency and exclusive incentive", timing: "Day 5" },
      { subject: `Still deciding on ${productName}? Read this`, purpose: "Address objections and close", timing: "Day 7" },
    ],
    actionRoadmap: [
      { phase: "Launch", timeframe: "Day 1", tasks: [
        `✅ DONE: Himalaya found ${productName} for you ($${commissionAmount}/sale)`,
        `✅ DONE: Complete sales website built and deployed`,
        `Sign up for ${platform} affiliate account`,
        `Get your unique affiliate link for ${productName}`,
        `Test the website - make sure everything works`,
      ]},
      { phase: "Drive Traffic", timeframe: "Week 1-2", tasks: [
        `Create YouTube review video about ${productName}`,
        `Write blog post: "${productName} Review: My Honest Experience"`,
        `Share on Reddit/Facebook groups related to ${niche}`,
        `Run Facebook/Google ads to your review page`,
        `Post TikTok/Instagram content about ${productName}`,
      ]},
      { phase: "Scale & Earn", timeframe: "Week 3+", tasks: [
        `Analyze which traffic source drives the most sales`,
        `Double down on your best-performing channel`,
        `Add email follow-up sequence for visitors who don't buy`,
        `Create bonus offer to increase conversion rate`,
        `Scale winning ads to $100-500/day ad spend`,
      ]},
    ],
    adCreatives: [
      generateAdCreatives({
        productName,
        niche,
        benefits: [productDesc],
        platform: "TikTok",
        hook: `${productName}: My honest review after 30 days`,
        angle: "Personal experience UGC",
      }),
      generateAdCreatives({
        productName,
        niche,
        benefits: [productDesc],
        platform: "Instagram",
        hook: `Is ${productName} worth it? Real results revealed`,
        angle: "Results showcase",
      }),
      generateAdCreatives({
        productName,
        niche,
        benefits: [productDesc],
        platform: "Facebook",
        hook: `The truth about ${productName} that nobody tells you`,
        angle: "Contrarian insight",
      }),
      generateAdCreatives({
        productName,
        niche,
        benefits: [productDesc],
        platform: "YouTube",
        hook: `${productName} vs competitors: Which one actually works?`,
        angle: "Comparison review",
      }),
    ],
  };
}

async function generateDropshipping(p: HimalayaProfileInput): Promise<BusinessFoundation> {
  const niche = p.niche || "home & lifestyle";

  // 🔥 CRITICAL: Find REAL trending products to sell
  let product: { name: string; price: number; description: string; benefits: string[] } | null = null;
  try {
    const { findProducts } = await import("../paths/productFinder");
    const results = await findProducts(niche);
    if (results.products.length > 0) {
      const top = results.products[0];
      product = {
        name: top.name,
        price: top.avgSalePrice,
        description: top.description,
        benefits: top.benefits,
      };
      console.log(`[Foundation] Found dropship product: ${top.name} (sell at $${top.avgSalePrice})`);
    }
  } catch (err) {
    console.warn("[Foundation] Product research failed, using generic template:", err);
  }

  const productName = product?.name || `Trending ${niche} Product`;
  const sellingPrice = product?.price || 29.99;
  const productDesc = product?.description || `A viral ${niche} product that's trending on TikTok`;
  const benefits = product?.benefits || [`Solves ${niche} problems`, "High-quality materials", "Fast shipping"];

  return {
    path: "dropshipping",
    pathLabel: "Dropshipping / E-commerce",
    businessProfile: {
      businessType: "Dropshipping Store",
      niche,
      targetCustomer: `Impulse buyers looking for ${productName} or similar viral ${niche} products`,
      painPoint: `They see ${productName} trending everywhere and want to buy it from a trusted store`,
      uniqueAngle: `Exclusive dropship store for ${productName} - fast shipping, great support, verified reviews`,
    },
    idealCustomer: {
      who: `Online shoppers who saw ${productName} on TikTok/Instagram and want to buy it`,
      demographics: "18-40, active on TikTok/Instagram, comfortable buying online",
      psychographics: "Trend-aware, value convenience, influenced by social proof and viral content",
      whereToBuy: "Social media ads, TikTok discovery, Instagram shopping",
      buyingTrigger: `Seeing ${productName} solve a relatable problem in a short video`,
    },
    offerDirection: {
      coreOffer: `${productName} - ${productDesc}`,
      pricing: `$${sellingPrice.toFixed(2)} (impulse-buy price point)`,
      deliverable: `${productName} shipped directly to customer within 7-14 days`,
      transformation: `${benefits[0]} - making life easier with ${productName}`,
      guarantee: "30-day satisfaction guarantee with easy returns",
    },
    websiteBlueprint: {
      headline: `${productName}: Get Yours Before It Sells Out`,
      subheadline: productDesc,
      heroCtaText: `Buy Now - $${sellingPrice.toFixed(2)}`,
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
      { hook: `I found the ${productName} on TikTok and it actually works`, angle: "Social discovery", platform: "TikTok / Reels" },
      { hook: `${productName} is going viral for a reason - ${benefits[0]}`, angle: "Trend riding", platform: "TikTok / Instagram" },
      { hook: `I can't believe ${productName} only costs $${sellingPrice.toFixed(2)}`, angle: "Value shock", platform: "Facebook / Instagram" },
      { hook: `POV: You finally found ${productName} and it changes everything`, angle: "Relatable POV", platform: "TikTok" },
      { hook: `Why everyone is buying ${productName} right now`, angle: "FOMO/trending", platform: "YouTube Shorts / TikTok" },
    ],
    emailSequence: [
      { subject: `Your ${productName} is on its way! 🎉`, purpose: "Order confirmation and excitement", timing: "Immediately after purchase" },
      { subject: `How to get the most out of your ${productName}`, purpose: "Reduce returns with usage tips", timing: "Day 2" },
      { subject: `This pairs perfectly with your ${productName}...`, purpose: "Cross-sell related product", timing: "Day 5" },
      { subject: `Your exclusive 15% off code (${productName} customers only)`, purpose: "Repeat purchase incentive", timing: "Day 10" },
      { subject: `Love your ${productName}? Leave a review for 10% off`, purpose: "Review request for social proof", timing: "Day 14" },
    ],
    actionRoadmap: [
      { phase: "Launch", timeframe: "Day 1", tasks: [
        `✅ DONE: Himalaya found ${productName} for you (trending ${niche} product)`,
        `✅ DONE: Complete sales website built with product pages, checkout, emails`,
        `Set up Shopify/WooCommerce store (or Himalaya can host it)`,
        `Find supplier for ${productName} on AliExpress/Alibaba`,
        `Set up payment processing (Stripe/PayPal)`,
      ]},
      { phase: "Testing", timeframe: "Week 1-2", tasks: [
        `Create 3-5 TikTok/Instagram ads showing ${productName} in action`,
        `Launch test ad campaign ($20-50/day budget)`,
        `Test different angles: problem-solution, FOMO, social proof`,
        `Track which ad creative gets best ROAS`,
        `Set up abandoned cart email sequence`,
      ]},
      { phase: "Scale", timeframe: "Week 3+", tasks: [
        `Scale winning ads to $100-500/day`,
        `Add upsells and cross-sells at checkout`,
        `Launch retargeting campaigns for visitors`,
        `Build email list for repeat customers`,
        `Test 1-2 new ${niche} products weekly`,
      ]},
    ],
    adCreatives: [
      generateAdCreatives({
        productName,
        niche,
        benefits,
        platform: "TikTok",
        hook: `I found the ${productName} on TikTok and it actually works`,
        angle: "Social discovery UGC",
      }),
      generateAdCreatives({
        productName,
        niche,
        benefits,
        platform: "Instagram",
        hook: `${productName} is going viral for a reason - ${benefits[0]}`,
        angle: "Trend riding",
      }),
      generateAdCreatives({
        productName,
        niche,
        benefits,
        platform: "Facebook",
        hook: `I can't believe ${productName} only costs $${sellingPrice.toFixed(2)}`,
        angle: "Value shock",
      }),
      generateAdCreatives({
        productName,
        niche,
        benefits,
        platform: "TikTok",
        hook: `POV: You finally found ${productName} and it changes everything`,
        angle: "Relatable transformation",
      }),
    ],
  };
}

async function generateAgency(p: HimalayaProfileInput): Promise<BusinessFoundation> {
  const niche = p.niche || "local businesses";

  // 🔥 RESEARCH: Find what agencies are missing in this niche
  let marketGap = "complete marketing systems";
  let avgPrice = "$2,000-$5,000/month";

  // Future: Add competitor research here to find real gaps
  // For now, use intelligent defaults based on common patterns

  return {
    path: "agency",
    pathLabel: "Agency / Service Business",
    businessProfile: {
      businessType: "Digital Marketing Agency",
      niche: `Serving ${niche}`,
      targetCustomer: `${niche.charAt(0).toUpperCase() + niche.slice(1)} owners who need ${marketGap} but can't hire full-time`,
      painPoint: `They're losing money to bad marketing - need ${marketGap} done FOR them`,
      uniqueAngle: `Done-for-you ${marketGap} specifically built for ${niche} (not generic templates)`,
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

export async function generateFoundation(
  profile: HimalayaProfileInput,
  path: BusinessPath
): Promise<BusinessFoundation> {
  switch (path) {
    case "affiliate": return await generateAffiliate(profile);
    case "dropshipping": return await generateDropshipping(profile);
    case "agency": return await generateAgency(profile);
    case "freelance": return generateFreelance(profile);
    default: return generateGenericPath(profile, path);
  }
}

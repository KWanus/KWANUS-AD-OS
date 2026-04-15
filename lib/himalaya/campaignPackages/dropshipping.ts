// ---------------------------------------------------------------------------
// DROPSHIPPING / E-COMMERCE — Complete Campaign Package
// Single product → UGC ads → scale winners → $1K/day
// ---------------------------------------------------------------------------

import type { CampaignPackage } from "../campaignPackageGenerator";

export function getDropshippingCampaignPackage(input: {
  subNiche?: string;
  targetIncome: number;
}): CampaignPackage {
  const dailyTarget = Math.round(input.targetIncome / 30);
  const niche = input.subNiche ?? "trending products";

  const isBeauty = /beauty|skin|hair|glow|face/i.test(niche);
  const isPet = /pet|dog|cat|animal/i.test(niche);
  const isHome = /home|kitchen|gadget|clean|organiz/i.test(niche);
  const isFitness = /fitness|gym|workout|yoga/i.test(niche);

  let productCategory = "Trending Problem-Solver Product";
  let avgPayout = "$25";
  let avgOrderValue = "$45";
  let targetAudience = "Impulse buyers on TikTok/Instagram who need a quick solution";
  let costPerUnit = "$8-15";

  if (isBeauty) { productCategory = "Viral Beauty/Skincare Tool"; avgPayout = "$30"; avgOrderValue = "$55"; targetAudience = "Women 18-45 who follow beauty trends on TikTok"; costPerUnit = "$5-12"; }
  else if (isPet) { productCategory = "Viral Pet Product"; avgPayout = "$20"; avgOrderValue = "$40"; targetAudience = "Pet owners 25-55 who buy gifts for their pets"; costPerUnit = "$6-10"; }
  else if (isHome) { productCategory = "Kitchen/Home Gadget"; avgPayout = "$22"; avgOrderValue = "$42"; targetAudience = "Women 25-55 who love home organization and gadgets"; costPerUnit = "$7-14"; }
  else if (isFitness) { productCategory = "Fitness/Recovery Tool"; avgPayout = "$28"; avgOrderValue = "$50"; targetAudience = "Fitness enthusiasts 20-45 who buy workout accessories"; costPerUnit = "$8-15"; }

  const payoutNum = parseInt(avgPayout.replace(/[^0-9]/g, ""), 10);
  const salesNeeded = Math.ceil(dailyTarget / payoutNum);

  return {
    product: {
      name: productCategory,
      network: "Shopify/WooCommerce (your own store)",
      avgPayout: `${avgPayout} profit per sale (sell at ${avgOrderValue}, cost ${costPerUnit})`,
      targetAudience,
      whyItWins: "Dropshipping works because you never touch inventory. Find a winning product on AliExpress/CJ Dropshipping, sell it on TikTok Shop or your own store, supplier ships directly. Your job is marketing.",
      hoplink: "YOUR_STORE_URL",
    },

    math: {
      targetDaily: dailyTarget,
      payoutPerSale: payoutNum,
      salesNeeded,
      clicksNeeded: Math.ceil(salesNeeded / 0.03),
      conversionRate: 0.03,
      organicClicks: Math.round(Math.ceil(salesNeeded / 0.03) * 0.6),
      paidClicks: Math.round(Math.ceil(salesNeeded / 0.03) * 0.4),
      dailyAdBudget: 30,
      explanation: `$${dailyTarget}/day ÷ $${payoutNum} profit/sale = ${salesNeeded} sales needed daily.\nAt 3% store conversion → ~${Math.ceil(salesNeeded / 0.03)} visitors needed.\n60% from organic TikTok (free) + 40% from paid ads ($30/day).\n\nPhase 1: Find winning product (1-2 weeks testing).\nPhase 2: Scale winner with TikTok organic + paid.\nPhase 3: Add upsells to increase average order value.`,
    },

    scripts: [
      { id: 1, title: "Product Demo", style: "Identity Interrupt", length: "12-15 sec", postFirst: true, hook: "I can't believe this actually works this well.", body: "[Show product in use — satisfying result]. Okay so I've been using this for a week and the difference is insane. [Show before/after or process]. Everyone's been asking me about it so here you go.", cta: "Link in bio — selling out fast.", caption: "This is going viral for a reason 😳⬇️", hashtags: ["tiktokfinds", "musthave", niche.replace(/\s+/g, ""), "fyp", "viral"] },
      { id: 2, title: "Problem-Solution", style: "Warning", length: "15-18 sec", postFirst: true, hook: `Stop wasting money on ${isBeauty ? "expensive skincare" : isPet ? "cheap pet toys" : "products that don't work"}.`, body: `This one product replaced ${isBeauty ? "my entire shelf" : isPet ? "3 different things I was buying" : "everything else I was using"}. [Show product]. ${isBeauty ? "My skin has never looked better" : isPet ? "My dog is OBSESSED" : "It actually works. Like actually."} And it's under $${parseInt(avgOrderValue.replace(/[^0-9]/g, ""), 10)}.`, cta: "Link in bio before it sells out again.", caption: `Why did nobody tell me about this sooner 🤯`, hashtags: ["tiktokmademebuyit", niche.replace(/\s+/g, ""), "musthave", "viral"] },
      { id: 3, title: "Trending Sound + Demo", style: "Trending Audio", length: "10-12 sec", postFirst: true, hook: "[USE TRENDING SOUND — text overlay only]", body: `Text 1: "Things I bought from TikTok that actually work:"\nText 2: [Show product dramatically]\nText 3: "10/10 would buy again"\nText 4: "Link in bio"`, cta: "Link in bio", caption: "TikTok finds that actually work 💀⬇️", hashtags: ["tiktokfinds", "amazonfinds", niche.replace(/\s+/g, ""), "fyp"] },
      { id: 4, title: "ASMR Unboxing", style: "Curiosity Gap", length: "15-20 sec", postFirst: false, hook: "[ASMR — no talking, just sounds]", body: "[Slowly open package. Show product. Use it with satisfying sounds. Show result. Text overlay: 'best purchase I've made this year']", cta: "Link in bio 🔗", caption: "Best purchase I've made this year ✨ (link in bio)", hashtags: ["asmr", "unboxing", niche.replace(/\s+/g, ""), "satisfying"] },
      { id: 5, title: "Duet/Stitch React", style: "Story", length: "12-15 sec", postFirst: false, hook: "Someone asked if this product is worth it. Let me show you.", body: "[Stitch someone asking about the product category, then show your honest demo and result]", cta: "Worth every penny. Link in bio.", caption: "Is it worth it? Let me show you 👀", hashtags: [niche.replace(/\s+/g, ""), "worthit", "honest", "review"] },
      { id: 6, title: "Gift Guide", style: "Education", length: "15-18 sec", postFirst: false, hook: `Best gift for ${isPet ? "dog moms" : isBeauty ? "women who have everything" : "someone who loves cool stuff"} under $50.`, body: "[Show product beautifully. Explain why it's the perfect gift. Show reaction.]", cta: "Link in bio — ships fast.", caption: `Gift idea they'll actually love 🎁`, hashtags: ["giftideas", niche.replace(/\s+/g, ""), "under50", "gift"] },
      { id: 7, title: "Day-in-Life with Product", style: "Relatable Venting", length: "18-22 sec", postFirst: false, hook: "Products that make my daily routine better:", body: "[Show morning/evening routine incorporating the product naturally. Make it look essential, not forced.]", cta: "Everything linked in bio ⬇️", caption: "My daily essentials ✨", hashtags: ["routine", "essentials", niche.replace(/\s+/g, ""), "musthave"] },
      { id: 8, title: "Comparison", style: "Comparison", length: "15-18 sec", postFirst: false, hook: `${isBeauty ? "Expensive brand" : "Store-bought"} vs this $${parseInt(avgOrderValue.replace(/[^0-9]/g, ""), 10)} find.`, body: "[Side by side comparison. Show the cheaper option working just as well or better. Shock reaction.]", cta: "Why pay more? Link in bio.", caption: "This $40 find works BETTER than the $200 version 💀", hashtags: ["dupes", niche.replace(/\s+/g, ""), "savemoney", "comparison"] },
      { id: 9, title: "Customer Review Mashup", style: "Social Proof", length: "12-15 sec", postFirst: false, hook: "People are losing their minds over this product.", body: "[Show screenshots of customer reviews/DMs. Then show the product. Then show your own result.]", cta: "See why — link in bio.", caption: "The reviews don't lie 👀⬇️", hashtags: ["reviews", niche.replace(/\s+/g, ""), "customers", "viral"] },
      { id: 10, title: "Restock Alert", style: "Urgency", length: "10-12 sec", postFirst: false, hook: "This sold out 3 times. It's back in stock RIGHT NOW.", body: "[Quick product demo. Show the sold-out notifications. Show it's available again.]", cta: "Get it before it's gone — link in bio.", caption: "🚨 BACK IN STOCK — won't last 🚨", hashtags: [niche.replace(/\s+/g, ""), "restock", "backinstock", "hurry"] },
    ],

    bridgePage: {
      headline: `The ${productCategory} Everyone's Talking About`,
      subheadline: `Over 10,000+ sold. 4.8/5 stars. See why it's going viral.`,
      bodyParagraphs: [
        `If you've seen this on TikTok, you know why people are obsessed.`,
        `It solves ${isBeauty ? "the one skin problem everyone has" : isPet ? "the thing every pet owner struggles with" : "a problem you didn't know had such a simple solution"}.`,
        `And at under $${parseInt(avgOrderValue.replace(/[^0-9]/g, ""), 10)}, it's the best purchase you'll make this month.`,
      ],
      symptoms: [],
      scienceBlock: { title: "Why it works", body: "Simple, effective design backed by thousands of happy customers." },
      testimonials: [
        { text: "Bought 3 — one for me and two as gifts. Everyone loves it.", author: "Jessica M.", age: 34, result: "Bought 3!" },
        { text: "Skeptical at first but it actually works better than the expensive version.", author: "Ryan K.", age: 28, result: "Better than expensive brands" },
      ],
      ctaHeadline: "Get Yours Before It Sells Out Again",
      ctaButtonText: "Shop Now — 50% Off",
      ctaSubtext: "Free shipping · 30-day returns · Ships in 2-5 days",
      finalCtaHeadline: "Join 10,000+ Happy Customers",
    },

    emails: [
      { day: 0, subject: "Your order is confirmed! 🎉", body: "Hi {{first_name}},\n\nThank you for your order! It's being prepared now.\n\nYour tracking info will be sent within 24-48 hours.\n\nWhile you wait, check out what other customers are saying: [LINK]\n\nQuestions? Just reply to this email.", purpose: "Order confirmation" },
      { day: 1, subject: "Your package is on its way!", body: "{{first_name}}, great news — your order has shipped!\n\nTrack it here: [TRACKING_LINK]\n\nEstimated delivery: 3-7 business days.\n\nIn the meantime, here's a quick video showing how to get the best results: [LINK]", purpose: "Shipping notification" },
      { day: 3, subject: "Still thinking about it?", body: "Hi {{first_name}},\n\nNoticed you were checking out [PRODUCT] but didn't finish.\n\nHere's what you're missing:\n✓ 30-day money-back guarantee\n✓ Free shipping\n✓ 4.8/5 from 2,000+ customers\n\nComplete your order: [CART_LINK]\n\nUse code SAVE15 for 15% off.", purpose: "Cart recovery" },
      { day: 7, subject: "How's your [PRODUCT]? (quick question)", body: "{{first_name}},\n\nYou should have received your order by now.\n\nHow's it going? If you love it, would you mind leaving a quick review? It helps other customers decide.\n\n[REVIEW_LINK]\n\nIf anything isn't perfect, reply and we'll fix it immediately.", purpose: "Review request" },
      { day: 14, subject: "Something you might love (based on your purchase)", body: "{{first_name}},\n\nSince you loved [PRODUCT], we thought you'd like these:\n\n[CROSS-SELL PRODUCTS]\n\nAll under $50. All 4.5+ stars.\n\n[SHOP_LINK]", purpose: "Cross-sell" },
    ],

    contentStrategy: {
      postsPerDay: 5,
      pillars: [
        { name: "Product Demo/Result", percentage: 50, example: "Show the product working — satisfying, visual, shareable" },
        { name: "UGC-Style Reviews", percentage: 25, example: "Authentic, low-production 'I just got this and OMG'" },
        { name: "Trending Formats", percentage: 15, example: "Use trending sounds with product as the star" },
        { name: "Comparison/Hack", percentage: 10, example: "This $40 product vs the $200 brand" },
      ],
      bestPlatforms: ["TikTok", "TikTok Shop", "Instagram Reels"],
      boostRule: "Any video that gets 1000+ views in 24 hours → boost on Meta for $20/day targeting women 18-55 (or your demo). Kill after 3 days if CPA > $15.",
    },

    timeline: [
      { week: "Week 1", revenue: "$0", action: "Research products on AliExpress/CJ. Order 2-3 samples. Set up store (Shopify $1/month trial). Start creating content while waiting for samples." },
      { week: "Week 2-3", revenue: "$0-$200", action: "Samples arrive. Film 10+ videos. Post 5/day on TikTok. Test which product and angle gets traction. First sales from organic." },
      { week: "Week 4-6", revenue: "$200-$1,000", action: "Winner found. Scale content on winning product. Start $30/day ads on Meta. Add upsell bundle at checkout. Revenue growing." },
      { week: "Month 2-3", revenue: `$${Math.round(input.targetIncome * 0.3).toLocaleString()}-$${input.targetIncome.toLocaleString()}/mo`, action: "Winner scaled. Email abandoned carts (40%+ recovery). Test 2nd product. Build email list for repeat sales." },
    ],

    automation: [
      { tool: "Shopify", purpose: "Store hosting + checkout", cost: "$1/month first 3 months, then $39/mo" },
      { tool: "DSers or CJ Dropshipping", purpose: "Auto-fulfill orders to supplier", cost: "Free" },
      { tool: "CapCut", purpose: "Edit product videos", cost: "Free" },
      { tool: "Himalaya", purpose: "Email automation, tracking, analytics", cost: "Free" },
      { tool: "TikTok + Instagram", purpose: "Organic product content", cost: "Free" },
      { tool: "Meta Ads", purpose: "Scale winning products", cost: "$30/day when you have a winner" },
    ],

    compliance: [
      "Shipping times must be clearly stated on product page (7-14 days for overseas)",
      "30-day return policy required for customer trust",
      "Don't claim products are 'made in USA' if they're from China",
      "Ad creative must match what customers actually receive",
      "Don't use copyrighted music in ads (use royalty-free or TikTok sounds)",
      "Respond to customer inquiries within 24 hours or chargebacks increase",
      "Never run 'free + shipping' offers — they trigger chargebacks and bans",
    ],
  };
}

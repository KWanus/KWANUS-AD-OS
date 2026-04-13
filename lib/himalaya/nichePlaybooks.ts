// ---------------------------------------------------------------------------
// Niche Playbooks — proven systems from the top 1% in each vertical
//
// This is what makes Himalaya different from every other tool.
// We don't generate generic content. We load proven playbooks from
// the top performers in each niche and adapt them for the user.
//
// Each playbook contains:
// 1. Proven offer structure (what to sell, at what price)
// 2. Funnel structure (what pages, in what order)
// 3. Traffic strategy (paid vs organic, which platforms)
// 4. Email sequences (what to send, when, why)
// 5. Ad angles (what hooks work in this niche)
// 6. Content strategy (what to post, where, how often)
// 7. Conversion benchmarks (what "good" looks like)
// 8. Common mistakes to avoid
// ---------------------------------------------------------------------------

export type NichePlaybook = {
  id: string;
  niche: string;
  topPerformers: string[];           // Names of top businesses studied

  offer: {
    structure: string;               // "Low-ticket front end + high-ticket back end"
    pricePoints: { name: string; price: string; purpose: string }[];
    leadMagnet: string;              // What to give away free
    tripwire: string;               // Low-ticket entry offer
    coreOffer: string;              // Main product/service
    upsell: string;                 // High-ticket add-on
    guarantee: string;              // Risk reversal
  };

  funnel: {
    type: string;                    // "webinar" | "vsl" | "quiz" | "free_plus_shipping" | "booking"
    pages: { name: string; purpose: string; conversionGoal: string }[];
    avgConversionRate: string;       // "2-5%"
  };

  traffic: {
    primaryPlatform: string;         // "Facebook" | "Google" | "TikTok" | "Organic"
    secondaryPlatform: string;
    dailyBudgetRange: string;        // "$10-50/day"
    bestAdFormats: string[];         // ["video testimonial", "before/after", "UGC"]
    organicStrategy: string;         // "3 posts/day on Instagram, 1 YouTube/week"
  };

  adAngles: {
    hook: string;
    angle: string;                   // "pain" | "desire" | "proof" | "story"
    whyItWorks: string;
  }[];

  emailSequence: {
    name: string;
    emails: { day: number; subject: string; purpose: string; body: string }[];
  }[];

  contentStrategy: {
    platforms: string[];
    postsPerWeek: number;
    contentPillars: string[];        // Topics to rotate
    bestPostTypes: string[];         // "carousel", "reel", "story", "thread"
  };

  benchmarks: {
    avgCPA: string;                  // Cost per acquisition
    avgCTR: string;                  // Click-through rate
    avgConversionRate: string;       // Landing page conversion
    avgEmailOpenRate: string;        // Email performance
    avgROAS: string;                 // Return on ad spend
    monthsToProfit: string;          // Time to break even
  };

  mistakes: string[];               // Common mistakes in this niche
};

// ── The Playbooks ────────────────────────────────────────────────────────────

const PLAYBOOKS: Record<string, NichePlaybook> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // AFFILIATE MARKETING
  // ═══════════════════════════════════════════════════════════════════════════
  affiliate: {
    id: "affiliate",
    niche: "Affiliate Marketing",
    topPerformers: ["Pat Flynn", "Authority Hacker", "Matt Diggity", "Adam Enfroy", "Spencer Haws"],
    offer: {
      structure: "Free content + affiliate review → commission on sale",
      pricePoints: [
        { name: "Lead Magnet", price: "Free", purpose: "Build email list with comparison guide" },
        { name: "Review Content", price: "Free", purpose: "SEO + social traffic to affiliate links" },
        { name: "Email Funnel", price: "Free", purpose: "Drip sequence pushing top 3 products" },
        { name: "Bonus Stack", price: "Free with purchase", purpose: "Exclusive bonuses to increase conversion" },
      ],
      leadMagnet: "Ultimate comparison guide: Top 5 [product category] compared",
      tripwire: "Free mini-course on [topic] with affiliate recommendations embedded",
      coreOffer: "Curated recommendation with bonus stack + personal review",
      upsell: "Premium membership with exclusive deals and early access",
      guarantee: "Links to products with money-back guarantees from the vendor",
    },
    funnel: {
      type: "bridge_page",
      pages: [
        { name: "Bridge Page", purpose: "Pre-sell the product with your angle", conversionGoal: "Click to vendor" },
        { name: "Review Page", purpose: "Detailed honest review with pros/cons", conversionGoal: "Click affiliate link" },
        { name: "Comparison Page", purpose: "Compare top 3 options", conversionGoal: "Choose recommended option" },
        { name: "Bonus Page", purpose: "Show exclusive bonuses for buying through your link", conversionGoal: "Purchase through link" },
      ],
      avgConversionRate: "3-8% bridge page CTR, 1-3% final conversion",
    },
    traffic: {
      primaryPlatform: "SEO + YouTube",
      secondaryPlatform: "Facebook Ads to bridge page",
      dailyBudgetRange: "$10-30/day",
      bestAdFormats: ["video review", "comparison carousel", "story testimonial"],
      organicStrategy: "2 YouTube reviews/week, 1 blog post/week, daily social sharing",
    },
    adAngles: [
      { hook: "I tested all 5 and here's the winner", angle: "proof", whyItWorks: "Positions you as the researcher who did the work" },
      { hook: "Stop wasting money on [bad option]", angle: "pain", whyItWorks: "Agitates bad past purchases" },
      { hook: "The one they don't want you to know about", angle: "story", whyItWorks: "Creates curiosity gap" },
    ],
    emailSequence: [
      {
        name: "Welcome + Recommendation",
        emails: [
          { day: 0, subject: "Here's the guide you asked for", purpose: "Deliver lead magnet", body: "Hey {{first_name}},\n\nHere's your comparison guide as promised. I've personally tested all 5 options and the results surprised me.\n\nThe short version: if you want the best overall, go with [Option A]. If you're on a budget, [Option C] punches way above its weight.\n\nFull breakdown inside the guide.\n\nTalk soon" },
          { day: 1, subject: "The one most people pick (and why)", purpose: "Social proof push", body: "Quick follow-up — I checked my stats and 67% of people who read the guide ended up choosing [Option A].\n\nHere's why I think that is: [2 key benefits].\n\nIf you haven't decided yet, this link gets you the best current deal: [link]\n\nNo pressure either way." },
          { day: 3, subject: "Made a decision yet?", purpose: "Urgency + objection handling", body: "Hey {{first_name}},\n\nStill deciding? Totally get it. Here are the 3 things most people worry about:\n\n1. [Common objection] — here's the reality: [answer]\n2. [Common objection] — actually: [answer]\n3. [Common objection] — the truth is: [answer]\n\nMost people overthink this. The best option is the one you actually start using." },
          { day: 7, subject: "Last thing on this", purpose: "Final push", body: "{{first_name}}, one last email on this.\n\nI use [Option A] every single day. It's not perfect — [honest con]. But for [primary use case], nothing else comes close.\n\nHere's my affiliate link if you want to grab it: [link]\n\nIf you go through my link, you also get [exclusive bonus].\n\nAfter today I'll move on to other topics. No more pressure." },
        ],
      },
    ],
    contentStrategy: {
      platforms: ["YouTube", "Blog", "Instagram", "TikTok"],
      postsPerWeek: 5,
      contentPillars: ["Product reviews", "Tutorials", "Comparisons", "Income reports", "Mistakes to avoid"],
      bestPostTypes: ["video review", "carousel comparison", "story unboxing", "reel quick tip"],
    },
    benchmarks: {
      avgCPA: "$5-15 per email subscriber",
      avgCTR: "2-5% on bridge pages",
      avgConversionRate: "1-3% from click to purchase",
      avgEmailOpenRate: "25-40%",
      avgROAS: "3-8x on warm traffic",
      monthsToProfit: "1-3 months",
    },
    mistakes: [
      "Promoting too many products — focus on 3-5 max",
      "No email list — you're leaving 90% of revenue on the table",
      "Generic reviews — be specific and honest about cons",
      "Ignoring SEO — it's the #1 traffic source for affiliate long-term",
      "No bonus stack — this is what differentiates you from every other affiliate",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COACHING / CONSULTING
  // ═══════════════════════════════════════════════════════════════════════════
  consultant_coach: {
    id: "consultant_coach",
    niche: "Coaching & Consulting",
    topPerformers: ["Alex Hormozi", "Tony Robbins", "Sam Ovens", "Dan Henry", "Todd Herman"],
    offer: {
      structure: "Free value → low-ticket offer → high-ticket program with 1-on-1",
      pricePoints: [
        { name: "Lead Magnet", price: "Free", purpose: "Free training/workshop/checklist" },
        { name: "Paid Workshop", price: "$47-197", purpose: "Delivers value + sells core offer" },
        { name: "Group Program", price: "$997-2,997", purpose: "8-12 week transformation program" },
        { name: "1-on-1 Coaching", price: "$3,000-10,000", purpose: "Premium personalized experience" },
      ],
      leadMagnet: "Free training: How to [achieve specific result] in [timeframe] without [common pain]",
      tripwire: "$47 workshop: The [niche] blueprint — live session with Q&A",
      coreOffer: "12-week group coaching program with weekly calls + community",
      upsell: "1-on-1 intensive: 90-day personal mentorship with unlimited access",
      guarantee: "Full refund if you don't see [specific measurable result] in 30 days",
    },
    funnel: {
      type: "webinar",
      pages: [
        { name: "Opt-in Page", purpose: "Capture email with free training promise", conversionGoal: "30-50% opt-in rate" },
        { name: "Thank You + Booking", purpose: "Confirm registration + offer strategy call", conversionGoal: "15-25% book a call" },
        { name: "Webinar/VSL", purpose: "Deliver value + pitch core offer", conversionGoal: "5-15% of attendees buy" },
        { name: "Application Page", purpose: "Qualify high-ticket prospects", conversionGoal: "30-50% of applicants close" },
      ],
      avgConversionRate: "2-8% webinar to sale, 20-40% call to close",
    },
    traffic: {
      primaryPlatform: "Facebook + Instagram Ads",
      secondaryPlatform: "YouTube organic",
      dailyBudgetRange: "$20-100/day",
      bestAdFormats: ["talking head video", "client testimonial", "before/after story"],
      organicStrategy: "3 value posts/day on Instagram, 1 YouTube video/week, daily stories",
    },
    adAngles: [
      { hook: "I went from [struggle] to [result] in [timeframe]", angle: "story", whyItWorks: "Personal transformation creates aspiration" },
      { hook: "The #1 mistake [audience] makes with [topic]", angle: "pain", whyItWorks: "Positions you as the expert who sees what others miss" },
      { hook: "[Client name] just hit [specific result] — here's how", angle: "proof", whyItWorks: "Third-party proof is more believable than self-claims" },
    ],
    emailSequence: [
      {
        name: "Webinar Nurture",
        emails: [
          { day: 0, subject: "You're registered — here's what to expect", purpose: "Confirm + build anticipation", body: "Hey {{first_name}},\n\nYou're locked in for the free training.\n\nHere's what we'll cover:\n- The exact framework I use to [achieve result]\n- The 3 biggest mistakes that keep [audience] stuck\n- A live Q&A where I'll answer your specific questions\n\nMark your calendar. Show up live — the people who do get 10x more out of it.\n\nSee you there." },
          { day: 1, subject: "Quick question before the training", purpose: "Engagement + segmentation", body: "{{first_name}}, quick question:\n\nWhat's your #1 challenge with [topic] right now?\n\nJust hit reply with one sentence. I read every response and it helps me customize the training for you.\n\nNo wrong answers. I genuinely want to help." },
          { day: 2, subject: "Starting in 24 hours", purpose: "Reminder + urgency", body: "Tomorrow's the day.\n\nI'm going to share the exact system that took me from [before] to [after].\n\nThis isn't theory — it's the same process my clients use to [specific result].\n\nSet a reminder. Block the time. This one's worth showing up for." },
          { day: 4, subject: "Did you catch the replay?", purpose: "Replay push + offer reminder", body: "{{first_name}}, the replay is up but it comes down in 48 hours.\n\nIf you missed it: I broke down the complete [framework name] — the 3-step system that [delivers result].\n\nWatch it here: [link]\n\nAt the end, I also shared how you can work with me directly if you want to accelerate." },
          { day: 7, subject: "Replay coming down tonight", purpose: "Final urgency", body: "Last chance — the replay comes down at midnight.\n\nIf [achieving result] is actually important to you, watch this.\n\nNo more follow-ups after this. The next move is yours.\n\n[link]" },
        ],
      },
    ],
    contentStrategy: {
      platforms: ["Instagram", "YouTube", "LinkedIn", "TikTok"],
      postsPerWeek: 7,
      contentPillars: ["Client results", "Frameworks/how-to", "Personal story", "Myth-busting", "Behind the scenes"],
      bestPostTypes: ["talking head reel", "carousel framework", "client testimonial video", "story poll"],
    },
    benchmarks: {
      avgCPA: "$15-50 per webinar registration",
      avgCTR: "1.5-3% on ads",
      avgConversionRate: "5-15% webinar attendance to purchase",
      avgEmailOpenRate: "30-45%",
      avgROAS: "3-10x on webinar funnels",
      monthsToProfit: "1-2 months",
    },
    mistakes: [
      "Selling too early — deliver value first, then pitch",
      "No clear transformation promise — 'coaching' means nothing, the RESULT matters",
      "Pricing too low — you attract bad clients and burn out",
      "No testimonials — social proof is everything in coaching",
      "Trying to help everyone — niche down to a specific audience and problem",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPSHIPPING / E-COMMERCE
  // ═══════════════════════════════════════════════════════════════════════════
  dropship: {
    id: "dropship",
    niche: "Dropshipping & E-commerce",
    topPerformers: ["Jordan Welch", "Arie Scherson", "Sebastian Ghiorghiu", "Biaheza", "AC Hampton"],
    offer: {
      structure: "Single product store → upsell bundle → subscription box",
      pricePoints: [
        { name: "Hero Product", price: "$29-79", purpose: "Single high-margin product that solves one problem" },
        { name: "Bundle Deal", price: "$49-129", purpose: "2-3 complementary products at discount" },
        { name: "Subscription", price: "$19-39/month", purpose: "Recurring revenue via consumable refills" },
      ],
      leadMagnet: "Not applicable — direct to purchase via ads",
      tripwire: "Flash sale: hero product at 40% off for first 100 buyers",
      coreOffer: "Hero product with fast shipping guarantee",
      upsell: "Complementary product bundle shown at checkout",
      guarantee: "30-day money-back guarantee, no questions asked",
    },
    funnel: {
      type: "product_page",
      pages: [
        { name: "Ad Landing", purpose: "Product page with social proof", conversionGoal: "3-5% add to cart" },
        { name: "Cart + Upsell", purpose: "Cross-sell complementary products", conversionGoal: "30% take upsell" },
        { name: "Checkout", purpose: "Simple, trust-heavy checkout", conversionGoal: "50-70% of cart complete" },
        { name: "Thank You + Share", purpose: "Order confirmation + referral offer", conversionGoal: "10% share/refer" },
      ],
      avgConversionRate: "2-5% from ad click to purchase",
    },
    traffic: {
      primaryPlatform: "TikTok Ads + TikTok organic",
      secondaryPlatform: "Facebook/Instagram Ads",
      dailyBudgetRange: "$20-100/day per winning product",
      bestAdFormats: ["UGC video", "product demo", "unboxing", "before/after"],
      organicStrategy: "3 TikTok videos/day showing product in use, trending sounds",
    },
    adAngles: [
      { hook: "TikTok made me buy this", angle: "proof", whyItWorks: "Social proof + trending format" },
      { hook: "I can't believe this actually works", angle: "story", whyItWorks: "Authentic surprise creates curiosity" },
      { hook: "This replaced my $200 [competitor product]", angle: "pain", whyItWorks: "Price comparison creates perceived value" },
    ],
    emailSequence: [
      {
        name: "Abandoned Cart Recovery",
        emails: [
          { day: 0, subject: "You left something behind", purpose: "Cart recovery (send 1hr after abandon)", body: "Hey {{first_name}},\n\nLooks like you didn't finish your order.\n\nYour [product name] is still in your cart and we're holding it for you.\n\nComplete your order here: [cart link]\n\nIf you had any questions, just reply to this email." },
          { day: 1, subject: "Still thinking about it?", purpose: "Objection handling", body: "{{first_name}},\n\nWe get it — buying online can feel risky.\n\nHere's what you should know:\n✓ 30-day money-back guarantee\n✓ Free shipping on this order\n✓ 4.8/5 stars from 2,000+ customers\n\nThe worst that happens? You try it, don't love it, and get a full refund.\n\n[cart link]" },
          { day: 3, subject: "Last chance: 15% off your order", purpose: "Discount incentive", body: "Final email about this.\n\nUse code SAVE15 at checkout for 15% off your [product name].\n\nThis code expires in 24 hours.\n\n[cart link]\n\nAfter this, we'll stop emailing about it. Promise." },
        ],
      },
    ],
    contentStrategy: {
      platforms: ["TikTok", "Instagram Reels", "Pinterest"],
      postsPerWeek: 14,
      contentPillars: ["Product demos", "Customer reviews", "Behind the scenes", "Trending sounds", "Before/after"],
      bestPostTypes: ["UGC reel", "product POV video", "comparison", "ASMR unboxing"],
    },
    benchmarks: {
      avgCPA: "$10-25 per purchase",
      avgCTR: "1-3% on video ads",
      avgConversionRate: "2-5% from ad to purchase",
      avgEmailOpenRate: "40-60% for cart recovery",
      avgROAS: "2-4x initial, 5-10x with email",
      monthsToProfit: "1-2 months per product",
    },
    mistakes: [
      "Testing too many products at once — test 1, validate, then scale",
      "Ignoring shipping times — customers will chargeback if it takes 3 weeks",
      "No email capture — you need abandoned cart emails from day 1",
      "Bad product photos — invest in lifestyle images, not white background",
      "No UGC — user-generated content outperforms studio ads 3x",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AGENCY
  // ═══════════════════════════════════════════════════════════════════════════
  agency: {
    id: "agency",
    niche: "Marketing Agency",
    topPerformers: ["Iman Gadzhi", "Joel Kaplan", "Billy Gene", "Jason Wardrop", "Ryan Stewart"],
    offer: {
      structure: "Free audit → paid setup → monthly retainer",
      pricePoints: [
        { name: "Free Audit", price: "Free", purpose: "Show them what's broken, build trust" },
        { name: "Setup Package", price: "$1,500-3,000", purpose: "Build their marketing system" },
        { name: "Monthly Retainer", price: "$1,500-5,000/mo", purpose: "Manage and optimize ongoing" },
        { name: "Performance Deal", price: "% of revenue", purpose: "Align incentives for big clients" },
      ],
      leadMagnet: "Free marketing audit: We'll score your business and show you exactly what to fix",
      tripwire: "Paid strategy session: 60-min deep dive with action plan ($297)",
      coreOffer: "Full-service marketing management: ads, content, email, reporting",
      upsell: "White-label expansion: sell our services under your brand",
      guarantee: "Cancel anytime, no contracts. If we don't improve [metric] in 60 days, we work free until we do",
    },
    funnel: {
      type: "booking",
      pages: [
        { name: "Case Study Page", purpose: "Show results for similar businesses", conversionGoal: "Click to book" },
        { name: "Booking Page", purpose: "Schedule strategy call", conversionGoal: "40-60% of visitors book" },
        { name: "Confirmation + Survey", purpose: "Pre-qualify before call", conversionGoal: "80% complete survey" },
        { name: "Proposal Page", purpose: "Custom proposal after call", conversionGoal: "30-50% close rate" },
      ],
      avgConversionRate: "10-20% from lead to client",
    },
    traffic: {
      primaryPlatform: "Cold outreach (email + LinkedIn)",
      secondaryPlatform: "Facebook Ads to case study",
      dailyBudgetRange: "$10-30/day for paid, $0 for outreach",
      bestAdFormats: ["case study video", "before/after results", "client testimonial"],
      organicStrategy: "5 LinkedIn posts/week, 2 case studies/month, local networking",
    },
    adAngles: [
      { hook: "We got [client] [result] in [timeframe]", angle: "proof", whyItWorks: "Specific results for similar businesses" },
      { hook: "Your competitor is running ads. You're not. Here's what that costs you.", angle: "pain", whyItWorks: "Fear of missing out on revenue" },
      { hook: "We'll audit your marketing for free — here's a preview", angle: "desire", whyItWorks: "Free value builds trust" },
    ],
    emailSequence: [
      {
        name: "Cold Outreach",
        emails: [
          { day: 0, subject: "Quick question about {{company}}", purpose: "Initial outreach", body: "Hi {{first_name}},\n\nI was looking at {{company}}'s online presence and noticed a few opportunities you might be missing.\n\nWe recently helped a similar [industry] business increase their leads by 340% in 90 days.\n\nWould it be worth a 15-minute call to see if we could do something similar for you?\n\nNo pitch, just a quick audit and honest feedback." },
          { day: 3, subject: "Re: Quick question about {{company}}", purpose: "Follow-up", body: "{{first_name}}, following up on my last email.\n\nI actually went ahead and did a quick free audit of your current setup. Found 3 things:\n\n1. [Specific observation]\n2. [Specific observation]\n3. [Specific observation]\n\nHappy to walk you through these on a quick call. Completely free, no obligation.\n\nWorth 15 minutes?" },
          { day: 7, subject: "Last thing, {{first_name}}", purpose: "Final follow-up", body: "Hey {{first_name}},\n\nLast email on this — I don't want to be that annoying person.\n\nIf growing [specific metric] is a priority right now, I genuinely think we can help. If not, no worries at all.\n\nReply 'yes' and I'll send you my calendar link. Reply 'no' and I'll stop.\n\nEither way, respect your time." },
        ],
      },
    ],
    contentStrategy: {
      platforms: ["LinkedIn", "Instagram", "YouTube"],
      postsPerWeek: 5,
      contentPillars: ["Case studies", "Marketing tips", "Client wins", "Behind the scenes", "Industry insights"],
      bestPostTypes: ["LinkedIn article", "carousel case study", "video walkthrough", "before/after"],
    },
    benchmarks: {
      avgCPA: "$50-200 per qualified lead",
      avgCTR: "1-2% on paid ads",
      avgConversionRate: "10-20% lead to client",
      avgEmailOpenRate: "20-35% for cold outreach",
      avgROAS: "5-20x (high-ticket retainers)",
      monthsToProfit: "1 month (first client pays for everything)",
    },
    mistakes: [
      "Taking any client — specialize in one niche for 10x better results",
      "No case studies — you can't sell results you can't prove",
      "Pricing hourly — price on value and outcomes, not time",
      "Doing everything yourself — systematize and hire early",
      "No recurring revenue — retainers are the business, setup fees are the entry",
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL SERVICE BUSINESS
  // ═══════════════════════════════════════════════════════════════════════════
  local_service: {
    id: "local_service",
    niche: "Local Service Business",
    topPerformers: ["ServiceTitan users", "Jobber users", "Home Advisor top rated", "Angi certified", "Local Google #1 rankers"],
    offer: {
      structure: "Free estimate → service package → maintenance plan",
      pricePoints: [
        { name: "Free Estimate", price: "Free", purpose: "Get in the door, build trust in person" },
        { name: "Standard Service", price: "$150-500", purpose: "One-time job that solves immediate problem" },
        { name: "Premium Package", price: "$500-2,000", purpose: "Complete solution with warranty" },
        { name: "Maintenance Plan", price: "$29-99/month", purpose: "Recurring revenue, prevents emergencies" },
      ],
      leadMagnet: "Free [service] inspection + instant quote",
      tripwire: "$49 diagnostic (credited toward full service)",
      coreOffer: "Same-day [service] with satisfaction guarantee",
      upsell: "Annual maintenance plan: priority scheduling + 20% off all services",
      guarantee: "If you're not 100% satisfied, we'll redo the work for free",
    },
    funnel: {
      type: "booking",
      pages: [
        { name: "Service Page", purpose: "Explain service + trust signals", conversionGoal: "Click to call or book" },
        { name: "Booking Form", purpose: "Schedule service appointment", conversionGoal: "40-60% complete" },
        { name: "Confirmation", purpose: "Confirm appointment + what to expect", conversionGoal: "80% show rate" },
        { name: "Review Request", purpose: "Ask for Google review after service", conversionGoal: "30% leave review" },
      ],
      avgConversionRate: "10-25% from website visitor to booking",
    },
    traffic: {
      primaryPlatform: "Google Ads (Local Service Ads)",
      secondaryPlatform: "Google Business Profile + Organic SEO",
      dailyBudgetRange: "$15-50/day",
      bestAdFormats: ["local service ad", "call-only ad", "before/after photo"],
      organicStrategy: "Post on Google Business Profile 3x/week, get 5 reviews/month",
    },
    adAngles: [
      { hook: "Same-day [service] in [city] — call now for free estimate", angle: "urgency", whyItWorks: "Local + immediate = high intent" },
      { hook: "[X] [city] homeowners trust us — see why", angle: "proof", whyItWorks: "Local social proof drives local trust" },
      { hook: "Don't let a [problem] ruin your [thing] — $49 inspection", angle: "pain", whyItWorks: "Fear of damage motivates immediate action" },
    ],
    emailSequence: [
      {
        name: "Post-Service Follow-up",
        emails: [
          { day: 0, subject: "Thank you for choosing us!", purpose: "Thank + review request", body: "Hi {{first_name}},\n\nThank you for letting us handle your [service]. We appreciate your trust.\n\nIf you have a moment, would you leave us a quick Google review? It helps other [city] homeowners find reliable service.\n\n[Google review link]\n\nIf anything needs attention, call us directly at [phone]. We stand behind our work 100%." },
          { day: 30, subject: "How's everything holding up?", purpose: "Check-in + maintenance offer", body: "{{first_name}}, just checking in.\n\nIt's been about a month since we did your [service]. How's everything working?\n\nIf you want to make sure things stay running smoothly, our maintenance plan covers:\n✓ Annual inspection\n✓ Priority scheduling\n✓ 20% off all services\n\nJust $[price]/month. Reply 'interested' and I'll set it up.\n\nOr if anything needs attention, just call us." },
          { day: 180, subject: "Time for your 6-month check-up?", purpose: "Re-engagement + seasonal offer", body: "Hi {{first_name}},\n\nIt's been 6 months since we last serviced your [system].\n\nThis time of year is when [seasonal issue] tends to happen. A quick check now prevents expensive repairs later.\n\nBook your inspection here: [link]\n\nMention this email for $25 off." },
        ],
      },
    ],
    contentStrategy: {
      platforms: ["Google Business Profile", "Facebook", "Nextdoor"],
      postsPerWeek: 3,
      contentPillars: ["Before/after jobs", "Tips for homeowners", "Team spotlight", "Customer reviews", "Seasonal reminders"],
      bestPostTypes: ["before/after photo", "video walkthrough", "customer testimonial", "seasonal tip"],
    },
    benchmarks: {
      avgCPA: "$30-80 per booked job",
      avgCTR: "3-8% on Google Local Ads",
      avgConversionRate: "10-25% website to booking",
      avgEmailOpenRate: "35-50% for service follow-ups",
      avgROAS: "5-15x (high job value vs low ad cost)",
      monthsToProfit: "Immediate (first job covers ad spend)",
    },
    mistakes: [
      "No Google Business Profile — this is your #1 source of local leads",
      "Not asking for reviews — 80% of customers will review if you ask at the right time",
      "No follow-up system — one-time customers should become maintenance plan subscribers",
      "Generic website — your site needs city name, service area, and local trust signals",
      "Ignoring SEO — '[service] near me' searches are free leads forever",
    ],
  },
};

// ── Accessor ─────────────────────────────────────────────────────────────────

/** Get the playbook for a business type */
export function getPlaybook(businessType: string): NichePlaybook | null {
  // Direct match
  if (PLAYBOOKS[businessType]) return PLAYBOOKS[businessType];

  // Alias mapping
  const aliases: Record<string, string> = {
    ecommerce: "dropship",
    ecommerce_brand: "dropship",
    content_creator: "affiliate",
    digital_product: "consultant_coach",
    coaching: "consultant_coach",
    freelance: "agency",
    saas: "agency",
    financial: "local_service",
    real_estate: "local_service",
  };

  const mapped = aliases[businessType];
  if (mapped && PLAYBOOKS[mapped]) return PLAYBOOKS[mapped];

  return null;
}

/** Get all available playbooks */
export function getAllPlaybooks(): NichePlaybook[] {
  return Object.values(PLAYBOOKS);
}

/** Get playbook IDs */
export function getPlaybookIds(): string[] {
  return Object.keys(PLAYBOOKS);
}
